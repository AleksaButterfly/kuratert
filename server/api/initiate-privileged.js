const sharetribeSdk = require('sharetribe-flex-sdk');
const { transactionLineItems, calculateTaxInfo } = require('../api-util/lineItems');
const { calculateShippingFee } = require('../api-util/lineItemHelpers');
const { isIntentionToMakeOffer } = require('../api-util/negotiation');
const { isTaxEnabled } = require('../api-util/stripeTax');
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

module.exports = async (req, res) => {
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
    .then(async results => {
      const showListingResponse = results[0];
      const fetchAssetsResponse = results[1];
      const cartListingsResponse = results[2];

      const listing = showListingResponse.data.data;
      const cartListings = cartListingsResponse.data.data || [];
      const commissionAsset = fetchAssetsResponse.data.data[0];

      const currency = listing.attributes.price?.currency || orderData.currency;
      const publicData = listing.attributes?.publicData || {};
      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      // Calculate tax if enabled and shipping details are provided
      let taxInfo = null;
      const shippingDetails = bodyParams?.params?.protectedData?.shippingDetails;
      console.log('[Tax] initiate-privileged - shippingDetails:', shippingDetails);
      console.log('[Tax] initiate-privileged - isTaxEnabled:', isTaxEnabled());
      if (isTaxEnabled() && shippingDetails) {
        const shippingAddress = {
          country: shippingDetails.country,
          postalCode: shippingDetails.postalCode,
          city: shippingDetails.city,
          line1: shippingDetails.streetAddress,
        };

        // Calculate order total
        const quantity = orderData?.quantity || 1;
        const itemPrice = listing.attributes?.price?.amount || 0;
        let orderTotal = itemPrice * quantity;

        // Add cart items to order total
        if (cartItems.length > 0) {
          cartItems.forEach(item => {
            const cartItemPrice = item.price?.amount || 0;
            const cartItemQty = item.quantity || 1;
            orderTotal += cartItemPrice * cartItemQty;
          });
        }

        // Calculate shipping total
        const deliveryMethod = orderData?.deliveryMethod;
        let shippingTotal = 0;
        if (deliveryMethod === 'shipping') {
          const shippingFee = calculateShippingFee(
            publicData.shippingPriceInSubunitsOneItem,
            publicData.shippingPriceInSubunitsAdditionalItems,
            currency,
            quantity
          );
          shippingTotal = shippingFee?.amount || 0;

          // Add cart items shipping
          if (cartListings.length > 0) {
            cartItems.forEach(item => {
              const cartListing = cartListings.find(l => l.id.uuid === item.id);
              if (cartListing) {
                const cartPubData = cartListing.attributes?.publicData || {};
                const cartShipping = calculateShippingFee(
                  cartPubData.shippingPriceInSubunitsOneItem,
                  cartPubData.shippingPriceInSubunitsAdditionalItems,
                  currency,
                  item.quantity || 1
                );
                shippingTotal += cartShipping?.amount || 0;
              }
            });
          }
        }

        // Calculate frame total
        const frameInfo = orderData?.frameInfo;
        const frameTotal = parseInt(frameInfo?.framePriceInSubunits, 10) || 0;

        // Calculate tax
        taxInfo = await calculateTaxInfo({
          orderTotal,
          shippingTotal,
          frameTotal,
          shippingAddress,
          currency,
        });
        console.log('[Tax] initiate-privileged - taxInfo result:', taxInfo);
      }

      // cartItems are already transformed on client-side with only essential data (id, title, price, imageUrl)
      lineItems = transactionLineItems(
        listing,
        getFullOrderData(orderData, bodyParams, currency),
        providerCommission,
        customerCommission,
        cartListings, // Pass cart listings for shipping calculation
        taxInfo // Pass tax info for tax line item
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
