import React, { useState, useEffect } from 'react';

// Import contexts and util modules
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { pathByRouteName } from '../../util/routes';
import { isValidCurrencyForTransactionProcess } from '../../util/fieldHelpers.js';
import { propTypes } from '../../util/types';
import { ensureTransaction } from '../../util/data';
import { createSlug } from '../../util/urlHelpers';
import { isTransactionInitiateListingNotFoundError } from '../../util/errors';
import {
  getProcess,
  isBookingProcessAlias,
  resolveLatestProcessName,
  BOOKING_PROCESS_NAME,
  NEGOTIATION_PROCESS_NAME,
  PURCHASE_PROCESS_NAME,
} from '../../transactions/transaction';
import { clearCartOptimistic } from '../../ducks/user.duck';

// Import shared components
import { H3, H4, NamedLink, OrderBreakdown, Page, TopbarSimplified } from '../../components';

import {
  bookingDatesMaybe,
  buildKlarnaReturnUrl,
  getBillingDetails,
  getFormattedTotalPrice,
  getShippingDetailsMaybe,
  getTransactionTypeData,
  hasDefaultPaymentMethod,
  hasPaymentExpired,
  hasTransactionPassedPendingPayment,
  isInKlarnaPendingState,
  isInCardPendingState,
  processCheckoutWithPayment,
  processCheckoutWithKlarna,
  setOrderPageInitialValues,
} from './CheckoutPageTransactionHelpers.js';
import { getErrorMessages } from './ErrorMessages';

import StripePaymentForm from './StripePaymentForm/StripePaymentForm';
import DetailsSideCard from './DetailsSideCard';
import MobileListingImage from './MobileListingImage';
import MobileOrderBreakdown from './MobileOrderBreakdown';

import css from './CheckoutPage.module.css';

// Stripe PaymentIntent statuses, where user actions are already completed
// https://stripe.com/docs/payments/payment-intents/status
const STRIPE_PI_USER_ACTIONS_DONE_STATUSES = ['processing', 'requires_capture', 'succeeded'];

// Payment charge options
const ONETIME_PAYMENT = 'ONETIME_PAYMENT';
const PAY_AND_SAVE_FOR_LATER_USE = 'PAY_AND_SAVE_FOR_LATER_USE';
const USE_SAVED_CARD = 'USE_SAVED_CARD';

const paymentFlow = (selectedPaymentMethod, saveAfterOnetimePayment) => {
  // Payment mode could be 'replaceCard', but without explicit saveAfterOnetimePayment flag,
  // we'll handle it as one-time payment
  return selectedPaymentMethod === 'defaultCard'
    ? USE_SAVED_CARD
    : saveAfterOnetimePayment
    ? PAY_AND_SAVE_FOR_LATER_USE
    : ONETIME_PAYMENT;
};

const capitalizeString = s => `${s.charAt(0).toUpperCase()}${s.substr(1)}`;

/**
 * Prefix the properties of the chosen price variant as first level properties for the protected data of the transaction
 *
 * @example
 * const priceVariant = {
 *   name: 'something',
 * }
 *
 * will be returned as:
 * const priceVariant = {
 *   priceVariantName: 'something',
 * }
 *
 * @param {Object} priceVariant - The price variant object
 * @returns {Object} The price variant object with the properties prefixed with priceVariant*
 */
const prefixPriceVariantProperties = priceVariant => {
  if (!priceVariant) {
    return {};
  }

  const entries = Object.entries(priceVariant).map(([key, value]) => {
    return [`priceVariant${capitalizeString(key)}`, value];
  });
  return Object.fromEntries(entries);
};

/**
 * Construct orderParams object using pageData from session storage, shipping details, and optional payment params.
 * Note: This is used for both speculate transition and real transition
 *       - Speculate transition is called, when the the component is mounted. It's used to test if the data can go through the API validation
 *       - Real transition is made, when the user submits the StripePaymentForm.
 *
 * @param {Object} pageData data that's saved to session storage.
 * @param {Object} shippingDetails shipping address if applicable.
 * @param {Object} optionalPaymentParams (E.g. paymentMethod or setupPaymentMethodForSaving)
 * @param {Object} config app-wide configs. This contains hosted configs too.
 * @returns orderParams.
 */
