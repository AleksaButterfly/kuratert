import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { storableError } from '../../util/errors';
import { getFavoriteListingIds } from '../../util/userHelpers';

// ================ Helper Functions ================ //

const resultIds = data => {
  const listings = data?.data;
  return listings ? listings.map(l => l.id) : [];
};

// ================ Async Thunks ================ //

export const queryFavoriteListingsThunk = createAsyncThunk(
  'FavoritesPage/queryFavoriteListings',
  ({ config }, { dispatch, getState, rejectWithValue, extra: sdk }) => {
    const { currentUser } = getState().user;
    const favoriteListingIds = getFavoriteListingIds(currentUser);

    if (!favoriteListingIds || favoriteListingIds.length === 0) {
      return { data: { data: [] } };
    }

    const {
      aspectWidth = 1,
      aspectHeight = 1,
      variantPrefix = 'listing-card',
    } = config.layout.listingImage;
    const aspectRatio = aspectHeight / aspectWidth;

    const queryParams = {
      ids: favoriteListingIds,
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
      ],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': [
        'variants.scaled-small',
        'variants.scaled-medium',
        `variants.${variantPrefix}`,
        `variants.${variantPrefix}-2x`,
      ],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
      'limit.images': 1,
    };

    return sdk.listings
      .query(queryParams)
      .then(response => {
        const listingFields = config?.listing?.listingFields;
        const sanitizeConfig = { listingFields };

        dispatch(addMarketplaceEntities(response, sanitizeConfig));
        return response;
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);

// Backward compatible wrapper for the thunk
export const queryFavoriteListings = config => (dispatch, getState, sdk) => {
  return dispatch(queryFavoriteListingsThunk({ config })).unwrap();
};

// ================ Reducer ================ //

const initialState = {
  queryInProgress: false,
  queryError: null,
  favoriteListingIds: [],
};

const favoritesPageSlice = createSlice({
  name: 'FavoritesPage',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(queryFavoriteListingsThunk.pending, state => {
        state.queryInProgress = true;
        state.queryError = null;
      })
      .addCase(queryFavoriteListingsThunk.fulfilled, (state, action) => {
        state.queryInProgress = false;
        state.favoriteListingIds = resultIds(action.payload.data);
      })
      .addCase(queryFavoriteListingsThunk.rejected, (state, action) => {
        state.queryInProgress = false;
        state.queryError = action.payload;
      });
  },
});

export default favoritesPageSlice.reducer;

// ================ Exported Actions ================ //

export const loadData = (params, search, config) => dispatch => {
  return dispatch(queryFavoriteListings(config));
};
