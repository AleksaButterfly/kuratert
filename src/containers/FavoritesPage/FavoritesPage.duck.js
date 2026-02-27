import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { storableError } from '../../util/errors';
import { getFavoriteListingIds } from '../../util/userHelpers';

const { UUID } = sdkTypes;

// ================ Helper Functions ================ //

const resultIds = data => {
  const listings = data?.data;
  return listings ? listings.map(l => l.id) : [];
};

// ================ Async Thunks ================ //

// Fetch a user by ID (for shared favorites page)
export const fetchUserThunk = createAsyncThunk(
  'FavoritesPage/fetchUser',
  ({ userId }, { dispatch, rejectWithValue, extra: sdk }) => {
    return sdk.users
      .show({
        id: new UUID(userId),
        include: ['profileImage'],
        'fields.image': ['variants.square-small', 'variants.square-small2x'],
        'fields.user': [
          'profile.displayName',
          'profile.abbreviatedName',
          'profile.publicData',
        ],
      })
      .then(response => {
        dispatch(addMarketplaceEntities(response));
        return response;
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);

export const queryFavoriteListingsThunk = createAsyncThunk(
  'FavoritesPage/queryFavoriteListings',
  ({ config, user }, { dispatch, getState, rejectWithValue, extra: sdk }) => {
    // Use provided user or fall back to currentUser
    const userToQuery = user || getState().user.currentUser;
    const favoriteListingIds = getFavoriteListingIds(userToQuery);

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
        'publicData.tittel',
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

        dispatch(addMarketplaceEntities(response, sanitizeConfig));
        return response;
      })
      .catch(e => {
        return rejectWithValue(storableError(e));
      });
  }
);

// Backward compatible wrapper for the thunk
export const queryFavoriteListings = (config, user) => (dispatch, getState, sdk) => {
  return dispatch(queryFavoriteListingsThunk({ config, user })).unwrap();
};

// ================ Reducer ================ //

const initialState = {
  queryInProgress: false,
  queryError: null,
  favoriteListingIds: [],
  userId: null, // The user whose favorites we're viewing (null = current user)
  userShowError: null,
};

const favoritesPageSlice = createSlice({
  name: 'FavoritesPage',
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUserThunk.pending, state => {
        state.userShowError = null;
      })
      .addCase(fetchUserThunk.fulfilled, (state, action) => {
        state.userShowError = null;
      })
      .addCase(fetchUserThunk.rejected, (state, action) => {
        state.userShowError = action.payload;
      })
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

export const { setUserId } = favoritesPageSlice.actions;

export default favoritesPageSlice.reducer;

// ================ Exported Actions ================ //

export const loadData = (params, search, config) => async dispatch => {
  const userId = params?.id; // From route /u/:id/favorites

  // Set userId in state (null means own favorites)
  dispatch(setUserId(userId || null));

  if (userId) {
    // Fetch the user first, then their favorites
    try {
      const userResponse = await dispatch(fetchUserThunk({ userId })).unwrap();
      const user = userResponse?.data?.data;
      return dispatch(queryFavoriteListings(config, user));
    } catch (e) {
      // User fetch failed, don't continue
      return Promise.reject(e);
    }
  } else {
    // Own favorites - use currentUser
    return dispatch(queryFavoriteListings(config, null));
  }
};
