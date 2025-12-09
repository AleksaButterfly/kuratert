const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, handleError, serialize, fetchCommission } = require('../api-util/sdk');
const { constructValidLineItems } = require('../api-util/lineItemHelpers');

module.exports = (req, res) => {
  const { isOwnListing, listingId, orderData } = req.body;

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

  Promise.all([listingPromise(), additionalListingsPromise(), fetchCommission(sdk)])
    .then(([showListingResponse, additionalListingsResponse, fetchAssetsResponse]) => {
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

      const lineItems = transactionLineItems(
        listing,
        orderDataWithCartListings,
        providerCommission,
        customerCommission
      );

      // Because we are using returned lineItems directly in this template we need to use the helper function
      // to add some attributes like lineTotal and reversal that Marketplace API also adds to the response.
      const validLineItems = constructValidLineItems(lineItems);

      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({ data: validLineItems }))
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
