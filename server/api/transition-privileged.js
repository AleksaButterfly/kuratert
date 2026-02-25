const sharetribeSdk = require('sharetribe-flex-sdk');
const { transactionLineItems, calculateTaxInfo } = require('../api-util/lineItems');
const { calculateShippingFee } = require('../api-util/lineItemHelpers');
const {
  addOfferToMetadata,
  getAmountFromPreviousOffer,
  isIntentionToMakeCounterOffer,
  isIntentionToMakeOffer,
  isIntentionToRevokeCounterOffer,
  throwErrorIfNegotiationOfferHasInvalidHistory,
} = require('../api-util/negotiation');
const { isTaxEnabled } = require('../api-util/stripeTax');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

const { Money } = sharetribeSdk.types;

const transactionPromise = (sdk, id) => sdk.transactions.show({ id, include: ['listing'] });
const getListingRelationShip = transactionShowAPIData => {
  const { data, included } = transactionShowAPIData;
  const { relationships } = data;
  const { listing: listingRef } = relationships;
  return included.find(i => i.id.uuid === listingRef.data.id.uuid);
};

const getFullOrderData = (orderData, bodyParams, currency, offers, transaction) => {
  const { offerInSubunits } = orderData || {};
  const transitionName = bodyParams.transition;

  // Include unitType from transaction's protectedData for negotiated-purchase transactions
  const transactionUnitType = transaction?.attributes?.protectedData?.unitType;
  const unitTypeMaybe = transactionUnitType ? { unitType: transactionUnitType } : {};

  const orderDataAndParams = { ...orderData, ...bodyParams.params, currency, ...unitTypeMaybe };

  // For REQUEST_PAYMENT in negotiated-purchase, get the accepted offer from metadata
  const isRequestPaymentInNegotiatedPurchase = transitionName === 'transition/request-payment' &&
    transaction?.attributes?.protectedData?.unitType === 'negotiatedItem';

  if (isRequestPaymentInNegotiatedPurchase) {
    // Get the latest offer price from metadata.offers (more reliable than line items)
    const metadataOffers = transaction?.attributes?.metadata?.offers || [];
    const latestOffer = metadataOffers[metadataOffers.length - 1];
    const existingOfferAmount = latestOffer?.offerInSubunits;

    if (existingOfferAmount) {
      return {
        ...orderDataAndParams,
        offer: new Money(existingOfferAmount, currency),
      };
    }

    // Fallback: try to get from existing line items
    const negotiatedLineItem = transaction?.attributes?.lineItems?.find(
      item => item.code === 'line-item/negotiatedItem' && !item.reversal
    );
    const lineItemOfferAmount = negotiatedLineItem?.unitPrice?.amount;

    if (lineItemOfferAmount) {
      return {
        ...orderDataAndParams,
        offer: new Money(lineItemOfferAmount, currency),
      };
    }
  }

  return isIntentionToMakeOffer(offerInSubunits, transitionName) ||
    isIntentionToMakeCounterOffer(offerInSubunits, transitionName)
    ? {
        ...orderDataAndParams,
        offer: new Money(offerInSubunits, currency),
      }
    : isIntentionToRevokeCounterOffer(transitionName)
    ? {
        ...orderDataAndParams,
        offer: new Money(getAmountFromPreviousOffer(offers), currency),
      }
    : orderDataAndParams;
};

