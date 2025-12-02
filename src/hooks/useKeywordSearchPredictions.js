import { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';
import { queryUsers } from '../util/api';
import { createInstance } from '../util/sdkLoader';
import appSettings from '../config/settings';
import * as apiUtils from '../util/api';

const DEBOUNCE_WAIT_TIME = 300;
const MIN_SEARCH_LENGTH = 2;

// Create SDK instance for listings query
const createSdk = () => {
  const baseUrl = appSettings.sdk.baseUrl ? { baseUrl: appSettings.sdk.baseUrl } : {};
  const assetCdnBaseUrl = appSettings.sdk.assetCdnBaseUrl
    ? { assetCdnBaseUrl: appSettings.sdk.assetCdnBaseUrl }
    : {};

  return createInstance({
    transitVerbose: appSettings.sdk.transitVerbose,
    clientId: appSettings.sdk.clientId,
    secure: appSettings.usingSSL,
    typeHandlers: apiUtils.typeHandlers,
    ...baseUrl,
    ...assetCdnBaseUrl,
  });
};

/**
 * Custom hook for keyword search predictions
 * Fetches listings, users (sellers), and filters categories based on search term
 *
 * @param {Array} categories - Available categories from hosted config
 * @returns {Object} - Search state and handlers
 */
const useKeywordSearchPredictions = (categories = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [predictions, setPredictions] = useState({
    categories: [],
    listings: [],
    sellers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showPredictions, setShowPredictions] = useState(false);

  const isMountedRef = useRef(true);
  const sdkRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    // Create SDK instance lazily
    if (!sdkRef.current) {
      sdkRef.current = createSdk();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Filter categories locally
  const filterCategories = useCallback(
    term => {
      if (!term || term.length < MIN_SEARCH_LENGTH) return [];
      const searchLower = term.toLowerCase();
      const topLevelCategories = categories.filter(cat => !cat.parentId);
      return topLevelCategories
        .filter(cat => cat.name.toLowerCase().includes(searchLower))
        .slice(0, 4);
    },
    [categories]
  );

  // Fetch listings using SDK
  const fetchListings = useCallback(async term => {
    if (!sdkRef.current || !term || term.length < MIN_SEARCH_LENGTH) return [];

    try {
      const response = await sdkRef.current.listings.query({
        keywords: term,
        perPage: 5,
        include: ['author'],
      });

      const listings = response.data.data || [];
      return listings.map(listing => ({
        id: listing.id,
        title: listing.attributes.title,
        slug: listing.attributes.title
          ? listing.attributes.title.toLowerCase().replace(/\s+/g, '-')
          : 'listing',
      }));
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }, []);

  // Fetch users/sellers
  const fetchSellers = useCallback(async term => {
    if (!term || term.length < MIN_SEARCH_LENGTH) return [];

    try {
      const response = await queryUsers(term);
      const users = response.data || [];
      return users.map(user => ({
        id: user.id,
        displayName: user.attributes?.profile?.displayName || 'Unknown',
      }));
    } catch (error) {
      console.error('Error fetching sellers:', error);
      return [];
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async term => {
      if (!isMountedRef.current) return;

      if (!term || term.length < MIN_SEARCH_LENGTH) {
        setPredictions({ categories: [], listings: [], sellers: [] });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch all data in parallel
        const [matchingCategories, matchingListings, matchingSellers] = await Promise.all([
          Promise.resolve(filterCategories(term)),
          fetchListings(term),
          fetchSellers(term),
        ]);

        if (isMountedRef.current) {
          setPredictions({
            categories: matchingCategories,
            listings: matchingListings,
            sellers: matchingSellers,
          });
        }
      } catch (error) {
        console.error('Error fetching predictions:', error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_WAIT_TIME),
    [filterCategories, fetchListings, fetchSellers]
  );

  // Handle search term change
  const handleSearchChange = useCallback(
    term => {
      setSearchTerm(term);
      setHighlightedIndex(-1);

      if (term && term.length >= MIN_SEARCH_LENGTH) {
        setShowPredictions(true);
        setIsLoading(true);
        debouncedSearch(term);
      } else {
        // Hide predictions when input is empty or too short
        setShowPredictions(false);
        setPredictions({ categories: [], listings: [], sellers: [] });
        setIsLoading(false);
      }
    },
    [debouncedSearch]
  );

  // Get total number of items for keyboard navigation
  const getTotalItems = useCallback(() => {
    return predictions.categories.length + predictions.listings.length + predictions.sellers.length;
  }, [predictions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    e => {
      const totalItems = getTotalItems();

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Escape') {
        setShowPredictions(false);
        setHighlightedIndex(-1);
      }
    },
    [getTotalItems]
  );

  // Get selected item based on highlighted index
  const getSelectedItem = useCallback(() => {
    if (highlightedIndex < 0) return null;

    let currentIndex = 0;

    // Check categories
    if (highlightedIndex < predictions.categories.length) {
      return { type: 'category', data: predictions.categories[highlightedIndex] };
    }
    currentIndex += predictions.categories.length;

    // Check listings
    if (highlightedIndex < currentIndex + predictions.listings.length) {
      const listingIndex = highlightedIndex - currentIndex;
      return { type: 'listing', data: predictions.listings[listingIndex] };
    }
    currentIndex += predictions.listings.length;

    // Check sellers
    if (highlightedIndex < currentIndex + predictions.sellers.length) {
      const sellerIndex = highlightedIndex - currentIndex;
      return { type: 'seller', data: predictions.sellers[sellerIndex] };
    }

    return null;
  }, [highlightedIndex, predictions]);

  // Reset predictions
  const resetPredictions = useCallback(() => {
    setSearchTerm('');
    setPredictions({ categories: [], listings: [], sellers: [] });
    setHighlightedIndex(-1);
    setShowPredictions(false);
    setIsLoading(false);
  }, []);

  // Hide predictions
  const hidePredictions = useCallback(() => {
    setShowPredictions(false);
    setHighlightedIndex(-1);
  }, []);

  // Show predictions
  const showPredictionsPanel = useCallback(() => {
    if (searchTerm && searchTerm.length >= MIN_SEARCH_LENGTH) {
      setShowPredictions(true);
    }
  }, [searchTerm]);

  return {
    searchTerm,
    predictions,
    isLoading,
    highlightedIndex,
    showPredictions,
    handleSearchChange,
    handleKeyDown,
    getSelectedItem,
    resetPredictions,
    hidePredictions,
    showPredictionsPanel,
    setHighlightedIndex,
    getTotalItems,
  };
};

export default useKeywordSearchPredictions;
