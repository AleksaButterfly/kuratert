/**
 * Calculate tax endpoint for getting tax estimates during checkout.
 *
 * This endpoint calculates VAT/tax based on the shipping destination
 * using Stripe Tax API or manual EU VAT rates as fallback.
 */

const { calculateOrderTax, calculateManualTax, isTaxEnabled } = require('../api-util/stripeTax');
const { serialize } = require('../api-util/sdk');

module.exports = async (req, res) => {
  try {
    const { orderTotal, shippingTotal, frameTotal, shippingAddress, currency } = req.body;

    // Validate required fields
    if (!shippingAddress || !shippingAddress.country) {
      return res
        .status(400)
        .json({ error: 'Shipping address with country is required' });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: 'Currency is required' });
    }

    // Check if tax is enabled
    if (!isTaxEnabled()) {
      return res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({
          data: {
            taxAmount: 0,
            taxRate: 0,
            taxEnabled: false,
          },
        }))
        .end();
    }

    // Calculate tax
    let taxResult;
    try {
      taxResult = await calculateOrderTax(
        orderTotal || 0,
        shippingTotal || 0,
        frameTotal || 0,
        shippingAddress,
        currency
      );
    } catch (stripeError) {
      // Fall back to manual calculation if Stripe Tax fails
      console.warn('Stripe Tax failed, using manual calculation:', stripeError.message);
      const totalAmount = (orderTotal || 0) + (shippingTotal || 0) + (frameTotal || 0);
      taxResult = calculateManualTax(totalAmount, shippingAddress.country);
    }

    res
      .status(200)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({
        data: {
          taxAmount: taxResult.taxAmount || 0,
          taxRate: taxResult.taxRate || 0,
          taxEnabled: true,
          isManualCalculation: taxResult.isManualCalculation || false,
        },
      }))
      .end();
  } catch (error) {
    console.error('Tax calculation error:', error);
    res
      .status(500)
      .json({ error: 'Failed to calculate tax' });
  }
};
