const { types } = require('sharetribe-flex-sdk');
const { getRate } = require('./exchangeRate');

const { Money } = types;

// Marketplace base currency. Stripe charges in this currency.
const MARKETPLACE_CURRENCY = 'NOK';

/**
 * Override a listing's price using the live exchange rate.
 *
 * The seller's intended price lives in publicData.displayPrice
 * + publicData.listingCurrency. listing.price is a snapshot in marketplace
 * currency that we recompute at every transaction so the buyer is always
 * charged the current rate.
 *
 * If the listing was created in marketplace currency, or the publicData fields
 * are missing, the listing is returned unchanged.
 */
const overrideListingPriceWithLiveRate = async listing => {
  const publicData = listing?.attributes?.publicData || {};
  const { listingCurrency, displayPrice } = publicData;

  if (
    !listingCurrency ||
    !Number.isInteger(displayPrice) ||
    listingCurrency === MARKETPLACE_CURRENCY
  ) {
    return listing;
  }

  try {
    const rate = await getRate(listingCurrency, MARKETPLACE_CURRENCY);
    const convertedAmount = Math.round(displayPrice * rate);
    return {
      ...listing,
      attributes: {
        ...listing.attributes,
        price: new Money(convertedAmount, MARKETPLACE_CURRENCY),
      },
    };
  } catch (e) {
    console.error(
      `Live rate fetch failed for ${listingCurrency} -> ${MARKETPLACE_CURRENCY}, using stored price`,
      e
    );
    return listing;
  }
};

const overrideCartListingsPriceWithLiveRate = listings =>
  Promise.all((listings || []).map(overrideListingPriceWithLiveRate));

module.exports = {
  overrideListingPriceWithLiveRate,
  overrideCartListingsPriceWithLiveRate,
  MARKETPLACE_CURRENCY,
};
