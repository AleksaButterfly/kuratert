import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { util as sdkUtil } from '../util/sdkLoader';
import { denormalisedResponseEntities, ensureOwnListing } from '../util/data';
import * as log from '../util/log';
import { LISTING_STATE_DRAFT } from '../util/types';
import { storableError } from '../util/errors';
import { isUserAuthorized, getFavoriteListingIds, getCartItems } from '../util/userHelpers';
import {
  getStatesNeedingProviderAttention,
  getStatesNeedingCustomerAttention,
} from '../transactions/transaction';

import { authInfo } from './auth.duck';
import { updateStripeConnectAccount } from './stripeConnectAccount.duck';

// ================ Helper Functions ================ //

const mergeCurrentUser = (oldCurrentUser, newCurrentUser) => {
  const { id: oId, type: oType, attributes: oAttr, ...oldRelationships } = oldCurrentUser || {};
  const { id, type, attributes, ...relationships } = newCurrentUser || {};

  // Passing null will remove currentUser entity.
  // Only relationships are merged.
  // TODO figure out if sparse fields handling needs a better handling.
  return newCurrentUser === null
    ? null
    : oldCurrentUser === null
    ? newCurrentUser
    : { id, type, attributes, ...oldRelationships, ...relationships };
};

// ================ Async Thunks ================ //

//////////////////////////////////////////////////////////////////////
// Fetch ownListings to check if currentUser has published listings //
//////////////////////////////////////////////////////////////////////

const fetchCurrentUserHasListingsPayloadCreator = (_, thunkAPI) => {
  const { getState, extra: sdk, rejectWithValue } = thunkAPI;
  const { currentUser } = getState().user;

  if (!currentUser) {
    return Promise.resolve({ hasListings: false });
  }

  const params = {
    // Since we are only interested in if the user has published
    // listings, we only need at most one result.
    states: 'published',
    page: 1,
    perPage: 1,
  };

  return sdk.ownListings
    .query(params)
    .then(response => {
      const hasListings = response.data.data && response.data.data.length > 0;

      const hasPublishedListings =
        hasListings &&
        ensureOwnListing(response.data.data[0]).attributes.state !== LISTING_STATE_DRAFT;
      return { hasListings: !!hasPublishedListings };
    })
    .catch(e => rejectWithValue(storableError(e)));
};

export const fetchCurrentUserHasListingsThunk = createAsyncThunk(
  'user/fetchCurrentUserHasListings',
  fetchCurrentUserHasListingsPayloadCreator
);

// Backward compatible wrapper for the thunk
export const fetchCurrentUserHasListings = () => (dispatch, getState, sdk) => {
  return dispatch(fetchCurrentUserHasListingsThunk()).unwrap();
};

///////////////////////////////////////////////////////////
// Fetch transactions to check if currentUser has orders //
///////////////////////////////////////////////////////////

const fetchCurrentUserHasOrdersPayloadCreator = (_, { getState, extra: sdk, rejectWithValue }) => {
  if (!getState().user.currentUser) {
    return Promise.resolve({ hasOrders: false });
  }

  const params = {
    only: 'order',
    page: 1,
    perPage: 1,
  };

  return sdk.transactions
    .query(params)
    .then(response => {
      const hasOrders = response.data.data && response.data.data.length > 0;
      return { hasOrders: !!hasOrders };
    })
    .catch(e => rejectWithValue(storableError(e)));
};

export const fetchCurrentUserHasOrdersThunk = createAsyncThunk(
  'user/fetchCurrentUserHasOrders',
  fetchCurrentUserHasOrdersPayloadCreator
);

// Backward compatible wrapper for the thunk
export const fetchCurrentUserHasOrders = () => (dispatch, getState, sdk) => {
  return dispatch(fetchCurrentUserHasOrdersThunk()).unwrap();
};

/////////////////////////////////////////////////////////////////////////////////////
// Fetch transactions in specific states to check if currentUser has notifications //
/////////////////////////////////////////////////////////////////////////////////////

// Notificaiton page size is max (100 items on page)
const NOTIFICATION_PAGE_SIZE = 100;

