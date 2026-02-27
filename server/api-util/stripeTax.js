/**
 * Stripe Tax API integration for calculating VAT/tax on orders.
 *
 * This module provides tax calculation for EU-wide orders using Stripe Tax API.
 * Tax is calculated on the full order (artwork + shipping + frame) per EU VAT rules.
 *
 * Note: Requires STRIPE_SECRET_KEY environment variable to be set.
 * You must enable Stripe Tax in your Stripe Dashboard and add tax registrations.
 */

// Tax code for art/collectibles - Stripe's recommended code for artwork
const ART_TAX_CODE = 'txcd_99999999';

/**
 * Check if Stripe Tax is enabled via environment variable
 * @returns {boolean}
 */
const isTaxEnabled = () => {
  return process.env.REACT_APP_ENABLE_TAX === 'true';
};

/**
 * Get Stripe instance (lazily loaded)
 * @returns {Object|null} Stripe instance or null if not configured
 */
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY not configured - tax calculation disabled');
    return null;
  }

  try {
    const stripe = require('stripe')(secretKey);
    return stripe;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error.message);
    return null;
  }
};

/**
 * Calculate tax using Stripe Tax API
 *
 * @param {Array} lineItems - Array of line items with amount and code
 * @param {Object} shippingAddress - Customer shipping address
 * @param {string} currency - Currency code (e.g., 'NOK', 'EUR')
 * @returns {Promise<Object>} Tax calculation result
 */
const calculateTax = async (lineItems, shippingAddress, currency) => {
  if (!isTaxEnabled()) {
    return { taxAmount: 0, taxBreakdown: [], taxRate: 0 };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { taxAmount: 0, taxBreakdown: [], taxRate: 0 };
  }

  // Validate shipping address
  if (!shippingAddress || !shippingAddress.country) {
    console.warn('No shipping address provided for tax calculation');
    return { taxAmount: 0, taxBreakdown: [], taxRate: 0 };
  }

  try {
    const calculation = await stripe.tax.calculations.create({
      currency: currency.toLowerCase(),
      line_items: lineItems.map((item, index) => ({
        amount: item.amount,
        reference: item.code || `item-${index}`,
        tax_code: ART_TAX_CODE,
      })),
      customer_details: {
        address: {
          country: shippingAddress.country,
          postal_code: shippingAddress.postalCode || '',
          city: shippingAddress.city || '',
          line1: shippingAddress.line1 || '',
          state: shippingAddress.state || '',
        },
        address_source: 'shipping',
      },
    });

    // Calculate effective tax rate from breakdown
    const taxRate = calculation.tax_breakdown?.length > 0
      ? calculation.tax_breakdown[0].tax_rate_details?.percentage_decimal * 100
      : 0;

    return {
      taxAmount: calculation.tax_amount_exclusive || 0,
      taxBreakdown: calculation.tax_breakdown || [],
      taxRate: taxRate || 0,
      calculationId: calculation.id,
    };
  } catch (error) {
    console.error('Stripe Tax calculation error:', error.message);
    // Return zero tax on error to allow checkout to proceed
    return { taxAmount: 0, taxBreakdown: [], taxRate: 0, error: error.message };
  }
};

/**
 * Calculate tax amount for a given order total and shipping address.
 * This is a simplified wrapper for common use cases.
 *
 * @param {number} orderTotal - Total order amount in subunits (cents/øre)
 * @param {number} shippingTotal - Shipping amount in subunits
 * @param {number} frameTotal - Frame amount in subunits
 * @param {Object} shippingAddress - Shipping address
 * @param {string} currency - Currency code
 * @returns {Promise<Object>} Tax result with taxAmount, taxRate
 */
const calculateOrderTax = async (orderTotal, shippingTotal, frameTotal, shippingAddress, currency) => {
  const lineItems = [];

  // Add order items
  if (orderTotal > 0) {
    lineItems.push({
      amount: orderTotal,
      code: 'order-items',
    });
  }

  // Add shipping (note: 'shipping' is a reserved keyword in Stripe Tax, so we use 'delivery')
  if (shippingTotal > 0) {
    lineItems.push({
      amount: shippingTotal,
      code: 'delivery',
    });
  }

  // Add frame
  if (frameTotal > 0) {
    lineItems.push({
      amount: frameTotal,
      code: 'frame',
    });
  }

  if (lineItems.length === 0) {
    return { taxAmount: 0, taxRate: 0 };
  }

  return calculateTax(lineItems, shippingAddress, currency);
};

/**
 * Manual EU VAT rate lookup (fallback if Stripe Tax is not enabled)
 * These are standard VAT rates - artwork may have reduced rates in some countries.
 */
const EU_VAT_RATES = {
  // Standard VAT rates by country
  NO: 0.25, // Norway (not EU but often included)
  SE: 0.25, // Sweden
  DK: 0.25, // Denmark
  FI: 0.24, // Finland
  DE: 0.19, // Germany
  AT: 0.20, // Austria
  BE: 0.21, // Belgium
  BG: 0.20, // Bulgaria
  HR: 0.25, // Croatia
  CY: 0.19, // Cyprus
  CZ: 0.21, // Czech Republic
  EE: 0.22, // Estonia
  FR: 0.20, // France
  GR: 0.24, // Greece
  HU: 0.27, // Hungary
  IE: 0.23, // Ireland
  IT: 0.22, // Italy
  LV: 0.21, // Latvia
  LT: 0.21, // Lithuania
  LU: 0.17, // Luxembourg
  MT: 0.18, // Malta
  NL: 0.21, // Netherlands
  PL: 0.23, // Poland
  PT: 0.23, // Portugal
  RO: 0.19, // Romania
  SK: 0.20, // Slovakia
  SI: 0.22, // Slovenia
  ES: 0.21, // Spain
  GB: 0.20, // UK
  CH: 0.077, // Switzerland
};

/**
 * Calculate tax manually using EU VAT rates (fallback method)
 *
 * @param {number} totalAmount - Total amount in subunits
 * @param {string} countryCode - Two-letter country code
 * @returns {Object} Tax calculation result
 */
const calculateManualTax = (totalAmount, countryCode) => {
  const rate = EU_VAT_RATES[countryCode?.toUpperCase()] || 0;
  const taxAmount = Math.round(totalAmount * rate);

  return {
    taxAmount,
    taxRate: rate * 100, // Convert to percentage
    isManualCalculation: true,
  };
};

module.exports = {
  calculateTax,
  calculateOrderTax,
  calculateManualTax,
  isTaxEnabled,
  EU_VAT_RATES,
};
