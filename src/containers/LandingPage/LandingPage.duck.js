import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { storableError } from '../../util/errors';

export const ASSET_NAME = 'landing-page';

const useHostedLandingPage = process.env.REACT_APP_USE_HOSTED_LANDING_PAGE === 'true';

const RESULT_PAGE_SIZE = 8;

const queryListingsPayloadCreator = (
  { config, perPage = RESULT_PAGE_SIZE },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  return sdk.listings
    .query({
      perPage,
      include: ['author', 'images'],
      'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    })
    .then(response => {
      const listings = response.data.data;
      const listingRefs = listings.map(({ id, type }) => ({ id, type }));
      dispatch(addMarketplaceEntities(response));
      return { listingRefs, totalItems: response.data.meta.totalItems };
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const queryListingsThunk = createAsyncThunk(
  'LandingPage/queryListings',
  queryListingsPayloadCreator
);

export const queryListings = (config, perPage) => dispatch => {
  return dispatch(queryListingsThunk({ config, perPage }));
};

const initialState = {
  listingRefs: [],
  queryListingsError: null,
  queryListingsInProgress: false,
  totalItems: 0,
};

const landingPageSlice = createSlice({
  name: 'LandingPage',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(queryListingsThunk.pending, state => {
        state.queryListingsInProgress = true;
        state.queryListingsError = null;
      })
      .addCase(queryListingsThunk.fulfilled, (state, action) => {
        state.queryListingsInProgress = false;
        state.listingRefs = action.payload.listingRefs;
        state.totalItems = action.payload.totalItems;
      })
      .addCase(queryListingsThunk.rejected, (state, action) => {
        state.queryListingsInProgress = false;
        state.queryListingsError = action.payload;
      });
  },
});

export default landingPageSlice.reducer;

export const loadData = (params, search, config) => dispatch => {
  if (useHostedLandingPage) {
    const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
    return dispatch(fetchPageAssets(pageAsset, true));
  }

  return dispatch(queryListings(config, RESULT_PAGE_SIZE));
};