const fetchCurrentUserNotificationsPayloadCreator = (_, { extra: sdk, rejectWithValue }) => {
  const statesNeedingProviderAttention = getStatesNeedingProviderAttention() || [];
  const statesNeedingCustomerAttention = getStatesNeedingCustomerAttention() || [];

  const paramsForSales = {
    only: 'sale',
    states: statesNeedingProviderAttention.map(state => `state/${state}`).join(','),
    page: 1,
    perPage: NOTIFICATION_PAGE_SIZE,
  };
  const paramsForOrders = {
    only: 'order',
    states: statesNeedingCustomerAttention.map(state => `state/${state}`).join(','),
    page: 1,
    perPage: NOTIFICATION_PAGE_SIZE,
  };

  return Promise.all([
    sdk.transactions.query(paramsForSales),
    sdk.transactions.query(paramsForOrders),
  ])
    .then(([sales, orders]) => {
      const saleNotificationsCount = sales.data.data.length;
      const orderNotificationsCount = orders.data.data.length;
      return { saleNotificationsCount, orderNotificationsCount };
    })
    .catch(e => rejectWithValue(storableError(e)));
};

export const fetchCurrentUserNotificationsThunk = createAsyncThunk(
  'user/fetchCurrentUserNotifications',
  fetchCurrentUserNotificationsPayloadCreator
);

// Backward compatible wrapper for the thunk
export const fetchCurrentUserNotifications = () => (dispatch, getState, sdk) => {
  return dispatch(fetchCurrentUserNotificationsThunk()).unwrap();
};

const fetchCurrentUserPayloadCreator = (options, thunkAPI) => {
  const { getState, dispatch, extra: sdk, rejectWithValue } = thunkAPI;
  const state = getState();
  const { currentUserHasListings, currentUserShowTimestamp } = state.user || {};
  const { isAuthenticated } = state.auth;
  const {
    callParams = null,
    updateHasListings = true,
    updateNotifications = true,
    afterLogin,
    enforce = false, // Automatic emailVerification might be called too fast
  } = options || {};

  // Double fetch might happen when e.g. profile page is making a full page load
  const aSecondAgo = new Date().getTime() - 1000;
  if (!enforce && currentUserShowTimestamp > aSecondAgo) {
    return Promise.resolve(state.user.currentUser);
  }

  if (!isAuthenticated && !afterLogin) {
    // Make sure current user is null
    return Promise.resolve(null);
  }

  const parameters = callParams || {
    include: ['effectivePermissionSet', 'profileImage', 'stripeAccount'],
    'fields.image': [
      'variants.square-small',
      'variants.square-small2x',
      'variants.square-xsmall',
      'variants.square-xsmall2x',
    ],
    'imageVariant.square-xsmall': sdkUtil.objectQueryString({
      w: 40,
      h: 40,
      fit: 'crop',
    }),
    'imageVariant.square-xsmall2x': sdkUtil.objectQueryString({
      w: 80,
      h: 80,
      fit: 'crop',
    }),
  };

  return sdk.currentUser
    .show(parameters)
    .then(response => {
      const entities = denormalisedResponseEntities(response);
      if (entities.length !== 1) {
        throw new Error('Expected a resource in the sdk.currentUser.show response');
      }
      const currentUser = entities[0];

      // Save stripeAccount to store.stripe.stripeAccount if it exists
      if (currentUser.stripeAccount) {
        dispatch(updateStripeConnectAccount(currentUser.stripeAccount));
      }

      // set current user id to the logger
      log.setUserId(currentUser.id.uuid);
      return currentUser;
    })
    .then(currentUser => {
      // If currentUser is not active (e.g. in 'pending-approval' state),
      // then they don't have listings or transactions that we care about.
      if (isUserAuthorized(currentUser)) {
        if (currentUserHasListings === false && updateHasListings !== false) {
          dispatch(fetchCurrentUserHasListings());
        }

        if (updateNotifications !== false) {
          dispatch(fetchCurrentUserNotifications());
        }

        if (!currentUser.attributes.emailVerified) {
          dispatch(fetchCurrentUserHasOrders());
        }
      }

      // Make sure auth info is up to date
      dispatch(authInfo());
      return currentUser;
    })
    .catch(e => {
      // Make sure auth info is up to date
      dispatch(authInfo());
      log.error(e, 'fetch-current-user-failed');
      return rejectWithValue(storableError(e));
    });
};

