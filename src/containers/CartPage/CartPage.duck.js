import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { storableError } from '../../util/errors';
import { getCartItems, getCartListingIds } from '../../util/userHelpers';

// ================ Helper Functions ================ //

const resultIds = data => {
  const listings = data?.data;
  return listings ? listings.map(l => l.id) : [];
};

// ================ Async Thunks ================ //

/**
 * Query cart listings thunk
 */
const queryCartListingsPayloadCreator = (config, thunkAPI) => {
  const { dispatch, getState, extra: sdk } = thunkAPI;

  const { currentUser } = getState().user;
  const cartListingIds = getCartListingIds(currentUser);

  if (!cartListingIds || cartListingIds.length === 0) {
    return Promise.resolve({ data: { data: [] } });
  }

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  const queryParams = {
    ids: cartListingIds,
    minStock: 1,
    include: ['author', 'images', 'currentStock'],
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
      'publicData.quoteEnabled',
      'publicData.shippingPriceInSubunitsOneItem',
      'publicData.shippingPriceInSubunitsAdditionalItems',
      'publicData.priceVariationsEnabled',
      'publicData.priceVariants',
      'publicData.currentStock',
      'publicData.categoryLevel1',
      'publicData.categoryLevel2',
      'publicData.categoryLevel3',
      'publicData.location',
      'publicData.stockType',
      'publicData.frameOptions',
    ],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName', 'profile.publicData'],
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
      throw storableError(e);
    });
};

export const queryCartListings = createAsyncThunk(
  'CartPage/queryCartListings',
  queryCartListingsPayloadCreator
);

// ================ Slice ================ //

const cartPageSlice = createSlice({
  name: 'CartPage',
  initialState: {
    queryInProgress: false,
    queryError: null,
    cartListingIds: [],
  },
  reducers: {
    removeListingFromCartOptimistic: (state, action) => {
      const listingIdToRemove = action.payload.listingId;
      state.cartListingIds = state.cartListingIds.filter(id => {
        const idString = typeof id === 'string' ? id : id.uuid;
        return idString !== listingIdToRemove;
      });
    },
  },
  extraReducers: builder => {
    // Query Cart Listings
    builder
      .addCase(queryCartListings.pending, state => {
        state.queryInProgress = true;
        state.queryError = null;
      })
      .addCase(queryCartListings.fulfilled, (state, action) => {
        state.queryInProgress = false;
        state.cartListingIds = resultIds(action.payload.data);
      })
      .addCase(queryCartListings.rejected, (state, action) => {
        state.queryInProgress = false;
        state.queryError = action.error;
      });
  },
});

// Export the action creator
export const { removeListingFromCartOptimistic } = cartPageSlice.actions;

export default cartPageSlice.reducer;

// ================ Load data ================ //

export const loadData = (params, search, config) => dispatch => {
  return dispatch(queryCartListings(config));
};
