const sharetribeSdk = require('sharetribe-flex-sdk');
const { transactionLineItems } = require('../api-util/lineItems');
const { isIntentionToMakeOffer } = require('../api-util/negotiation');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

const { Money } = sharetribeSdk.types;

const listingPromise = (sdk, id) => sdk.listings.show({ id });

const getFullOrderData = (orderData, bodyParams, currency) => {
  const { offerInSubunits } = orderData || {};
  const transitionName = bodyParams.transition;

  return isIntentionToMakeOffer(offerInSubunits, transitionName)
    ? {
        ...orderData,
        ...bodyParams.params,
        currency,
        offer: new Money(offerInSubunits, currency),
      }
    : { ...orderData, ...bodyParams.params };
};

const getMetadata = (orderData, transition) => {
  const { actor, offerInSubunits } = orderData || {};
  // NOTE: for now, the actor is always "provider".
  const hasActor = ['provider', 'customer'].includes(actor);
  const by = hasActor ? actor : null;

  return isIntentionToMakeOffer(offerInSubunits, transition)
    ? {
        metadata: {
          offers: [
            {
              offerInSubunits,
              by,
              transition,
            },
          ],
        },
      }
    : {};
};

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;
  const transitionName = bodyParams.transition;
  const sdk = getSdk(req, res);
  let lineItems = null;
  let metadataMaybe = {};

  // If we have cart items, fetch all their listings too
  const cartItems = orderData?.cartItems || [];
  const cartListingIds = cartItems.map(item => item.id).filter(Boolean);

  const cartListingsPromise = cartListingIds.length > 0
    ? sdk.listings.query({ ids: cartListingIds, include: [] })
    : Promise.resolve({ data: { data: [] } });

  // Fetch main listing
  Promise.all([
    listingPromise(sdk, bodyParams?.params?.listingId),
    fetchCommission(sdk),
    cartListingsPromise
  ])
    .then(results => {
      const showListingResponse = results[0];
      const fetchAssetsResponse = results[1];
      const cartListingsResponse = results[2];

      const listing = showListingResponse.data.data;
      const cartListings = cartListingsResponse.data.data || [];
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const currency = listing.attributes.price?.currency || orderData.currency;
      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      // cartItems are already transformed on client-side with only essential data (id, title, price, imageUrl)
      lineItems = transactionLineItems(
        listing,
        getFullOrderData(orderData, bodyParams, currency),
        providerCommission,
        customerCommission,
        cartListings // Pass cart listings for shipping calculation
      );
      metadataMaybe = getMetadata(orderData, transitionName);

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      const { params } = bodyParams;

      // Extract paymentMethodTypes if present (for Klarna and other push payment methods)
      const paymentMethodTypesMaybe = params.paymentMethodTypes
        ? { paymentMethodTypes: params.paymentMethodTypes }
        : {};

      // Add lineItems and protectedData to the body params
      const body = {
        ...bodyParams,
        params: {
          ...params,
          ...paymentMethodTypesMaybe,
          lineItems,
          ...metadataMaybe,
          // Merge with existing protectedData (cartItems already serialized by client if present)
          protectedData: {
            ...params.protectedData, // Keep existing protectedData (unitType, cartItems if already there)
            ...(orderData.deliveryMethod ? { deliveryMethod: orderData.deliveryMethod } : {}),
          },
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.initiateSpeculative(body, queryParams);
      }

      return trustedSdk.transactions.initiate(body, queryParams);
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