export const fetchCurrentUserThunk = createAsyncThunk(
  'user/fetchCurrentUser',
  fetchCurrentUserPayloadCreator
);
// Backward compatible wrapper for the thunk
/**
 * Fetch currentUser API entity.
 *
 * @param {Object} options
 * @param {Object} [options.callParams]           Optional parameters for the currentUser.show().
 * @param {boolean} [options.updateHasListings]   Make extra call for fetchCurrentUserHasListings()?
 * @param {boolean} [options.updateNotifications] Make extra call for fetchCurrentUserNotifications()?
 * @param {boolean} [options.afterLogin]          Fetch is no-op for unauthenticated users except after login() call
 * @param {boolean} [options.enforce]             Enforce the call even if the currentUser entity is freshly fetched.
 */
export const fetchCurrentUser = options => (dispatch, getState, sdk) => {
  return dispatch(fetchCurrentUserThunk(options)).unwrap();
};

/////////////////////////////////////////////
// Send verification email to currentUser //
/////////////////////////////////////////////

const sendVerificationEmailPayloadCreator = (_, { extra: sdk, rejectWithValue }) => {
  return sdk.currentUser
    .sendVerificationEmail()
    .then(() => ({}))
    .catch(e => rejectWithValue(storableError(e)));
};
export const sendVerificationEmailThunk = createAsyncThunk(
  'user/sendVerificationEmail',
  sendVerificationEmailPayloadCreator,
  {
    condition: (_, { getState }) => {
      return !getState()?.user?.sendVerificationEmailInProgress;
    },
  }
);

// Backward compatible wrapper for the thunk
export const sendVerificationEmail = () => (dispatch, getState, sdk) => {
  return dispatch(sendVerificationEmailThunk()).unwrap();
};

///////////////////////////////////////////
// Add listing to favorites (CUSTOM)    //
///////////////////////////////////////////

const addListingToFavoritesPayloadCreator = (listingId, thunkAPI) => {
  const { getState, dispatch, extra: sdk, rejectWithValue } = thunkAPI;
  const { currentUser } = getState().user;

  // Get current favorites from optimistically updated state
  const currentFavorites = getFavoriteListingIds(currentUser);

  // Since we use optimistic updates, the listingId is already in the array
  // Just send the current state to the server
  return sdk.currentUser
    .updateProfile({
      publicData: {
        favoriteListingIds: currentFavorites,
      },
    })
    .then(() => {
      // Refresh current user data
      dispatch(fetchCurrentUser());
      return { listingId };
    })
    .catch(e => {
      log.error(e, 'add-listing-to-favorites-failed', { listingId });
      return rejectWithValue({ error: storableError(e), listingId });
    });
};

export const addListingToFavoritesThunk = createAsyncThunk(
  'user/addListingToFavorites',
  addListingToFavoritesPayloadCreator
);

// Backward compatible wrapper for the thunk
export const addListingToFavorites = listingId => (dispatch, getState, sdk) => {
  return dispatch(addListingToFavoritesThunk(listingId)).unwrap();
};

///////////////////////////////////////////////
// Remove listing from favorites (CUSTOM)   //
///////////////////////////////////////////////

const removeListingFromFavoritesPayloadCreator = (listingId, thunkAPI) => {
  const { getState, dispatch, extra: sdk, rejectWithValue } = thunkAPI;
  const { currentUser } = getState().user;

  // Get current favorites from optimistically updated state
  const currentFavorites = getFavoriteListingIds(currentUser);

  // Since we use optimistic updates, the listingId is already removed
  // Just send the current state to the server
  return sdk.currentUser
    .updateProfile({
      publicData: {
        favoriteListingIds: currentFavorites,
      },
    })
    .then(() => {
      // Refresh current user data
      dispatch(fetchCurrentUser());
      return { listingId };
    })
    .catch(e => {
      log.error(e, 'remove-listing-from-favorites-failed', { listingId });
      return rejectWithValue({ error: storableError(e), listingId });
    });
};

export const removeListingFromFavoritesThunk = createAsyncThunk(
  'user/removeListingFromFavorites',
  removeListingFromFavoritesPayloadCreator
);

// Backward compatible wrapper for the thunk
export const removeListingFromFavorites = listingId => (dispatch, getState, sdk) => {
  return dispatch(removeListingFromFavoritesThunk(listingId)).unwrap();
};

///////////////////////////////////////////
// Add listing to cart (CUSTOM)         //
///////////////////////////////////////////

