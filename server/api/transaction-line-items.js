const { transactionLineItems, calculateTaxInfo } = require('../api-util/lineItems');
const { getSdk, handleError, serialize, fetchCommission } = require('../api-util/sdk');
const { constructValidLineItems, calculateShippingFee } = require('../api-util/lineItemHelpers');
const { isTaxEnabled } = require('../api-util/stripeTax');
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

module.exports = async (req, res) => {
  const { isOwnListing, listingId, orderData, shippingAddress } = req.body;

  const sdk = getSdk(req, res);

  // Check if we have cart items to fetch additional listings
  const cartItems = orderData?.protectedData?.cartItems || [];
  const hasCartItems = cartItems.length > 1; // More than 1 means additional items beyond the main listing

  // Get all listing IDs we need to fetch
  const additionalListingIds = hasCartItems
    ? cartItems.slice(1).map(item => item.listingId) // Skip first as it's the main listing
    : [];

  const listingPromise = () =>
    isOwnListing ? sdk.ownListings.show({ id: listingId }) : sdk.listings.show({ id: listingId });

  // Fetch additional cart item listings if needed
  const additionalListingsPromise = () =>
    additionalListingIds.length > 0
      ? sdk.listings.query({ ids: additionalListingIds })
      : Promise.resolve({ data: { data: [] } });

  try {
    const [showListingResponse, additionalListingsResponse, fetchAssetsResponse] = await Promise.all([
      listingPromise(),
      additionalListingsPromise(),
      fetchCommission(sdk),
    ]);

    const listing = showListingResponse.data.data;
    const additionalListings = additionalListingsResponse.data.data || [];
    const commissionAsset = fetchAssetsResponse.data.data[0];

    const { providerCommission, customerCommission } =
      commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

    // If we have cart items, pass additional listings to lineItems
    const orderDataWithCartListings = hasCartItems
      ? {
          ...orderData,
          cartListings: additionalListings,
        }
      : orderData;

    const publicData = listing.attributes?.publicData || {};
    const currency = listing.attributes?.price?.currency || 'NOK';

    // Calculate tax if enabled and shipping address is provided
    let taxInfo = null;
    if (isTaxEnabled() && shippingAddress && shippingAddress.country) {
      // Calculate order total (items)
      const quantity = orderData?.stockReservationQuantity || 1;
      const itemPrice = listing.attributes?.price?.amount || 0;
      let orderTotal = itemPrice * quantity;

      // Add cart items to order total
      if (hasCartItems && cartItems.length > 0) {
        cartItems.slice(1).forEach(item => {
          const cartItemListing = additionalListings.find(l => l.id.uuid === item.listingId);
          if (cartItemListing) {
            const cartItemPrice = cartItemListing.attributes?.price?.amount || 0;
            const cartItemQty = item.quantity || 1;
            orderTotal += cartItemPrice * cartItemQty;
          }
        });
      }

      // Calculate shipping total
      const deliveryMethod = orderData?.deliveryMethod;
      let shippingTotal = 0;
      if (deliveryMethod === 'shipping') {
        const { shippingPriceInSubunitsOneItem, shippingPriceInSubunitsAdditionalItems } = publicData;
        const shippingFee = calculateShippingFee(
          shippingPriceInSubunitsOneItem,
          shippingPriceInSubunitsAdditionalItems,
          currency,
          quantity
        );
        shippingTotal = shippingFee?.amount || 0;

        // Add cart items shipping
        if (hasCartItems && additionalListings.length > 0) {
          cartItems.slice(1).forEach(item => {
            const cartItemListing = additionalListings.find(l => l.id.uuid === item.listingId);
            if (cartItemListing) {
              const cartPubData = cartItemListing.attributes?.publicData || {};
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
    }

    const lineItems = transactionLineItems(
      listing,
      orderDataWithCartListings,
      providerCommission,
      customerCommission,
      additionalListings,
      taxInfo
    );

    // Because we are using returned lineItems directly in this template we need to use the helper function
    // to add some attributes like lineTotal and reversal that Marketplace API also adds to the response.
    const validLineItems = constructValidLineItems(lineItems);

    res
      .status(200)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({ data: validLineItems }))
      .end();
  } catch (e) {
    handleError(res, e);
  }
};