const getUpdatedMetadata = (orderData, transition, existingMetadata) => {
  const { actor, offerInSubunits } = orderData || {};
  // NOTE: for default-negotiation process, the actor is always "provider" when making an offer.
  const hasActor = ['provider', 'customer'].includes(actor);
  const by = hasActor ? actor : null;

  const isNewOffer =
    isIntentionToMakeOffer(offerInSubunits, transition) ||
    isIntentionToMakeCounterOffer(offerInSubunits, transition);

  return isNewOffer
    ? addOfferToMetadata(existingMetadata, {
        offerInSubunits,
        by,
        transition,
      })
    : isIntentionToRevokeCounterOffer(transition)
    ? addOfferToMetadata(existingMetadata, {
        offerInSubunits: getAmountFromPreviousOffer(existingMetadata.offers),
        by,
        transition,
      })
    : addOfferToMetadata(existingMetadata, null);
};

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const sdk = getSdk(req, res);
  const transitionName = bodyParams.transition;

  // Cancel transitions don't need line items - just execute the transition
  const isCancelTransition = transitionName === 'transition/cancel-payment-klarna' ||
    transitionName === 'transition/operator-cancel-payment-klarna';

  if (isCancelTransition) {
    getTrustedSdk(req)
      .then(trustedSdk => {
        const body = {
          ...bodyParams,
          params: bodyParams?.params || {},
        };
        return trustedSdk.transactions.transition(body, queryParams);
      })
      .then(apiResponse => {
        const { status, statusText, data } = apiResponse;
        res
          .status(status)
          .set('Content-Type', 'application/transit+json')
          .send(
            serialize({
              status,
              statusText,
              data,
            })
          )
          .end();
      })
      .catch(e => {
        handleError(res, e);
      });
    return;
  }

  let lineItems = null;
  let metadataMaybe = {};

  Promise.all([transactionPromise(sdk, bodyParams?.id), fetchCommission(sdk)])
    .then(async responses => {
      const [showTransactionResponse, fetchAssetsResponse] = responses;
      const transaction = showTransactionResponse.data.data;
      const listing = getListingRelationShip(showTransactionResponse.data);
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const existingMetadata = transaction?.attributes?.metadata;
      const existingOffers = existingMetadata?.offers || [];
      const transitions = transaction.attributes.transitions;

      // Check if the transition is related to negotiation offers and if the offers are valid
      throwErrorIfNegotiationOfferHasInvalidHistory(transitionName, existingOffers, transitions);

      const currency =
        transaction.attributes.payinTotal?.currency ||
        listing.attributes.price?.currency ||
        orderData.currency;
      const publicData = listing.attributes?.publicData || {};
      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      // Calculate tax if enabled and shipping details are provided
      let taxInfo = null;
      const shippingDetails = bodyParams?.params?.protectedData?.shippingDetails ||
        transaction?.attributes?.protectedData?.shippingDetails;
      if (isTaxEnabled() && shippingDetails) {
        const shippingAddress = {
          country: shippingDetails.country,
          postalCode: shippingDetails.postalCode,
          city: shippingDetails.city,
          line1: shippingDetails.streetAddress,
        };

        // Calculate order total from existing line items or listing price
        const quantity = orderData?.quantity || 1;
        const itemPrice = listing.attributes?.price?.amount || 0;
        let orderTotal = itemPrice * quantity;

        // Calculate shipping total
        const deliveryMethod = orderData?.deliveryMethod ||
          transaction?.attributes?.protectedData?.deliveryMethod;
        let shippingTotal = 0;
        if (deliveryMethod === 'shipping') {
          const shippingFee = calculateShippingFee(
            publicData.shippingPriceInSubunitsOneItem,
            publicData.shippingPriceInSubunitsAdditionalItems,
            currency,
            quantity
          );
          shippingTotal = shippingFee?.amount || 0;
        }

        // Calculate frame total
        const frameInfo = orderData?.frameInfo ||
          transaction?.attributes?.protectedData?.mainListingFrameInfo;
        const frameTotal = parseInt(frameInfo?.framePriceInSubunits, 10) || 0;

        // Calculate tax
        taxInfo = await calculateTaxInfo({
          orderTotal,
          shippingTotal,
          frameTotal,
          shippingAddress,
          currency,
        });
      }

      lineItems = transactionLineItems(
        listing,
        getFullOrderData(orderData, bodyParams, currency, existingOffers, transaction),
        providerCommission,
        customerCommission,
        [], // cart listings (not needed for transitions)
        taxInfo // Pass tax info for tax line item
      );

      metadataMaybe = getUpdatedMetadata(orderData, transitionName, existingMetadata);

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      // Omit listingId from params (transition/request-payment-after-inquiry does not need it)
      const { listingId, ...restParams } = bodyParams?.params || {};

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...restParams,
          lineItems,
          ...metadataMaybe,
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.transitionSpeculative(body, queryParams);
      }
      return trustedSdk.transactions.transition(body, queryParams);
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
