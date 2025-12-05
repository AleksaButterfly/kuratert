import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storableError } from '../../util/errors';
import { querySellers as querySellersApi } from '../../util/api';

const RESULT_PAGE_SIZE = 6;

// Fetch sellers thunk
const querySellersPayloadCreator = async ({ perPage = RESULT_PAGE_SIZE }, { rejectWithValue }) => {
  try {
    const response = await querySellersApi(perPage);
    return response.data || [];
  } catch (e) {
    return rejectWithValue(storableError(e));
  }
};

export const querySellersThunk = createAsyncThunk(
  'SellerLandingPage/querySellers',
  querySellersPayloadCreator
);

export const querySellers = (perPage = RESULT_PAGE_SIZE) => dispatch => {
  return dispatch(querySellersThunk({ perPage }));
};

const initialState = {
  sellers: [],
  querySellersError: null,
  querySellersInProgress: false,
};

const sellerLandingPageSlice = createSlice({
  name: 'SellerLandingPage',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(querySellersThunk.pending, state => {
        state.querySellersInProgress = true;
        state.querySellersError = null;
      })
      .addCase(querySellersThunk.fulfilled, (state, action) => {
        state.querySellersInProgress = false;
        state.sellers = action.payload;
      })
      .addCase(querySellersThunk.rejected, (state, action) => {
        state.querySellersInProgress = false;
        state.querySellersError = action.payload;
      });
  },
});

export default sellerLandingPageSlice.reducer;

export const loadData = () => dispatch => {
  return dispatch(querySellers(RESULT_PAGE_SIZE));
};
