import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ensureExchangeRates } from '../ducks/exchangeRates.duck';
import { getLivePriceInMarketplaceCurrency } from './currency';

/**
 * Returns a copy of the listing with attributes.price overridden by the live
 * marketplace-currency price, when applicable. If no override is needed,
 * returns the listing unchanged.
 */
export const withLivePrice = (listing, marketplaceCurrency, rates) => {
  if (!listing) return listing;
  const livePrice = getLivePriceInMarketplaceCurrency(
    listing.attributes?.publicData,
    marketplaceCurrency,
    rates
  );
  if (!livePrice) return listing;
  return {
    ...listing,
    attributes: {
      ...listing.attributes,
      price: livePrice,
    },
  };
};

/**
 * Hook variant: returns the listing with its price overridden using current
 * exchange rates, and triggers the rates fetch if needed.
 */
export const useListingWithLivePrice = (listing, marketplaceCurrency) => {
  const dispatch = useDispatch();
  const rates = useSelector(state => state.exchangeRates?.rates);
  const listingCurrency = listing?.attributes?.publicData?.listingCurrency;
  const needsConversion = listingCurrency && listingCurrency !== marketplaceCurrency;

  useEffect(() => {
    if (needsConversion) {
      dispatch(ensureExchangeRates());
    }
  }, [dispatch, needsConversion]);

  return withLivePrice(listing, marketplaceCurrency, rates);
};

/**
 * Hook variant for an array of listings. Triggers the rates fetch if any
 * listing in the array uses a non-marketplace currency.
 */
export const useListingsWithLivePrice = (listings, marketplaceCurrency) => {
  const dispatch = useDispatch();
  const rates = useSelector(state => state.exchangeRates?.rates);
  const needsConversion = (listings || []).some(l => {
    const c = l?.attributes?.publicData?.listingCurrency;
    return c && c !== marketplaceCurrency;
  });

  useEffect(() => {
    if (needsConversion) {
      dispatch(ensureExchangeRates());
    }
  }, [dispatch, needsConversion]);

  return (listings || []).map(l => withLivePrice(l, marketplaceCurrency, rates));
};

/**
 * Returns a listing's price in the marketplace currency using the latest
 * exchange rates. Falls back to listing.price when:
 *  - the listing was created in marketplace currency, or
 *  - publicData lacks displayPrice/listingCurrency, or
 *  - rates haven't been fetched yet.
 *
 * Triggers a one-time fetch (cached 30 min) the first time any caller mounts.
 */
export const useLivePrice = (listing, marketplaceCurrency) => {
  const dispatch = useDispatch();
  const rates = useSelector(state => state.exchangeRates?.rates);
  const publicData = listing?.attributes?.publicData;
  const storedPrice = listing?.attributes?.price;

  // Only kick off a fetch when this listing actually needs conversion.
  const listingCurrency = publicData?.listingCurrency;
  const needsConversion =
    listingCurrency && listingCurrency !== marketplaceCurrency;

  useEffect(() => {
    if (needsConversion) {
      dispatch(ensureExchangeRates());
    }
  }, [dispatch, needsConversion]);

  const livePrice = getLivePriceInMarketplaceCurrency(
    publicData,
    marketplaceCurrency,
    rates
  );

  return livePrice || storedPrice;
};
