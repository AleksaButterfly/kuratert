import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchExchangeRates as fetchExchangeRatesApi } from '../util/api';
import { storableError } from '../util/errors';

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

const initialState = {
  // rates[X] is how many X equals 1 NOK (e.g. rates.GBP ≈ 0.078).
  base: 'NOK',
  rates: null,
  fetchedAt: 0,
  inProgress: false,
  error: null,
};

const fetchRatesPayloadCreator = (_arg, { rejectWithValue }) =>
  fetchExchangeRatesApi()
    .then(response => ({ base: response.base, rates: response.rates }))
    .catch(e => rejectWithValue(storableError(e)));

export const fetchExchangeRatesThunk = createAsyncThunk(
  'app/exchangeRates/fetch',
  fetchRatesPayloadCreator
);

// Skip the network call if rates are recent enough.
export const ensureExchangeRates = () => (dispatch, getState) => {
  const state = getState().exchangeRates;
  if (state.rates && Date.now() - state.fetchedAt < REFRESH_INTERVAL) {
    return Promise.resolve(state);
  }
  return dispatch(fetchExchangeRatesThunk());
};

const exchangeRatesSlice = createSlice({
  name: 'app/exchangeRates',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchExchangeRatesThunk.pending, state => {
        state.inProgress = true;
        state.error = null;
      })
      .addCase(fetchExchangeRatesThunk.fulfilled, (state, action) => {
        state.inProgress = false;
        state.base = action.payload.base;
        state.rates = action.payload.rates;
        state.fetchedAt = Date.now();
      })
      .addCase(fetchExchangeRatesThunk.rejected, (state, action) => {
        state.inProgress = false;
        state.error = action.payload || action.error;
      });
  },
});

export default exchangeRatesSlice.reducer;