const getOrderParams = (pageData, shippingDetails, optionalPaymentParams, config) => {
  const quantity = pageData.orderData?.quantity;
  const quantityMaybe = quantity ? { quantity } : {};
  const seats = pageData.orderData?.seats;
  const seatsMaybe = seats ? { seats } : {};
  // Get deliveryMethod from orderData or transaction protectedData (for negotiated-purchase flow)
  const deliveryMethod = pageData.orderData?.deliveryMethod || pageData.transaction?.attributes?.protectedData?.deliveryMethod;
  const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};
  const { listingType, unitType, priceVariants } = pageData?.listing?.attributes?.publicData || {};

  // price variant data for fixed duration bookings
  const priceVariantName = pageData.orderData?.priceVariantName;
  const priceVariantNameMaybe = priceVariantName ? { priceVariantName } : {};
  const priceVariant = priceVariants?.find(pv => pv.name === priceVariantName);
  const priceVariantMaybe = priceVariant ? prefixPriceVariantProperties(priceVariant) : {};

  // Pass cart items to orderParams - will be transformed in CheckoutPage.duck.js
  const cartItemsMaybe = pageData.cartItems ? { cartItems: pageData.cartItems } : {};

  // Frame info for the main listing
  const frameInfo = pageData.orderData?.frameInfo;
  const frameInfoMaybe = frameInfo ? { frameInfo } : {};

  // For negotiated-purchase, get the offer amount from the transaction
  const transactionUnitType = pageData.transaction?.attributes?.protectedData?.unitType;
  const isNegotiatedPurchase = transactionUnitType === 'negotiatedItem';

  // Get offer from transaction's metadata or line items
  let offerInSubunitsMaybe = {};
  if (isNegotiatedPurchase && pageData.transaction) {
    // First try metadata.offers (most reliable)
    const metadataOffers = pageData.transaction.attributes?.metadata?.offers || [];
    const latestOffer = metadataOffers[metadataOffers.length - 1];

    if (latestOffer?.offerInSubunits) {
      offerInSubunitsMaybe = { offerInSubunits: latestOffer.offerInSubunits };
    } else {
      // Fallback: get from line items
      const negotiatedLineItem = pageData.transaction.attributes?.lineItems?.find(
        item => item.code === 'line-item/negotiatedItem' && !item.reversal
      );
      if (negotiatedLineItem?.unitPrice?.amount) {
        offerInSubunitsMaybe = { offerInSubunits: negotiatedLineItem.unitPrice.amount };
      }
    }
  }

  // For negotiated-purchase, use the transaction's unitType instead of listing's
  const effectiveUnitType = isNegotiatedPurchase ? transactionUnitType : unitType;

  const protectedDataMaybe = {
    protectedData: {
      ...getTransactionTypeData(listingType, effectiveUnitType || unitType, config),
      // For negotiated-purchase, explicitly set the unitType
      ...(isNegotiatedPurchase ? { unitType: 'negotiatedItem' } : {}),
      ...deliveryMethodMaybe,
      ...shippingDetails,
      ...priceVariantMaybe,
      // Include main listing's frame info in protectedData
      ...(frameInfo ? {
        mainListingFrameInfo: {
          selectedFrameId: frameInfo.selectedFrameId,
          selectedFrameColor: frameInfo.selectedFrameColor,
          selectedFrameLabel: frameInfo.selectedFrameLabel,
          framePriceInSubunits: frameInfo.framePriceInSubunits,
        },
      } : {}),
    },
  };

  // Note: Avoid misinterpreting the following logic as allowing arbitrary mixing of `quantity` and `seats`.
  // You can only pass either quantity OR seats and units to the orderParams object
  // Quantity represents the total booked units for the line item (e.g. days, hours).
  // When quantity is not passed, we pass seats and units.
  // If `bookingDatesMaybe` is provided, it determines `units`, and `seats` defaults to 1
  // (implying quantity = units)

  // These are the order parameters for the first payment-related transition
  // which is either initiate-transition or initiate-transition-after-enquiry
  const orderParams = {
    listingId: pageData?.listing?.id,
    ...deliveryMethodMaybe,
    ...quantityMaybe,
    ...seatsMaybe,
    ...bookingDatesMaybe(pageData.orderData?.bookingDates),
    ...priceVariantNameMaybe,
    ...cartItemsMaybe,
    ...frameInfoMaybe,
    ...protectedDataMaybe,
    ...optionalPaymentParams,
    ...offerInSubunitsMaybe,
  };
  return orderParams;
};

