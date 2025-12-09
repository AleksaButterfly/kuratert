import { types as sdkTypes } from './sdkLoader';

const { Money } = sdkTypes;

/**
 * Calculate shipping fee for a single item based on quantity
 * Reuses the same logic as server-side calculation
 *
 * @param {number} shippingPriceInSubunitsOneItem - Price for first item in cents
 * @param {number} shippingPriceInSubunitsAdditionalItems - Price for additional items in cents
 * @param {string} currency - Currency code (e.g., 'EUR')
 * @param {number} quantity - Item quantity
 * @returns {Money|null} Shipping fee as Money object or null
 */
export const calculateShippingFee = (
  shippingPriceInSubunitsOneItem,
  shippingPriceInSubunitsAdditionalItems,
  currency,
  quantity
) => {
  if (!shippingPriceInSubunitsOneItem || quantity < 1) {
    return null;
  }

  // For quantity = 1: return oneItem fee
  if (quantity === 1) {
    return new Money(shippingPriceInSubunitsOneItem, currency);
  }

  // For quantity > 1: oneItem + (additionalItems * (quantity - 1))
  if (quantity > 1) {
    const oneItemFee = shippingPriceInSubunitsOneItem;
    const additionalItemsFee = shippingPriceInSubunitsAdditionalItems || 0;
    const additionalItemsTotal = additionalItemsFee * (quantity - 1);
    const totalShippingInSubunits = oneItemFee + additionalItemsTotal;
    return new Money(totalShippingInSubunits, currency);
  }

  return null;
};

/**
 * Get available delivery methods for cart items
 * Returns which methods (shipping/pickup) are available for ALL items
 *
 * @param {Array} cartItems - Array of cart items with listing data
 * @returns {Object} { shipping: boolean, pickup: boolean, requiresNegotiation: boolean }
 */
export const getCartDeliveryCompatibility = cartItems => {
  if (!cartItems || cartItems.length === 0) {
    return { shipping: false, pickup: false, requiresNegotiation: false };
  }

  // Check if all items support each delivery method
  const methods = cartItems.reduce(
    (acc, item) => {
      const publicData = item.listing?.attributes?.publicData || item.attributes?.publicData;
      return {
        shipping: acc.shipping && !!publicData?.shippingEnabled,
        pickup: acc.pickup && !!publicData?.pickupEnabled,
      };
    },
    { shipping: true, pickup: true }
  );

  const hasAnyMethod = methods.shipping || methods.pickup;
  const requiresNegotiation = !hasAnyMethod;

  return {
    ...methods,
    requiresNegotiation,
  };
};

/**
 * Calculate total shipping fee for all items in cart
 * Uses per-item calculation and sums the results
 *
 * @param {Array} listings - Array of listing entities
 * @param {Function} getQuantityForListing - Function to get quantity for a listing ID
 * @param {string} currency - Currency code
 * @returns {Money|null} Total shipping fee or null if can't calculate
 */
export const calculateCartShippingFee = (listings, getQuantityForListing, currency) => {
  if (!listings || listings.length === 0) {
    return null;
  }

  let totalShippingAmount = 0;
  let hasAnyShipping = false;

  for (const listing of listings) {
    const publicData = listing.attributes?.publicData;
    const quantity = getQuantityForListing(listing.id.uuid);

    // Skip if shipping not enabled for this item
    if (!publicData?.shippingEnabled) {
      continue;
    }

    hasAnyShipping = true;
    const itemShipping = calculateShippingFee(
      publicData.shippingPriceInSubunitsOneItem,
      publicData.shippingPriceInSubunitsAdditionalItems,
      currency,
      quantity
    );

    if (itemShipping) {
      totalShippingAmount += itemShipping.amount;
    }
  }

  if (!hasAnyShipping) {
    return null;
  }

  return totalShippingAmount > 0 ? new Money(totalShippingAmount, currency) : null;
};

/**
 * Check if a delivery method is available for given cart items
 *
 * @param {Array} listings - Array of listing entities
 * @param {string} method - 'shipping' or 'pickup'
 * @returns {boolean} True if all items support the method
 */
export const isDeliveryMethodAvailable = (listings, method) => {
  if (!listings || listings.length === 0) {
    return false;
  }

  const fieldName = method === 'shipping' ? 'shippingEnabled' : 'pickupEnabled';

  return listings.every(listing => {
    const publicData = listing.attributes?.publicData;
    return !!publicData?.[fieldName];
  });
};
