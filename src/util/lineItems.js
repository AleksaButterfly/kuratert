/**
 * Line item utilities for cart items
 * Cart items use the pattern: line-item/cart-item-{listingId}
 */

/**
 * Check if a line item code is a cart item
 *
 * @param {string} code - Line item code
 * @returns {boolean} True if code matches cart item pattern
 */
export const isCartItemLineItem = code => {
  return code?.startsWith('line-item/cart-item-');
};

/**
 * Extract listing ID from a cart item line item code
 *
 * Example: "line-item/cart-item-abc123" → "abc123"
 *
 * @param {string} code - Line item code
 * @returns {string|null} Listing ID or null if not a cart item line item
 */
export const extractCartItemId = code => {
  if (!isCartItemLineItem(code)) {
    return null;
  }
  return code.replace('line-item/cart-item-', '');
};

/**
 * Get cart item data from line item code
 *
 * Matches the listing ID from the line item code against cart items in protectedData
 *
 * @param {string} code - Line item code (e.g., "line-item/cart-item-abc123")
 * @param {Array} cartItems - Array of cart items from protectedData with id property
 * @returns {Object|null} Cart item object or null if not found
 */
export const getCartItemFromLineItem = (code, cartItems = []) => {
  const listingId = extractCartItemId(code);
  if (!listingId || !Array.isArray(cartItems)) {
    return null;
  }

  return cartItems.find(item => item.id === listingId) || null;
};

/**
 * Get display title for a line item (with fallback)
 * Includes frame info if available
 *
 * @param {string} code - Line item code
 * @param {Array} cartItems - Array of cart items from protectedData
 * @param {Object} mainListing - Main listing object (for non-cart items)
 * @returns {string} Display title with fallback
 */
export const getLineItemTitle = (code, cartItems = [], mainListing = null) => {
  // If it's a cart item, extract from protectedData
  if (isCartItemLineItem(code)) {
    const cartItem = getCartItemFromLineItem(code, cartItems);
    if (cartItem?.title) {
      // Include frame info in title if present
      const frameInfo = cartItem.selectedFrameLabel
        ? ` (${cartItem.selectedFrameLabel} Frame)`
        : '';
      return `${cartItem.title}${frameInfo}`;
    }
    // Fallback if cart item not found
    const listingId = extractCartItemId(code);
    return `Item ${listingId?.substring(0, 8)}...` || 'Unknown item';
  }

  // For main listing or other line items, use listing title
  return mainListing?.attributes?.title || 'Unknown item';
};