const fetchSpeculatedTransactionIfNeeded = (orderParams, pageData, fetchSpeculatedTransaction) => {
  const tx = pageData ? pageData.transaction : null;
  const pageDataListing = pageData.listing;
  const processName =
    tx?.attributes?.processName ||
    pageDataListing?.attributes?.publicData?.transactionProcessAlias?.split('/')[0];
  const process = processName ? getProcess(processName) : null;

  // If transaction has passed payment-pending state, speculated tx is not needed.
  const shouldFetchSpeculatedTransaction =
    !!pageData?.listing?.id &&
    !!pageData.orderData &&
    !!process &&
    !hasTransactionPassedPendingPayment(tx, process);

  if (shouldFetchSpeculatedTransaction) {
    const processAlias = pageData.listing.attributes.publicData?.transactionProcessAlias;
    const transactionId = tx ? tx.id : null;
    const isInquiryInPaymentProcess =
      tx?.attributes?.lastTransition === process.transitions.INQUIRE;
    const resolvedProcessName = resolveLatestProcessName(processName);
    const isOfferPendingInNegotiationProcess =
      resolvedProcessName === NEGOTIATION_PROCESS_NAME &&
      tx.attributes.state === `state/${process.states.OFFER_PENDING}`;

    const requestTransition = isInquiryInPaymentProcess
      ? process.transitions.REQUEST_PAYMENT_AFTER_INQUIRY
      : isOfferPendingInNegotiationProcess
      ? process.transitions.REQUEST_PAYMENT_TO_ACCEPT_OFFER
      : process.transitions.REQUEST_PAYMENT;
    const isPrivileged = process.isPrivileged(requestTransition);

    fetchSpeculatedTransaction(
      orderParams,
      processAlias,
      transactionId,
      requestTransition,
      isPrivileged
    );
  }
};

/**
 * Load initial data for the page
 *
 * Since the data for the checkout is not passed in the URL (there
 * might be lots of options in the future), we must pass in the data
 * some other way. Currently the ListingPage sets the initial data
 * for the CheckoutPage's Redux store.
 *
 * For some cases (e.g. a refresh in the CheckoutPage), the Redux
 * store is empty. To handle that case, we store the received data
 * to window.sessionStorage and read it from there if no props from
 * the store exist.
 *
 * This function also sets of fetching the speculative transaction
 * based on this initial data.
 */
export const loadInitialDataForStripePayments = ({
  pageData,
  fetchSpeculatedTransaction,
  fetchStripeCustomer,
  config,
}) => {
  // Fetch currentUser with stripeCustomer entity
  // Note: since there's need for data loading in "componentWillMount" function,
  //       this is added here instead of loadData static function.
  fetchStripeCustomer();

  // Skip speculation when returning from Klarna - the transaction is already created
  // and in pending-payment-klarna state
  const isKlarnaReturn = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('klarna_return') === 'true';

  if (isKlarnaReturn) {
    // Don't speculate - the Klarna return handler will take over
    return;
  }

  // Fetch speculated transaction for showing price in order breakdown
  // NOTE: if unit type is line-item/item, quantity needs to be added.
  // The way to pass it to checkout page is through pageData.orderData
  const shippingDetails = {};
  const optionalPaymentParams = {};
  const orderParams = getOrderParams(pageData, shippingDetails, optionalPaymentParams, config);

  fetchSpeculatedTransactionIfNeeded(orderParams, pageData, fetchSpeculatedTransaction);
};

