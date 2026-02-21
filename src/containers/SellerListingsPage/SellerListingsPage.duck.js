import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { storableError } from '../../util/errors';

// ================ Helper Functions ================ //

const resultIds = data => {
  const listings = data?.data;
  return listings ? listings.map(l => l.id) : [];
};

// ================ Async Thunks ================ //

export const querySellerListingsThunk = createAsyncThunk(
  'SellerListingsPage/querySellerListings',
  ({ sellerName, config }, { dispatch, rejectWithValue, extra: sdk }) => {
    const {
      aspectWidth = 1,
      aspectHeight = 1,
      variantPrefix = 'listing-card',
    } = config.layout.listingImage;
    const aspectRatio = aspectHeight / aspectWidth;

    // Fetch all listings and filter client-side for partial match
    const queryParams = {
      perPage: 100,
      minStock: 1,
      include: ['author', 'images'],
      'fields.listing': [
        'title',
        'geolocation',
        'price',
        'deleted',
        'state',
        'publicData.listingType',
        'publicData.transactionProcessAlias',
        'publicData.unitType',
        'publicData.cardStyle',
        'publicData.pickupEnabled',
        'publicData.shippingEnabled',
        'publicData.priceVariationsEnabled',
        'publicData.priceVariants',
        'publicData.selger',
      ],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': [
        'variants.scaled-small',
        'variants.scaled-medium',
        'variants.scaled-large',
        'variants.scaled-xlarge',
        `variants.${variantPrefix}`,
        `variants.${variantPrefix}-2x`,
        `variants.${variantPrefix}-4x`,
        `variants.${variantPrefix}-6x`,
      ],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-4x`, 1600, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-6x`, 2400, aspectRatio),
      'limit.images': 1,
    };

    return sdk.listings
      .query(queryParams)
      .then(response => {
        const listingFields = config?.listing?.listingFields;
        const sanitizeConfig = { listingFields };

        // Filter listings where selger includes the search term (case-insensitive)
        const searchTerm = sellerName.toLowerCase();
        const filteredListings = response.data.data.filter(listing => {
          const listingSelger = listing.attributes?.publicData?.selger;
          if (!listingSelger) return false;
          return listingSelger.toLowerCase().includes(searchTerm);
        });

        // Create a filtered response with only matching listings
        const filteredResponse = {
          ...response,
          data: {
            ...response.data,
            data: filteredListings,
          },
        };

        dispatch(addMarketplaceEntities(filteredResponse, sanitizeConfig));
        return filteredResponse;
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);

// Backward compatible wrapper for the thunk
export const querySellerListings = (sellerName, config) => dispatch => {
  return dispatch(querySellerListingsThunk({ sellerName, config })).unwrap();
};

// ================ Reducer ================ //

const initialState = {
  queryInProgress: false,
  queryError: null,
  listingIds: [],
  sellerName: null,
};

const sellerListingsPageSlice = createSlice({
  name: 'SellerListingsPage',
  initialState,
  reducers: {
    setSellerName: (state, action) => {
      state.sellerName = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(querySellerListingsThunk.pending, state => {
        state.queryInProgress = true;
        state.queryError = null;
      })
      .addCase(querySellerListingsThunk.fulfilled, (state, action) => {
        state.queryInProgress = false;
        state.listingIds = resultIds(action.payload.data);
      })
      .addCase(querySellerListingsThunk.rejected, (state, action) => {
        state.queryInProgress = false;
        state.queryError = action.payload;
      });
  },
});

export const { setSellerName } = sellerListingsPageSlice.actions;

export default sellerListingsPageSlice.reducer;

// ================ Exported Actions ================ //

export const loadData = (params, search, config) => dispatch => {
  const sellerName = params?.sellerName;

  // Set sellerName in state
  dispatch(setSellerName(sellerName || null));

  if (sellerName) {
    // Decode the URL-encoded seller name
    const decodedSellerName = decodeURIComponent(sellerName);
    return dispatch(querySellerListings(decodedSellerName, config));
  }

  return Promise.resolve();
};