const addListingToCartPayloadCreator = ({ listingId, quantity = 1 }, thunkAPI) => {
  const { getState, dispatch, extra: sdk, rejectWithValue } = thunkAPI;
  const { currentUser } = getState().user;

  // Get current cart items from optimistically updated state
  const currentCartItems = getCartItems(currentUser);

  // Since we use optimistic updates, the item is already added
  // Just send the current state to the server
  // Note: deliveryMethod is not stored per cart item - it's determined from listing data in CartPage
  return sdk.currentUser
    .updateProfile({
      privateData: {
        cartItems: currentCartItems,
      },
    })
    .then(() => {
      // Refresh current user data
      dispatch(fetchCurrentUser());
      return { listingId, quantity };
    })
    .catch(e => {
      log.error(e, 'add-listing-to-cart-failed', { listingId });
      return rejectWithValue({ error: storableError(e), listingId });
    });
};

export const addListingToCartThunk = createAsyncThunk(
  'user/addListingToCart',
  addListingToCartPayloadCreator
);

// Backward compatible wrapper for the thunk
export const addListingToCart = (listingId, quantity = 1, frameInfo = null) => (dispatch, getState, sdk) => {
  return dispatch(addListingToCartThunk({ listingId, quantity, frameInfo })).unwrap();
};

///////////////////////////////////////////////
// Remove listing from cart (CUSTOM)        //
///////////////////////////////////////////////

const removeListingFromCartPayloadCreator = (listingId, thunkAPI) => {
  const { getState, dispatch, extra: sdk, rejectWithValue } = thunkAPI;
  const { currentUser } = getState().user;

  // Get current cart items from optimistically updated state
  const currentCartItems = getCartItems(currentUser);

  // Since we use optimistic updates, the item is already removed
  // Just send the current state to the server
  return sdk.currentUser
    .updateProfile({
      privateData: {
        cartItems: currentCartItems,
      },
    })
    .then(() => {
      // Refresh current user data
      dispatch(fetchCurrentUser());
      return { listingId };
    })
    .catch(e => {
      log.error(e, 'remove-listing-from-cart-failed', { listingId });
      return rejectWithValue({ error: storableError(e), listingId });
    });
};

export const removeListingFromCartThunk = createAsyncThunk(
  'user/removeListingFromCart',
  removeListingFromCartPayloadCreator
);

// Backward compatible wrapper for the thunk
export const removeListingFromCart = listingId => (dispatch, getState, sdk) => {
  return dispatch(removeListingFromCartThunk(listingId)).unwrap();
};

///////////////////////////////////////////////
// Update cart item quantity (CUSTOM)       //
///////////////////////////////////////////////

const updateCartItemQuantityPayloadCreator = ({ listingId, quantity }, thunkAPI) => {
  const { getState, dispatch, extra: sdk, rejectWithValue } = thunkAPI;
  const { currentUser } = getState().user;

  // Get current cart items from optimistically updated state
  const currentCartItems = getCartItems(currentUser);

  // Send updated cart to server
  return sdk.currentUser
    .updateProfile({
      privateData: {
        cartItems: currentCartItems,
      },
    })
    .then(() => {
      return { listingId, quantity };
    })
    .catch(e => {
      log.error(e, 'update-cart-item-quantity-failed', { listingId, quantity });
      return rejectWithValue({ error: storableError(e), listingId, quantity });
    });
};

export const updateCartItemQuantityThunk = createAsyncThunk(
  'user/updateCartItemQuantity',
  updateCartItemQuantityPayloadCreator
);

// Backward compatible wrapper for the thunk
export const updateCartItemQuantity = (listingId, quantity) => (dispatch, getState, sdk) => {
  return dispatch(updateCartItemQuantityThunk({ listingId, quantity })).unwrap();
};

///////////////////////////////////////////////
// Clear cart (CUSTOM)                      //
///////////////////////////////////////////////

const clearCartPayloadCreator = (_, thunkAPI) => {
  const { dispatch, extra: sdk, rejectWithValue } = thunkAPI;

  return sdk.currentUser
    .updateProfile({
      privateData: {
        cartItems: [],
      },
    })
    .then(() => {
      dispatch(fetchCurrentUser());
      return {};
    })
    .catch(e => {
      log.error(e, 'clear-cart-failed');
      return rejectWithValue({ error: storableError(e) });
    });
};

export const clearCartThunk = createAsyncThunk(
  'user/clearCart',
  clearCartPayloadCreator
);