const handleSubmit = (values, process, props, stripe, submitting, setSubmitting) => {
  if (submitting) {
    return;
  }
  setSubmitting(true);

  const {
    history,
    config,
    routeConfiguration,
    speculatedTransaction,
    currentUser,
    stripeCustomerFetched,
    paymentIntent,
    dispatch,
    onInitiateOrder,
    onConfirmCardPayment,
    onConfirmPayment,
    onConfirmKlarnaPayment,
    onSendMessage,
    onSavePaymentMethod,
    onSubmitCallback,
    pageData,
    setPageData,
    sessionStorageKey,
  } = props;
  const {
    card,
    message,
    paymentMethod: selectedPaymentMethod,
    formValues,
    walletPaymentMethodId,
  } = values;
  const { saveAfterOnetimePayment: saveAfterOnetimePaymentRaw } = formValues;

  // Check if this is a wallet payment (Google Pay, Apple Pay, Link, etc.)
  const isWalletPayment = selectedPaymentMethod === 'walletPayment' && walletPaymentMethodId;

  // Check if this is a Klarna payment
  const isKlarnaPayment = selectedPaymentMethod === 'klarna';

  const saveAfterOnetimePayment =
    Array.isArray(saveAfterOnetimePaymentRaw) && saveAfterOnetimePaymentRaw.length > 0;

  // Wallet payments work like saved card - they provide a payment_method ID directly
  const selectedPaymentFlow = isWalletPayment
    ? USE_SAVED_CARD
    : paymentFlow(selectedPaymentMethod, saveAfterOnetimePayment);

  const hasDefaultPaymentMethodSaved = hasDefaultPaymentMethod(stripeCustomerFetched, currentUser);
  const stripePaymentMethodId = hasDefaultPaymentMethodSaved
    ? currentUser?.stripeCustomer?.defaultPaymentMethod?.attributes?.stripePaymentMethodId
    : null;

  // Use wallet payment method ID if available, otherwise use saved card ID
  const effectivePaymentMethodId = isWalletPayment ? walletPaymentMethodId : stripePaymentMethodId;

  // If paymentIntent status is not waiting user action,
  // confirmCardPayment has been called previously.
  const hasPaymentIntentUserActionsDone =
    paymentIntent && STRIPE_PI_USER_ACTIONS_DONE_STATUSES.includes(paymentIntent.status);

  const shippingDetails = getShippingDetailsMaybe(formValues);
  const billingDetails = getBillingDetails(formValues, currentUser);

  // Handle Klarna payment separately
  if (isKlarnaPayment) {
    // For Klarna, we don't need paymentMethod in orderParams - it's handled differently
    const orderParams = getOrderParams(pageData, shippingDetails, {}, config);

    // Build Klarna return URL
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const listing = pageData.listing;
    const listingSlug = createSlug(listing?.attributes?.title || '');
    const listingId = listing?.id?.uuid;
    // Use 'pending' for transaction ID - will be replaced after order is created
    const returnUrl = buildKlarnaReturnUrl(origin, listingSlug, listingId, 'pending');

    const klarnaPaymentParams = {
      pageData,
      speculatedTransaction,
      stripe,
      billingDetails,
      message,
      process,
      onInitiateOrder,
      onConfirmKlarnaPayment,
      onSendMessage,
      sessionStorageKey,
      setPageData,
      returnUrl,
    };

    processCheckoutWithKlarna(orderParams, klarnaPaymentParams)
      .then(response => {
        // Klarna redirects the user, so we shouldn't reach here unless there's an error
        // The response will be 'klarna_redirect' if successfully redirected
        if (response === 'klarna_redirect') {
          // User was redirected to Klarna - this code won't run
          return;
        }
        setSubmitting(false);
      })
      .catch(err => {
        console.error('Klarna payment error:', err);
        setSubmitting(false);
      });
    return;
  }

  const requestPaymentParams = {
    pageData,
    speculatedTransaction,
    stripe,
    card,
    billingDetails,
    message,
    paymentIntent,
    hasPaymentIntentUserActionsDone,
    stripePaymentMethodId: effectivePaymentMethodId,
    process,
    onInitiateOrder,
    onConfirmCardPayment,
    onConfirmPayment,
    onSendMessage,
    onSavePaymentMethod,
    sessionStorageKey,
    stripeCustomer: currentUser?.stripeCustomer,
    isPaymentFlowUseSavedCard: selectedPaymentFlow === USE_SAVED_CARD,
    // Don't save wallet payments as default payment method
    isPaymentFlowPayAndSaveCard: isWalletPayment ? false : selectedPaymentFlow === PAY_AND_SAVE_FOR_LATER_USE,
    setPageData,
  };

  // Note: optionalPaymentParams contains Stripe paymentMethod,
  // but that can also be passed on Step 2
  // stripe.confirmCardPayment(stripe, { payment_method: stripePaymentMethodId })
  // For wallet payments, we pass the wallet payment method ID directly
  const optionalPaymentParams = isWalletPayment
    ? { paymentMethod: walletPaymentMethodId }
    : selectedPaymentFlow === USE_SAVED_CARD && hasDefaultPaymentMethodSaved
    ? { paymentMethod: stripePaymentMethodId }
    : selectedPaymentFlow === PAY_AND_SAVE_FOR_LATER_USE
    ? { setupPaymentMethodForSaving: true }
    : {};

  // These are the order parameters for the first payment-related transition
  // which is either initiate-transition or initiate-transition-after-enquiry
  const orderParams = getOrderParams(pageData, shippingDetails, optionalPaymentParams, config);

  // There are multiple XHR calls that needs to be made against Stripe API and Sharetribe Marketplace API on checkout with payments
  processCheckoutWithPayment(orderParams, requestPaymentParams)
    .then(response => {
      const { orderId, messageSuccess, paymentMethodSaved } = response;
      setSubmitting(false);

      // Clear cart optimistically after successful purchase
      // The actual cleanup is handled by the worker script
      // This provides instant UI feedback for cart count
      const hasCartItems = pageData.cartItems && pageData.cartItems.length > 0;
      if (hasCartItems) {
        dispatch(clearCartOptimistic());
      }

      const initialMessageFailedToTransaction = messageSuccess ? null : orderId;
      const orderDetailsPath = pathByRouteName('OrderDetailsPage', routeConfiguration, {
        id: orderId.uuid,
      });
      const initialValues = {
        initialMessageFailedToTransaction,
        savePaymentMethodFailed: !paymentMethodSaved,
      };

      setOrderPageInitialValues(initialValues, routeConfiguration, dispatch);
      onSubmitCallback();
      history.push(orderDetailsPath);
    })
    .catch(err => {
      console.error(err);
      setSubmitting(false);
    });
};

const onStripeInitialized = (stripe, process, props) => {
  const { paymentIntent, onRetrievePaymentIntent, pageData } = props;
  const tx = pageData?.transaction || null;

  // We need to get up to date PI, if payment is pending but it's not expired.
  const shouldFetchPaymentIntent =
    stripe &&
    !paymentIntent &&
    tx?.id &&
    process?.getState(tx) === process?.states.PENDING_PAYMENT &&
    !hasPaymentExpired(tx, process);

  if (shouldFetchPaymentIntent) {
    const { stripePaymentIntentClientSecret } =
      tx.attributes.protectedData?.stripePaymentIntents?.default || {};

    // Fetch up to date PaymentIntent from Stripe
    onRetrievePaymentIntent({ stripe, stripePaymentIntentClientSecret });
  }
};

/**
 * A component that renders the checkout page with payment.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.scrollingDisabled - Whether the page should scroll
 * @param {string} props.speculateTransactionError - The error message for the speculate transaction
 * @param {propTypes.transaction} props.speculatedTransaction - The speculated transaction
 * @param {boolean} props.isClockInSync - Whether the clock is in sync
 * @param {string} props.initiateOrderError - The error message for the initiate order
 * @param {string} props.confirmPaymentError - The error message for the confirm payment
 * @param {intlShape} props.intl - The intl object
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {string} props.confirmCardPaymentError - The error message for the confirm card payment
 * @param {propTypes.paymentIntent} props.paymentIntent - The Stripe's payment intent
 * @param {boolean} props.stripeCustomerFetched - Whether the stripe customer has been fetched
 * @param {Object} props.pageData - The page data
 * @param {propTypes.listing} props.pageData.listing - The listing entity
 * @param {boolean} props.showListingImage - A boolean indicating whether images are enabled with this listing type
 * @param {propTypes.transaction} props.pageData.transaction - The transaction entity
 * @param {Object} props.pageData.orderData - The order data
 * @param {string} props.processName - The process name
 * @param {string} props.listingTitle - The listing title
 * @param {string} props.title - The title
 * @param {Function} props.onInitiateOrder - The function to initiate the order
 * @param {Function} props.onConfirmCardPayment - The function to confirm the card payment
 * @param {Function} props.onConfirmPayment - The function to confirm the payment after Stripe call is made
 * @param {Function} props.onSendMessage - The function to send a message
 * @param {Function} props.onSavePaymentMethod - The function to save the payment method for later use
 * @param {Function} props.onSubmitCallback - The function to submit the callback
 * @param {propTypes.error} props.initiateOrderError - The error message for the initiate order
 * @param {propTypes.error} props.confirmPaymentError - The error message for the confirm payment
 * @param {propTypes.error} props.confirmCardPaymentError - The error message for the confirm card payment
 * @param {propTypes.paymentIntent} props.paymentIntent - The Stripe's payment intent
 * @param {boolean} props.stripeCustomerFetched - Whether the stripe customer has been fetched
 * @param {Object} props.config - The config
 * @param {Object} props.routeConfiguration - The route configuration
 * @param {Object} props.history - The history object
 * @param {Object} props.history.push - The push state function of the history object
 * @returns {JSX.Element}
 */