// Backward compatible wrapper for the thunk
export const clearCart = () => (dispatch, getState, sdk) => {
  return dispatch(clearCartThunk()).unwrap();
};

// ================ Slice ================ //

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    currentUserShowTimestamp: 0,
    currentUserShowError: null,
    currentUserHasListings: false,
    currentUserHasListingsError: null,
    currentUserSaleNotificationCount: 0,
    currentUserOrderNotificationCount: 0,
    currentUserNotificationCountError: null,
    currentUserHasOrders: null, // This is not fetched unless unverified emails exist
    currentUserHasOrdersError: null,
    sendVerificationEmailInProgress: false,
    sendVerificationEmailError: null,
    // Favorites
    addListingToFavoritesInProgress: false,
    addListingToFavoritesError: null,
    removeListingFromFavoritesInProgress: false,
    removeListingFromFavoritesError: null,
    currentFavoriteListingId: null,
    // Cart
    addListingToCartInProgress: false,
    addListingToCartError: null,
    removeListingFromCartInProgress: false,
    removeListingFromCartError: null,
    updateCartItemQuantityInProgress: false,
    updateCartItemQuantityError: null,
    clearCartInProgress: false,
    clearCartError: null,
    currentCartListingId: null,
  },
  reducers: {
    clearCurrentUser: state => {
      state.currentUser = null;
      state.currentUserShowError = null;
      state.currentUserHasListings = false;
      state.currentUserHasListingsError = null;
      state.currentUserSaleNotificationCount = 0;
      state.currentUserOrderNotificationCount = 0;

      state.currentUserNotificationCountError = null;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = mergeCurrentUser(state.currentUser, action.payload);
    },
    setCurrentUserHasOrders: state => {
      state.currentUserHasOrders = true;
    },
    // Optimistic cart clear after purchase - only updates Redux state, no API call
    // The actual cleanup is handled by the worker script
    clearCartOptimistic: state => {
      if (state.currentUser?.attributes?.profile?.privateData) {
        state.currentUser.attributes.profile.privateData.cartItems = [];
      }
    },
  },
  extraReducers: builder => {
    builder
      // fetchCurrentUser
      .addCase(fetchCurrentUserThunk.pending, state => {
        state.currentUserShowError = null;
      })
      .addCase(fetchCurrentUserThunk.fulfilled, (state, action) => {
        state.currentUser = mergeCurrentUser(state.currentUser, action.payload);
        state.currentUserShowTimestamp = action.payload ? new Date().getTime() : 0;
      })
      .addCase(fetchCurrentUserThunk.rejected, (state, action) => {
        // eslint-disable-next-line no-console
        console.error(action.payload);
        state.currentUserShowError = action.payload;
      })
      // fetchCurrentUserHasListings
      .addCase(fetchCurrentUserHasListingsThunk.pending, state => {
        state.currentUserHasListingsError = null;
      })
      .addCase(fetchCurrentUserHasListingsThunk.fulfilled, (state, action) => {
        state.currentUserHasListings = action.payload.hasListings;
      })
      .addCase(fetchCurrentUserHasListingsThunk.rejected, (state, action) => {
        console.error(action.payload); // eslint-disable-line
        state.currentUserHasListingsError = action.payload;
      })
      // fetchCurrentUserNotifications
      .addCase(fetchCurrentUserNotificationsThunk.pending, state => {
        state.currentUserNotificationCountError = null;
      })
      .addCase(fetchCurrentUserNotificationsThunk.fulfilled, (state, action) => {
        state.currentUserSaleNotificationCount = action.payload.saleNotificationsCount;
        state.currentUserOrderNotificationCount = action.payload.orderNotificationsCount;
      })
      .addCase(fetchCurrentUserNotificationsThunk.rejected, (state, action) => {
        console.error(action.payload); // eslint-disable-line
        state.currentUserNotificationCountError = action.payload;
      })
      // fetchCurrentUserHasOrders
      .addCase(fetchCurrentUserHasOrdersThunk.pending, state => {
        state.currentUserHasOrdersError = null;
      })
      .addCase(fetchCurrentUserHasOrdersThunk.fulfilled, (state, action) => {
        state.currentUserHasOrders = action.payload.hasOrders;
      })
      .addCase(fetchCurrentUserHasOrdersThunk.rejected, (state, action) => {
        console.error(action.payload); // eslint-disable-line
        state.currentUserHasOrdersError = action.payload;
      })
      // sendVerificationEmail
      .addCase(sendVerificationEmailThunk.pending, state => {
        state.sendVerificationEmailInProgress = true;
        state.sendVerificationEmailError = null;
      })
      .addCase(sendVerificationEmailThunk.fulfilled, state => {
        state.sendVerificationEmailInProgress = false;
      })
      .addCase(sendVerificationEmailThunk.rejected, (state, action) => {
        state.sendVerificationEmailInProgress = false;
        state.sendVerificationEmailError = action.payload;
      })
      // addListingToFavorites
      .addCase(addListingToFavoritesThunk.pending, (state, action) => {
        state.addListingToFavoritesInProgress = true;
        state.addListingToFavoritesError = null;
        state.currentFavoriteListingId = action.meta.arg;

        // Optimistic update: add to favorites immediately
        const listingId = action.meta.arg;
        if (state.currentUser?.attributes?.profile?.publicData) {
          const currentFavorites = state.currentUser.attributes.profile.publicData.favoriteListingIds || [];
          if (!currentFavorites.includes(listingId)) {
            state.currentUser.attributes.profile.publicData.favoriteListingIds = [listingId, ...currentFavorites];
          }
        }
      })
      .addCase(addListingToFavoritesThunk.fulfilled, state => {
        state.addListingToFavoritesInProgress = false;
        state.currentFavoriteListingId = null;
      })
      .addCase(addListingToFavoritesThunk.rejected, (state, action) => {
        state.addListingToFavoritesInProgress = false;
        state.addListingToFavoritesError = action.payload?.error || action.payload;
        state.currentFavoriteListingId = null;

        // Revert optimistic update on error
        const listingId = action.meta.arg;
        if (state.currentUser?.attributes?.profile?.publicData?.favoriteListingIds) {
          state.currentUser.attributes.profile.publicData.favoriteListingIds =
            state.currentUser.attributes.profile.publicData.favoriteListingIds.filter(id => id !== listingId);
        }
      })
      // removeListingFromFavorites
      .addCase(removeListingFromFavoritesThunk.pending, (state, action) => {
        state.removeListingFromFavoritesInProgress = true;
        state.removeListingFromFavoritesError = null;
        state.currentFavoriteListingId = action.meta.arg;

        // Optimistic update: remove from favorites immediately
        const listingId = action.meta.arg;
        if (state.currentUser?.attributes?.profile?.publicData?.favoriteListingIds) {
          state.currentUser.attributes.profile.publicData.favoriteListingIds =
            state.currentUser.attributes.profile.publicData.favoriteListingIds.filter(id => id !== listingId);
        }
      })
      .addCase(removeListingFromFavoritesThunk.fulfilled, state => {
        state.removeListingFromFavoritesInProgress = false;
        state.currentFavoriteListingId = null;
      })
      .addCase(removeListingFromFavoritesThunk.rejected, (state, action) => {
        state.removeListingFromFavoritesInProgress = false;
        state.removeListingFromFavoritesError = action.payload?.error || action.payload;
        state.currentFavoriteListingId = null;

        // Revert optimistic update on error: add back to favorites
        const listingId = action.meta.arg;
        if (state.currentUser?.attributes?.profile?.publicData) {
          const currentFavorites = state.currentUser.attributes.profile.publicData.favoriteListingIds || [];
          if (!currentFavorites.includes(listingId)) {
            state.currentUser.attributes.profile.publicData.favoriteListingIds = [listingId, ...currentFavorites];
          }
        }
      })
      // addListingToCart
      .addCase(addListingToCartThunk.pending, (state, action) => {
        state.addListingToCartInProgress = true;
        state.addListingToCartError = null;
        state.currentCartListingId = action.meta.arg.listingId;

        // Optimistic update: add to cart immediately
        const { listingId, quantity, frameInfo } = action.meta.arg;
        if (state.currentUser?.attributes?.profile?.privateData) {
          const currentCartItems = state.currentUser.attributes.profile.privateData.cartItems || [];
          const existingItemIndex = currentCartItems.findIndex(item => item.listingId === listingId);
          if (existingItemIndex === -1) {
            // Cart items store listingId, quantity, and optional frame info
            // Delivery method is determined from listing data in CartPage
            const cartItem = {
              listingId,
              quantity: quantity || 1,
              // Include frame info if provided
              ...(frameInfo ? {
                selectedFrameId: frameInfo.selectedFrameId,
                selectedFrameColor: frameInfo.selectedFrameColor,
                selectedFrameLabel: frameInfo.selectedFrameLabel,
                framePriceInSubunits: frameInfo.framePriceInSubunits,
              } : {}),
            };
            state.currentUser.attributes.profile.privateData.cartItems = [
              ...currentCartItems,
              cartItem,
            ];
          }
        }
      })
      .addCase(addListingToCartThunk.fulfilled, state => {
        state.addListingToCartInProgress = false;
        state.currentCartListingId = null;
      })
      .addCase(addListingToCartThunk.rejected, (state, action) => {
        state.addListingToCartInProgress = false;
        state.addListingToCartError = action.payload?.error || action.payload;
        state.currentCartListingId = null;

        // Revert optimistic update on error
        const { listingId } = action.meta.arg;
        if (state.currentUser?.attributes?.profile?.privateData?.cartItems) {
          state.currentUser.attributes.profile.privateData.cartItems =
            state.currentUser.attributes.profile.privateData.cartItems.filter(item => item.listingId !== listingId);
        }
      })
      // removeListingFromCart
      .addCase(removeListingFromCartThunk.pending, (state, action) => {
        state.removeListingFromCartInProgress = true;
        state.removeListingFromCartError = null;
        state.currentCartListingId = action.meta.arg;

        // Optimistic update: remove from cart immediately
        const listingId = action.meta.arg;
        if (state.currentUser?.attributes?.profile?.privateData?.cartItems) {
          state.currentUser.attributes.profile.privateData.cartItems =
            state.currentUser.attributes.profile.privateData.cartItems.filter(item => item.listingId !== listingId);
        }
      })
      .addCase(removeListingFromCartThunk.fulfilled, state => {
        state.removeListingFromCartInProgress = false;
        state.currentCartListingId = null;
      })
      .addCase(removeListingFromCartThunk.rejected, (state, action) => {
        state.removeListingFromCartInProgress = false;
        state.removeListingFromCartError = action.payload?.error || action.payload;
        state.currentCartListingId = null;

        // Note: We don't revert here since we don't have the original quantity
      })
      // updateCartItemQuantity
      .addCase(updateCartItemQuantityThunk.pending, (state, action) => {
        state.updateCartItemQuantityInProgress = true;
        state.updateCartItemQuantityError = null;

        // Optimistic update: update quantity immediately
        const { listingId, quantity } = action.meta.arg;
        if (state.currentUser?.attributes?.profile?.privateData?.cartItems) {
          const cartItems = state.currentUser.attributes.profile.privateData.cartItems;
          const itemIndex = cartItems.findIndex(item => item.listingId === listingId);
          if (itemIndex !== -1) {
            state.currentUser.attributes.profile.privateData.cartItems[itemIndex].quantity = quantity;
          }
        }
      })
      .addCase(updateCartItemQuantityThunk.fulfilled, state => {
        state.updateCartItemQuantityInProgress = false;
      })
      .addCase(updateCartItemQuantityThunk.rejected, (state, action) => {
        state.updateCartItemQuantityInProgress = false;
        state.updateCartItemQuantityError = action.payload?.error || action.payload;
      })
      // clearCart
      .addCase(clearCartThunk.pending, state => {
        state.clearCartInProgress = true;
        state.clearCartError = null;

        // Optimistic update: clear cart immediately
        if (state.currentUser?.attributes?.profile?.privateData) {
          state.currentUser.attributes.profile.privateData.cartItems = [];
        }
      })
      .addCase(clearCartThunk.fulfilled, state => {
        state.clearCartInProgress = false;
      })
      .addCase(clearCartThunk.rejected, (state, action) => {
        state.clearCartInProgress = false;
        state.clearCartError = action.payload?.error || action.payload;
      });
  },
});

export default userSlice.reducer;

export const { clearCurrentUser, setCurrentUser, setCurrentUserHasOrders, clearCartOptimistic } = userSlice.actions;

// ================ Selectors ================ //

export const hasCurrentUserErrors = state => {
  const { user } = state;
  return (
    user.currentUserShowError ||
    user.currentUserHasListingsError ||
    user.currentUserNotificationCountError ||
    user.currentUserHasOrdersError
  );
};