export const CheckoutPageWithPayment = props => {
  const [submitting, setSubmitting] = useState(false);
  // Initialized stripe library is saved to state - if it's needed at some point here too.
  const [stripe, setStripe] = useState(null);
  const [klarnaProcessing, setKlarnaProcessing] = useState(false);
  const [klarnaError, setKlarnaError] = useState(null);
  const [cancelKlarnaInProgress, setCancelKlarnaInProgress] = useState(false);

  const {
    scrollingDisabled,
    speculateTransactionError,
    speculatedTransaction: speculatedTransactionMaybe,
    isClockInSync,
    initiateOrderError,
    confirmPaymentError,
    intl,
    currentUser,
    confirmCardPaymentError,
    showListingImage,
    paymentIntent,
    retrievePaymentIntentError,
    stripeCustomerFetched,
    pageData,
    processName,
    listingTitle,
    cartItemsCount,
    title,
    config,
    history,
    routeConfiguration,
    dispatch,
    onInitiateOrder,
    onConfirmPayment,
    onSendMessage,
    onSubmitCallback,
    onRetrievePaymentIntent,
  } = props;

  // Handle Klarna return from redirect
  useEffect(() => {
    const handleKlarnaReturn = async () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const isKlarnaReturn = urlParams.get('klarna_return') === 'true';
      const txIdFromUrl = urlParams.get('txId');
      const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');

      if (!isKlarnaReturn || !txIdFromUrl || klarnaProcessing) {
        return;
      }

      // Transaction should be loaded from session storage
      const existingTx = pageData?.transaction;
      if (!existingTx?.id || existingTx.id.uuid !== txIdFromUrl) {
        // Transaction not found or doesn't match
        setKlarnaError('Transaction not found');
        return;
      }

      // Wait for Stripe to be initialized
      if (!stripe) {
        return;
      }

      setKlarnaProcessing(true);

      try {
        // Retrieve PaymentIntent status from Stripe
        const stripePaymentIntents = existingTx.attributes.protectedData?.stripePaymentIntents;
        const clientSecret = paymentIntentClientSecret || stripePaymentIntents?.default?.stripePaymentIntentClientSecret;

        if (!clientSecret) {
          throw new Error('Payment intent client secret not found');
        }

        const { paymentIntent: retrievedPI, error: retrieveError } = await stripe.retrievePaymentIntent(clientSecret);

        if (retrieveError) {
          throw new Error(retrieveError.message);
        }

        // Check if payment was successful
        if (STRIPE_PI_USER_ACTIONS_DONE_STATUSES.includes(retrievedPI.status)) {
          // Confirm payment in Marketplace API
          const process = processName ? getProcess(processName) : null;
          const confirmTransition = process?.transitions?.CONFIRM_PAYMENT_KLARNA;

          if (confirmTransition) {
            await onConfirmPayment(existingTx.id, confirmTransition, {});
          }

          // Clear cart optimistically after successful purchase
          const hasCartItems = pageData.cartItems && pageData.cartItems.length > 0;
          if (hasCartItems) {
            dispatch(clearCartOptimistic());
          }

          // Redirect to order details
          const orderDetailsPath = pathByRouteName('OrderDetailsPage', routeConfiguration, {
            id: existingTx.id.uuid,
          });

          setOrderPageInitialValues({}, routeConfiguration, dispatch);
          onSubmitCallback();
          history.push(orderDetailsPath);
        } else if (retrievedPI.status === 'requires_payment_method') {
          // Payment failed or was cancelled
          setKlarnaError('Klarna payment was not completed. Please try again.');
          setKlarnaProcessing(false);
          // Clean up URL params
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          setKlarnaError(`Payment status: ${retrievedPI.status}`);
          setKlarnaProcessing(false);
        }
      } catch (err) {
        console.error('Klarna return processing error:', err);
        setKlarnaError(err.message || 'Failed to process Klarna payment');
        setKlarnaProcessing(false);
      }
    };

    handleKlarnaReturn();
  }, [stripe, pageData?.transaction?.id?.uuid, klarnaProcessing]);

  // Handler for cancelling Klarna payment to try a different payment method
  const handleCancelKlarnaPayment = async () => {
    const existingTx = pageData?.transaction;
    if (!existingTx?.id) {
      return;
    }

    setCancelKlarnaInProgress(true);

    try {
      const process = processName ? getProcess(processName) : null;
      const cancelTransition = process?.transitions?.CANCEL_PAYMENT_KLARNA;

      console.log('Cancel Klarna - processName:', processName);
      console.log('Cancel Klarna - cancelTransition:', cancelTransition);
      console.log('Cancel Klarna - txId:', existingTx.id);
      console.log('Cancel Klarna - lastTransition:', existingTx.attributes?.lastTransition);

      if (cancelTransition) {
        // Use onInitiateOrder with isPrivilegedTransition=true since cancel-payment-klarna
        // has stripe-refund-payment action which requires server-side handling
        await onInitiateOrder({}, processName, existingTx.id, cancelTransition, true);
      }

      // Reload page to get fresh state
      window.location.reload();
    } catch (err) {
      console.error('Failed to cancel Klarna payment:', err);
      setCancelKlarnaInProgress(false);
    }
  };

  // Since the listing data is already given from the ListingPage
  // and stored to handle refreshes, it might not have the possible
  // deleted or closed information in it. If the transaction
  // initiate or the speculative initiate fail due to the listing
  // being deleted or closed, we should dig the information from the
  // errors and not the listing data.
  const listingNotFound =
    isTransactionInitiateListingNotFoundError(speculateTransactionError) ||
    isTransactionInitiateListingNotFoundError(initiateOrderError);

  const { listing, transaction, orderData, cartItems: rawCartItems } = pageData;
  const existingTransaction = ensureTransaction(transaction);
  const speculatedTransaction = ensureTransaction(speculatedTransactionMaybe, {}, null);

  // If existing transaction has line-items, it has gone through one of the request-payment transitions.
  // Otherwise, we try to rely on speculatedTransaction for order breakdown data.
  const tx =
    existingTransaction?.attributes?.lineItems?.length > 0
      ? existingTransaction
      : speculatedTransaction;

  const timeZone = listing?.attributes?.availabilityPlan?.timezone;
  const transactionProcessAlias = listing?.attributes?.publicData?.transactionProcessAlias;
  const priceVariantName = tx.attributes.protectedData?.priceVariantName;

  // Transform cart items or get from protectedData
  // Cart items might be in raw format {listing, quantity} or already transformed {id, title, price, quantity}
  const cartItems = rawCartItems || tx.attributes.protectedData?.cartItems || [];

  // Get main listing's frame info from orderData or protectedData
  const mainListingFrameInfo = orderData?.frameInfo || tx.attributes.protectedData?.mainListingFrameInfo || null;

  const txBookingMaybe = tx?.booking?.id ? { booking: tx.booking, timeZone } : {};

  // Show breakdown only when (speculated?) transaction is loaded
  // (i.e. it has an id and lineItems)
  const breakdown =
    tx.id && tx.attributes.lineItems?.length > 0 ? (
      <OrderBreakdown
        className={css.orderBreakdown}
        userRole="customer"
        transaction={tx}
        {...txBookingMaybe}
        currency={config.currency}
        marketplaceName={config.marketplaceName}
        cartItems={cartItems}
        listing={listing}
        listingQuantity={pageData.orderData?.quantity}
        mainListingFrameInfo={mainListingFrameInfo}
      />
    ) : null;

  const totalPrice =
    tx?.attributes?.lineItems?.length > 0 ? getFormattedTotalPrice(tx, intl) : null;

  const process = processName ? getProcess(processName) : null;
  const transitions = process.transitions;
  const isPaymentExpired = hasPaymentExpired(existingTransaction, process, isClockInSync);

  // Check if transaction is stuck in Klarna or card pending state
  const isKlarnaPending = isInKlarnaPendingState(existingTransaction, process);
  const isCardPending = isInCardPendingState(existingTransaction, process);

  // Allow showing page when currentUser is still being downloaded,
  // but show payment form only when user info is loaded.
  const showPaymentForm = !!(
    currentUser &&
    !listingNotFound &&
    !initiateOrderError &&
    !speculateTransactionError &&
    !retrievePaymentIntentError &&
    !isPaymentExpired
  );

  const firstImage = listing?.images?.length > 0 ? listing.images[0] : null;

  const listingLink = (
    <NamedLink
      name="ListingPage"
      params={{ id: listing?.id?.uuid, slug: createSlug(listingTitle) }}
    >
      <FormattedMessage id="CheckoutPage.errorlistingLinkText" />
    </NamedLink>
  );

  const errorMessages = getErrorMessages(
    listingNotFound,
    initiateOrderError,
    isPaymentExpired,
    retrievePaymentIntentError,
    speculateTransactionError,
    listingLink
  );

  const isBooking = processName === BOOKING_PROCESS_NAME;
  const isPurchase = processName === PURCHASE_PROCESS_NAME;
  const isNegotiation = processName === NEGOTIATION_PROCESS_NAME;

  const txTransitions = existingTransaction?.attributes?.transitions || [];
  const hasInquireTransition = txTransitions.find(tr => tr.transition === transitions.INQUIRE);
  const showInitialMessageInput = !hasInquireTransition && !isNegotiation;

  // Get first and last name of the current user and use it in the StripePaymentForm to autofill the name field
  const userName = currentUser?.attributes?.profile
    ? `${currentUser.attributes.profile.firstName} ${currentUser.attributes.profile.lastName}`
    : null;

  // If paymentIntent status is not waiting user action,
  // confirmCardPayment has been called previously.
  const hasPaymentIntentUserActionsDone =
    paymentIntent && STRIPE_PI_USER_ACTIONS_DONE_STATUSES.includes(paymentIntent.status);

  // If your marketplace works mostly in one country you can use initial values to select country automatically
  // e.g. {country: 'FI'}

  const initialValuesForStripePayment = { name: userName, recipientName: userName };

  // Get delivery method from orderData or transaction protectedData (for negotiated-purchase flow)
  const deliveryMethod = orderData?.deliveryMethod || tx.attributes.protectedData?.deliveryMethod;

  const askShippingDetails =
    deliveryMethod === 'shipping' &&
    !hasTransactionPassedPendingPayment(existingTransaction, process);

  // Get pickup location - try main listing first, then fall back to cart items
  const mainListingLocation = listing?.attributes?.publicData?.location;
  const cartItemWithLocation = rawCartItems?.find(item =>
    item?.listing?.attributes?.publicData?.location?.address
  );
  const cartItemLocation = cartItemWithLocation?.listing?.attributes?.publicData?.location;
  const listingLocation = mainListingLocation?.address ? mainListingLocation : cartItemLocation;

  const showPickUpLocation = isPurchase && deliveryMethod === 'pickup';
  const showLocation = (isBooking || isNegotiation) && listingLocation?.address;

  const providerDisplayName = isNegotiation
    ? existingTransaction?.provider?.attributes?.profile?.displayName
    : listing?.author?.attributes?.profile?.displayName;

  // Check if the listing currency is compatible with Stripe for the specified transaction process.
  // This function validates the currency against the transaction process requirements and
  // ensures it is supported by Stripe, as indicated by the 'stripe' parameter.
  // If using a transaction process without any stripe actions, leave out the 'stripe' parameter.
  const currency =
    existingTransaction?.attributes?.payinTotal?.currency || listing.attributes.price?.currency;
  const isStripeCompatibleCurrency = isValidCurrencyForTransactionProcess(
    transactionProcessAlias,
    currency,
    'stripe'
  );

  // Render an error message if the listing is using a non Stripe supported currency
  // and is using a transaction process with Stripe actions (default-booking or default-purchase)
  if (!isStripeCompatibleCurrency) {
    return (
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        <TopbarSimplified />
        <div className={css.contentContainer}>
          <section className={css.incompatibleCurrency}>
            <H4 as="h1" className={css.heading}>
              <FormattedMessage id="CheckoutPage.incompatibleCurrency" />
            </H4>
          </section>
        </div>
      </Page>
    );
  }

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <TopbarSimplified />
      <div className={css.contentContainer}>
        <MobileListingImage
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
          showListingImage={showListingImage}
        />
        <main className={css.orderFormContainer}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              {title}
            </H3>
            <H4 as="h2" className={css.detailsHeadingMobile}>
              <FormattedMessage id="CheckoutPage.listingTitle" values={{ listingTitle }} />
            </H4>
          </div>
          <MobileOrderBreakdown
            speculateTransactionErrorMessage={errorMessages.speculateTransactionErrorMessage}
            breakdown={breakdown}
            priceVariantName={priceVariantName}
          />
          <section className={css.paymentContainer}>
            {errorMessages.initiateOrderErrorMessage}
            {errorMessages.listingNotFoundErrorMessage}
            {errorMessages.speculateErrorMessage}
            {errorMessages.retrievePaymentIntentErrorMessage}
            {errorMessages.paymentExpiredMessage}
            {klarnaError ? (
              <p className={css.error}>
                <FormattedMessage id="CheckoutPage.klarnaPaymentError" values={{ error: klarnaError }} />
              </p>
            ) : null}

            {klarnaProcessing ? (
              <p className={css.klarnaProcessing}>
                <FormattedMessage id="CheckoutPage.klarnaProcessing" />
              </p>
            ) : showPaymentForm ? (
              <StripePaymentForm
                className={css.paymentForm}
                onSubmit={values =>
                  handleSubmit(values, process, props, stripe, submitting, setSubmitting)
                }
                inProgress={submitting}
                formId="CheckoutPagePaymentForm"
                providerDisplayName={providerDisplayName}
                showInitialMessageInput={showInitialMessageInput}
                initialValues={initialValuesForStripePayment}
                initiateOrderError={initiateOrderError}
                confirmCardPaymentError={confirmCardPaymentError}
                confirmPaymentError={confirmPaymentError}
                hasHandledCardPayment={hasPaymentIntentUserActionsDone}
                loadingData={!stripeCustomerFetched}
                defaultPaymentMethod={
                  hasDefaultPaymentMethod(stripeCustomerFetched, currentUser)
                    ? currentUser.stripeCustomer.defaultPaymentMethod
                    : null
                }
                paymentIntent={paymentIntent}
                onStripeInitialized={stripe => {
                  setStripe(stripe);
                  return onStripeInitialized(stripe, process, props);
                }}
                askShippingDetails={askShippingDetails}
                showPickUpLocation={showPickUpLocation}
                showLocation={showLocation}
                listingLocation={listingLocation}
                totalPrice={totalPrice}
                locale={config.localization.locale}
                stripePublishableKey={config.stripe.publishableKey}
                marketplaceName={config.marketplaceName}
                isBooking={isBookingProcessAlias(transactionProcessAlias)}
                isFuzzyLocation={config.maps.fuzzy.enabled}
                isKlarnaPending={isKlarnaPending}
                isCardPending={isCardPending}
                onCancelKlarnaPayment={handleCancelKlarnaPayment}
                cancelKlarnaInProgress={cancelKlarnaInProgress}
              />
            ) : null}
          </section>
        </main>

        <DetailsSideCard
          listing={listing}
          listingTitle={listingTitle}
          cartItemsCount={cartItemsCount}
          priceVariantName={priceVariantName}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
          speculateTransactionErrorMessage={errorMessages.speculateTransactionErrorMessage}
          isInquiryProcess={false}
          processName={processName}
          breakdown={breakdown}
          showListingImage={showListingImage}
          intl={intl}
          mainListingFrameInfo={cartItemsCount > 0 ? null : mainListingFrameInfo}
        />
      </div>
    </Page>
  );
};

export default CheckoutPageWithPayment;
