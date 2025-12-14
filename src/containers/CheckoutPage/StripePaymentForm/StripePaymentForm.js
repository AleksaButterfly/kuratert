/**
 * Note: This form is using card from Stripe Elements https://stripe.com/docs/stripe-js#elements
 * Card is not a Final Form field so it's not available trough Final Form.
 * It's also handled separately in handleSubmit function.
 */
import React, { Component } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { ensurePaymentMethodCard } from '../../../util/data';

import {
  Heading,
  Form,
  PrimaryButton,
  FieldCheckbox,
  FieldTextInput,
  IconSpinner,
  SavedCardDetails,
  StripePaymentAddress,
} from '../../../components';

import ShippingDetails from '../ShippingDetails/ShippingDetails';

import css from './StripePaymentForm.module.css';

/**
 * Translate a Stripe API error object.
 *
 * To keep up with possible keys from the Stripe API, see:
 *
 * https://stripe.com/docs/api#errors
 *
 * Note that at least at moment, the above link doesn't list all the
 * error codes that the API returns.
 *
 * @param {Object} intl - react-intl object from injectIntl
 * @param {Object} stripeError - error object from Stripe API
 *
 * @return {String} translation message for the specific Stripe error,
 * or the given error message (not translated) if the specific error
 * type/code is not defined in the translations
 *
 */
const stripeErrorTranslation = (intl, stripeError) => {
  const { message, code, type } = stripeError;

  if (!code || !type) {
    // Not a proper Stripe error object
    return intl.formatMessage({ id: 'StripePaymentForm.genericError' });
  }

  const translationId =
    type === 'validation_error'
      ? `StripePaymentForm.stripe.validation_error.${code}`
      : `StripePaymentForm.stripe.${type}`;

  return intl.formatMessage({
    id: translationId,
    defaultMessage: message,
  });
};

const stripeElementsOptions = {
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css?family=Inter',
    },
  ],
};

// card (being a Stripe Elements component), can have own styling passed to it.
// However, its internal width-calculation seems to break if font-size is too big
// compared to component's own width.
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const cardStyles = {
  base: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", Helvetica, Arial, sans-serif',
    fontSize: isMobile ? '14px' : '16px',
    fontSmoothing: 'antialiased',
    lineHeight: '24px',
    letterSpacing: '-0.1px',
    color: '#4A4A4A',
    '::placeholder': {
      color: '#B2B2B2',
    },
  },
};

const OneTimePaymentWithCardElement = props => {
  const {
    cardClasses,
    formId,
    handleStripeElementRef,
    hasCardError,
    error,
    label,
    intl,
    marketplaceName,
  } = props;
  const labelText =
    label || intl.formatMessage({ id: 'StripePaymentForm.saveAfterOnetimePayment' });
  return (
    <React.Fragment>
      <label className={css.paymentLabel} htmlFor={`${formId}-card`}>
        <FormattedMessage id="StripePaymentForm.paymentCardDetails" />
      </label>
      <div className={cardClasses} id={`${formId}-card`} ref={handleStripeElementRef} />
      {hasCardError ? <span className={css.error}>{error}</span> : null}
      <div className={css.saveForLaterUse}>
        <FieldCheckbox
          className={css.saveForLaterUseCheckbox}
          textClassName={css.saveForLaterUseLabel}
          id="saveAfterOnetimePayment"
          name="saveAfterOnetimePayment"
          label={labelText}
          value="saveAfterOnetimePayment"
          useSuccessColor
        />
        <span className={css.saveForLaterUseLegalInfo}>
          <FormattedMessage
            id="StripePaymentForm.saveforLaterUseLegalInfo"
            values={{ marketplaceName }}
          />
        </span>
      </div>
    </React.Fragment>
  );
};

const PaymentMethodSelector = props => {
  const {
    cardClasses,
    formId,
    changePaymentMethod,
    defaultPaymentMethod,
    handleStripeElementRef,
    hasCardError,
    error,
    paymentMethod,
    intl,
    marketplaceName,
  } = props;
  const last4Digits = defaultPaymentMethod.attributes.card.last4Digits;
  const labelText = intl.formatMessage(
    { id: 'StripePaymentForm.replaceAfterOnetimePayment' },
    { last4Digits }
  );

  return (
    <React.Fragment>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="StripePaymentForm.payWithHeading" />
      </Heading>
      <SavedCardDetails
        className={css.paymentMethodSelector}
        card={defaultPaymentMethod.attributes.card}
        onChange={changePaymentMethod}
      />
      {paymentMethod === 'replaceCard' ? (
        <OneTimePaymentWithCardElement
          cardClasses={cardClasses}
          formId={formId}
          handleStripeElementRef={handleStripeElementRef}
          hasCardError={hasCardError}
          error={error}
          label={labelText}
          intl={intl}
          marketplaceName={marketplaceName}
        />
      ) : null}
    </React.Fragment>
  );
};

const getPaymentMethod = (selectedPaymentMethod, hasDefaultPaymentMethod) => {
  return selectedPaymentMethod == null && hasDefaultPaymentMethod
    ? 'defaultCard'
    : selectedPaymentMethod == null
    ? 'onetimeCardPayment'
    : selectedPaymentMethod;
};

// Should we show onetime payment fields and does StripeElements card need attention
const checkOnetimePaymentFields = (
  cardValueValid,
  selectedPaymentMethod,
  hasDefaultPaymentMethod,
  hasHandledCardPayment
) => {
  const useDefaultPaymentMethod =
    selectedPaymentMethod === 'defaultCard' && hasDefaultPaymentMethod;
  // Billing details are known if we have already handled card payment or existing default payment method is used.
  const billingDetailsKnown = hasHandledCardPayment || useDefaultPaymentMethod;

  // If onetime payment is used, check that the StripeElements card has valid value.
  const oneTimePaymentMethods = ['onetimeCardPayment', 'replaceCard'];
  const useOnetimePaymentMethod = oneTimePaymentMethods.includes(selectedPaymentMethod);
  const onetimePaymentNeedsAttention =
    !billingDetailsKnown && !(useOnetimePaymentMethod && cardValueValid);

  return {
    onetimePaymentNeedsAttention,
    showOnetimePaymentFields: useOnetimePaymentMethod,
  };
};

const LocationOrShippingDetails = props => {
  const {
    askShippingDetails,
    showPickUpLocation,
    showLocation,
    listingLocation,
    formApi,
    locale,
    isFuzzyLocation,
    intl,
  } = props;

  const locationDetails = listingLocation?.building
    ? `${listingLocation.building}, ${listingLocation.address}`
    : listingLocation?.address
    ? listingLocation.address
    : intl.formatMessage({ id: 'StripePaymentForm.locationUnknown' });

  return askShippingDetails ? (
    <ShippingDetails intl={intl} formApi={formApi} locale={locale} />
  ) : showPickUpLocation ? (
    <div className={css.locationWrapper}>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="StripePaymentForm.pickupDetailsTitle" />
      </Heading>
      <p className={css.locationDetails}>{locationDetails}</p>
    </div>
  ) : showLocation && !isFuzzyLocation ? (
    <div className={css.locationWrapper}>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="StripePaymentForm.locationDetailsTitle" />
      </Heading>
      <p className={css.locationDetails}>{locationDetails}</p>
    </div>
  ) : null;
};

const initialState = {
  error: null,
  cardValueValid: false,
  // The mode can be 'onetimePayment', 'defaultCard', or 'replaceCard'
  // Check SavedCardDetails component for more information
  paymentMethod: null,
  // Wallet payment states (Google Pay, Apple Pay, Link, etc.)
  paymentRequest: null,
  canMakePayment: null, // { applePay: true } or { googlePay: true } or null
  walletPaymentInProgress: false,
  walletError: null,
  // Klarna payment state
  klarnaPaymentInProgress: false,
};

/**
 * Express Checkout component for wallet payments (Google Pay, Apple Pay, Link, etc.)
 */
// Wallet payment icons
const ApplePayIcon = () => (
  <svg viewBox="0 0 165.52 105.97" width="50" height="20" aria-hidden="true">
    <path fill="#ffffff" d="M150.7 0H14.82A14.83 14.83 0 0 0 0 14.82v76.33a14.83 14.83 0 0 0 14.82 14.82H150.7a14.83 14.83 0 0 0 14.82-14.82V14.82A14.83 14.83 0 0 0 150.7 0z"/>
    <path d="M150.7 3.53a11.32 11.32 0 0 1 11.29 11.29v76.33a11.32 11.32 0 0 1-11.29 11.29H14.82a11.32 11.32 0 0 1-11.29-11.29V14.82A11.32 11.32 0 0 1 14.82 3.53H150.7m0-3.53H14.82A14.83 14.83 0 0 0 0 14.82v76.33a14.83 14.83 0 0 0 14.82 14.82H150.7a14.83 14.83 0 0 0 14.82-14.82V14.82A14.83 14.83 0 0 0 150.7 0z"/>
    <path d="M43.07 35.33a9.28 9.28 0 0 0 2.13-6.64 9.43 9.43 0 0 0-6.17 3.19 8.82 8.82 0 0 0-2.19 6.39 7.8 7.8 0 0 0 6.23-2.94zM45.14 38.81c-3.44-.2-6.37 1.95-8 1.95s-4.17-1.85-6.88-1.8a10.17 10.17 0 0 0-8.65 5.22c-3.69 6.39-1 15.87 2.64 21.08 1.75 2.56 3.84 5.42 6.6 5.32 2.64-.1 3.64-1.7 6.83-1.7s4.09 1.7 6.88 1.65c2.86-.05 4.64-2.61 6.39-5.17a22.09 22.09 0 0 0 2.89-5.92 9.27 9.27 0 0 1-5.57-8.48 9.44 9.44 0 0 1 4.49-7.92 9.68 9.68 0 0 0-7.62-4.23zM71.2 32.17c7.17 0 12.17 4.94 12.17 12.13s-5.1 12.18-12.37 12.18h-7.94v12.63h-5.72V32.17zm-8.14 19.49h6.59c5 0 7.84-2.69 7.84-7.36s-2.84-7.34-7.82-7.34h-6.61zM84.83 60.43c0-5 3.82-8.06 10.6-8.45l7.82-.46v-2.21c0-3.18-2.14-5.08-5.72-5.08-3.38 0-5.52 1.66-6 4.2h-5.22c.31-5.08 4.67-8.82 11.42-8.82 6.7 0 11 3.54 11 9.11v19.08h-5.3v-4.57h-.12a9.4 9.4 0 0 1-8.42 4.94c-5.22 0-8.99-3.22-8.99-7.74zm18.42-2.31v-2.26l-7 .44c-3.5.22-5.48 1.8-5.48 4.33s2.08 4.18 5.26 4.18c4.13 0 7.22-2.84 7.22-6.69zM114.15 79.77v-4.45c.41.1 1.34.1 1.8.1 2.57 0 3.96-1.08 4.81-3.86 0-.07.49-1.66.49-1.68l-10.33-28.57h5.96l7.36 23.56h.1l7.36-23.56h5.82l-10.7 30.15c-2.45 6.91-5.26 9.13-11.18 9.13-.46 0-1.39-.05-1.49-.82z"/>
  </svg>
);

const GooglePayIcon = () => (
  <svg viewBox="0 0 435.97 173.13" width="60" height="24" aria-hidden="true">
    <path fill="#5F6368" d="M206.2 84.58v50.75h-16.1V10h42.7a38.61 38.61 0 0 1 27.65 10.85A34.88 34.88 0 0 1 272 47.3a34.72 34.72 0 0 1-11.55 26.6q-11.2 10.68-27.65 10.67H206.2zm0-59.15v43.72h27a21.28 21.28 0 0 0 15.93-6.48 21.36 21.36 0 0 0 0-30.63 21 21 0 0 0-15.93-6.62H206.2zM309.1 46.78q17.85 0 28.18 9.54t10.32 26.16v52.85h-15.4v-11.9h-.7q-10 14.63-26.6 14.63-14.18 0-23.71-8.33a26.56 26.56 0 0 1-9.54-21 25.56 25.56 0 0 1 10.15-21.15q10.15-8 27-8 14.35 0 23.63 5.25v-3.68a17.64 17.64 0 0 0-6.65-14 22.92 22.92 0 0 0-15.23-5.68q-13.13 0-20.83 11l-14.17-8.93q11.55-16.28 33.55-16.28zm-20.83 62.3a12.86 12.86 0 0 0 5.34 10.5 19.64 19.64 0 0 0 12.51 4.2 25.67 25.67 0 0 0 18.11-7.52q8-7.53 8-17.33-7.52-6-21-6-9.81 0-16.36 4.73a14.71 14.71 0 0 0-6.6 11.42zM436 49.53l-53.55 123.17h-16.63l19.88-43.05-35.18-80.12h17.5l25.38 61.6h.35l24.68-61.6z"/>
    <path fill="#4285F4" d="M141.14 73.64A85.79 85.79 0 0 0 139.9 59H72v27.73h38.89a33.33 33.33 0 0 1-14.38 21.88v18h23.21c13.59-12.53 21.42-31.06 21.42-52.97z"/>
    <path fill="#34A853" d="M72 144c19.43 0 35.79-6.38 47.72-17.38l-23.21-18c-6.46 4.38-14.78 6.88-24.51 6.88-18.78 0-34.72-12.66-40.42-29.72H7.67v18.55A72 72 0 0 0 72 144z"/>
    <path fill="#FBBC04" d="M31.58 85.78a43.14 43.14 0 0 1 0-27.56V39.67H7.67a72 72 0 0 0 0 64.66z"/>
    <path fill="#EA4335" d="M72 28.5a39.09 39.09 0 0 1 27.62 10.8l20.55-20.55A69.18 69.18 0 0 0 72 0 72 72 0 0 0 7.67 39.67l23.91 18.55C37.28 41.16 53.22 28.5 72 28.5z"/>
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 10" width="48" height="20" aria-hidden="true">
    <path fill="#ffffff" d="M3.5 5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM6 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm6.75 0a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5a.75.75 0 0 0-.75-.75Zm3.75.75a.75.75 0 0 1 1.5 0v2.5h2.25a.75.75 0 0 1 0 1.5H18v2.5a.75.75 0 0 1-1.5 0v-6.5ZM1 5a5 5 0 0 1 10 0 5 5 0 0 1-10 0Z"/>
  </svg>
);

// Klarna logo
const KlarnaIcon = () => (
  <svg viewBox="0 0 1448 609" width="60" height="25" aria-hidden="true">
    <path d="M0 304.493C0 180.585 0 118.631 30.3995 74.5079C42.2947 57.2427 57.2427 42.2947 74.5079 30.3995C118.631 0 180.585 0 304.493 0H1142.75C1266.65 0 1328.61 0 1372.73 30.3995C1390 42.2947 1404.95 57.2427 1416.84 74.5079C1447.24 118.631 1447.24 180.585 1447.24 304.493C1447.24 428.402 1447.24 490.356 1416.84 534.479C1404.95 551.744 1390 566.692 1372.73 578.587C1328.61 608.987 1266.65 608.987 1142.75 608.987H304.494C180.585 608.987 118.631 608.987 74.5079 578.587C57.2427 566.692 42.2947 551.744 30.3995 534.479C0 490.356 0 428.402 0 304.493Z" fill="#FFA8CD"/>
    <path d="M1166.17 389.005C1140.92 389.005 1121.24 368.125 1121.24 342.771C1121.24 317.416 1140.92 296.536 1166.17 296.536C1191.42 296.536 1211.1 317.416 1211.1 342.771C1211.1 368.125 1191.42 389.005 1166.17 389.005ZM1153.54 437.85C1175.08 437.85 1202.56 429.647 1217.79 397.581L1219.27 398.327C1212.59 415.851 1212.59 426.292 1212.59 428.902V433.003H1266.8V252.538H1212.59V256.64C1212.59 259.25 1212.59 269.69 1219.27 287.214L1217.79 287.96C1202.56 255.894 1175.08 247.691 1153.54 247.691C1101.93 247.691 1065.54 288.706 1065.54 342.771C1065.54 396.835 1101.93 437.85 1153.54 437.85ZM971.216 247.691C946.707 247.691 927.397 256.267 911.801 287.96L910.316 287.214C917 269.69 917 259.25 917 256.64V252.538H862.784V433.003H918.485V337.923C918.485 312.942 932.968 297.281 956.362 297.281C979.757 297.281 991.268 310.704 991.268 337.55V433.003H1046.97V318.162C1046.97 277.147 1015.03 247.691 971.216 247.691ZM782.203 287.96L780.717 287.214C787.401 269.69 787.401 259.25 787.401 256.64V252.538H733.186V433.003H788.887L789.258 346.126C789.258 320.772 802.626 305.484 824.536 305.484C830.477 305.484 835.305 306.23 840.875 307.722V252.538C816.366 247.318 794.457 256.64 782.203 287.96ZM605.073 389.005C579.821 389.005 560.14 368.125 560.14 342.771C560.14 317.416 579.821 296.536 605.073 296.536C630.324 296.536 650.005 317.416 650.005 342.771C650.005 368.125 630.324 389.005 605.073 389.005ZM592.447 437.85C613.985 437.85 641.464 429.647 656.689 397.581L658.174 398.327C651.49 415.851 651.49 426.292 651.49 428.902V433.003H705.706V252.538H651.49V256.64C651.49 259.25 651.49 269.69 658.174 287.214L656.689 287.96C641.464 255.894 613.985 247.691 592.447 247.691C540.83 247.691 504.439 288.706 504.439 342.771C504.439 396.835 540.83 437.85 592.447 437.85ZM426.828 433.003H482.53V172H426.828V433.003ZM385.981 172H329.165C329.165 218.608 300.572 260.368 257.125 290.197L240.043 302.129V172H181V433.003H240.043V303.62L337.706 433.003H409.747L315.797 309.213C358.501 278.266 386.352 230.166 385.981 172Z" fill="#0B051D"/>
  </svg>
);

/**
 * Klarna Payment Button component
 */
const KlarnaPaymentButton = props => {
  const { onClick, inProgress, intl } = props;

  return (
    <button
      type="button"
      className={css.klarnaButton}
      onClick={onClick}
      disabled={inProgress}
    >
      {inProgress ? (
        <IconSpinner className={css.klarnaSpinner} />
      ) : (
        <span className={css.klarnaButtonContent}>
          <KlarnaIcon />
        </span>
      )}
    </button>
  );
};

const ExpressCheckout = props => {
  const {
    paymentRequest,
    canMakePayment,
    walletPaymentInProgress,
    walletError,
    onKlarnaClick,
    klarnaInProgress,
    showKlarnaButton,
    intl,
  } = props;

  const showApplePay = canMakePayment?.applePay;
  const showGooglePay = canMakePayment?.googlePay;
  const showLink = canMakePayment?.link;
  const hasWallets = showApplePay || showGooglePay || showLink;

  const handleWalletClick = () => {
    if (paymentRequest) {
      paymentRequest.show();
    }
  };

  // Determine button style based on available wallet
  const getButtonClass = () => {
    if (showApplePay) return css.applePayButton;
    if (showGooglePay) return css.googlePayButton;
    if (showLink) return css.linkPayButton;
    return css.googlePayButton; // Default fallback
  };

  // Get appropriate icon for the wallet type
  const getWalletIcon = () => {
    if (showApplePay) return <ApplePayIcon />;
    if (showGooglePay) return <GooglePayIcon />;
    if (showLink) return <LinkIcon />;
    return null;
  };

  return (
    <div className={css.expressCheckout}>
      <Heading as="h3" rootClassName={css.expressCheckoutHeading}>
        <FormattedMessage id="StripePaymentForm.expressCheckout" />
      </Heading>

      {/* Klarna button - shown first (priority for Norway) */}
      {showKlarnaButton !== false && (
        <KlarnaPaymentButton
          onClick={onKlarnaClick}
          inProgress={klarnaInProgress}
          intl={intl}
        />
      )}

      {/* Wallet buttons (Apple Pay, Google Pay, etc.) */}
      {hasWallets ? (
        <button
          type="button"
          className={classNames(css.walletButton, getButtonClass())}
          onClick={handleWalletClick}
          disabled={walletPaymentInProgress}
        >
          {walletPaymentInProgress ? (
            <IconSpinner className={css.walletSpinner} />
          ) : (
            <span className={css.walletButtonContent}>{getWalletIcon()}</span>
          )}
        </button>
      ) : null}

      {walletError ? <span className={css.walletError}>{walletError}</span> : null}

      <div className={css.orDivider}>
        <span className={css.orDividerLine}></span>
        <span className={css.orDividerText}>
          <FormattedMessage id="StripePaymentForm.orPayWithCard" />
        </span>
        <span className={css.orDividerLine}></span>
      </div>
    </div>
  );
};

/**
 * Payment form that asks for credit card info using Stripe Elements.
 *
 * When the card is valid and the user submits the form, a request is
 * sent to the Stripe API to handle payment. `stripe.confirmCardPayment`
 * may ask more details from cardholder if 3D security steps are needed.
 *
 * See: https://stripe.com/docs/payments/payment-intents
 *      https://stripe.com/docs/elements
 *
 * @component
 * @param {Object} props
 * @param {string} props.className - The class name for the payment form
 * @param {string} props.rootClassName - The root class that overrides the default class for the payment form
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {boolean} props.loadingData - Whether the data is loading
 * @param {propTypes.error} props.initiateOrderError - The error that occurs when initiating the order
 * @param {propTypes.error} props.confirmCardPaymentError - The error that occurs when confirming the card payment
 * @param {propTypes.error} props.confirmPaymentError - The error that occurs when confirming the payment
 * @param {string} props.formId - The form ID
 * @param {Function} props.onSubmit - The function to call when the form is submitted
 * @param {string} props.authorDisplayName - The author display name
 * @param {boolean} props.showInitialMessageInput - Whether to show the initial message input
 * @param {string} props.stripePublishableKey - The Stripe publishable key
 * @param {Function} props.onStripeInitialized - The function to call when Stripe is initialized
 * @param {boolean} props.hasHandledCardPayment - Whether the card payment has been handled
 * @param {Object} props.defaultPaymentMethod - The default payment method
 * @param {boolean} props.askShippingDetails - Whether to ask for shipping details
 * @param {boolean} props.showPickUpLocation - Whether to show the pickup location
 * @param {boolean} props.showLocation - Whether to show the location address
 * @param {string} props.totalPrice - The total price
 * @param {string} props.locale - The locale
 * @param {Object} props.listingLocation - The listing location
 * @param {Object} props.listingLocation.building - The building
 * @param {Object} props.listingLocation.address - The address
 * @param {boolean} props.isBooking - Whether the booking is in progress
 * @param {boolean} props.isFuzzyLocation - Whether the location is fuzzy
 * @param {Object} props.intl - The intl object
 */
class StripePaymentForm extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
    this.updateBillingDetailsToMatchShippingAddress = this.updateBillingDetailsToMatchShippingAddress.bind(
      this
    );
    this.handleCardValueChange = this.handleCardValueChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.paymentForm = this.paymentForm.bind(this);
    this.initializeStripeElement = this.initializeStripeElement.bind(this);
    this.handleStripeElementRef = this.handleStripeElementRef.bind(this);
    this.changePaymentMethod = this.changePaymentMethod.bind(this);
    // Wallet payment methods
    this.initializePaymentRequest = this.initializePaymentRequest.bind(this);
    this.handleWalletPayment = this.handleWalletPayment.bind(this);
    this.getPaymentAmount = this.getPaymentAmount.bind(this);
    // Klarna payment method
    this.handleKlarnaClick = this.handleKlarnaClick.bind(this);
    this.finalFormAPI = null;
    this.cardContainer = null;
  }

  componentDidMount() {
    if (!window.Stripe) {
      throw new Error('Stripe must be loaded for StripePaymentForm');
    }

    const publishableKey = this.props.stripePublishableKey;
    if (publishableKey) {
      const {
        onStripeInitialized,
        hasHandledCardPayment,
        defaultPaymentMethod,
        loadingData,
      } = this.props;
      this.stripe = window.Stripe(publishableKey);
      onStripeInitialized(this.stripe);

      if (!(hasHandledCardPayment || defaultPaymentMethod || loadingData)) {
        this.initializeStripeElement();
      }

      // Initialize Payment Request for wallet payments (Google Pay, Apple Pay, Link, etc.)
      this.initializePaymentRequest();
    }
  }

  componentWillUnmount() {
    if (this.card) {
      this.card.removeEventListener('change', this.handleCardValueChange);
      this.card.unmount();
      this.card = null;
    }
  }

  componentDidUpdate(prevProps) {
    // Update payment request when total price changes
    if (prevProps.totalPrice !== this.props.totalPrice && this.state.paymentRequest) {
      const amount = this.getPaymentAmount();
      if (amount > 0) {
        this.state.paymentRequest.update({
          total: {
            label: this.props.marketplaceName || 'Total',
            amount: amount,
          },
        });
      }
    }
  }

  /**
   * Parse total price string to subunits (cents)
   * @returns {number} Amount in subunits
   */
  getPaymentAmount() {
    const { totalPrice } = this.props;
    if (!totalPrice) return 0;
    // totalPrice comes as formatted string like "$50.00" or "50,00 USD"
    const numericValue = parseFloat(totalPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));
    return Math.round(numericValue * 100);
  }

  /**
   * Initialize Stripe Payment Request for wallet payments
   */
  initializePaymentRequest() {
    const { totalPrice, marketplaceName } = this.props;
    const amount = this.getPaymentAmount();

    // Don't initialize if amount is 0 (price not loaded yet)
    if (amount <= 0) {
      return;
    }

    const paymentRequest = this.stripe.paymentRequest({
      country: 'US', // Required for Payment Request API
      currency: 'usd', // TODO: Get from config if needed
      total: {
        label: marketplaceName || 'Total',
        amount: amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if wallet payments are available
    paymentRequest.canMakePayment().then(result => {
      if (result) {
        this.setState({
          paymentRequest,
          canMakePayment: result,
        });

        // Listen for wallet payment success
        paymentRequest.on('paymentmethod', this.handleWalletPayment);
      }
    });
  }

  /**
   * Handle successful wallet payment
   * @param {Object} event - Stripe payment method event
   */
  handleWalletPayment(event) {
    const { onSubmit, formId, intl } = this.props;
    const paymentMethodId = event.paymentMethod.id;

    this.setState({ walletPaymentInProgress: true, walletError: null });

    // Get current form values for shipping, message, etc.
    const formValues = this.finalFormAPI ? this.finalFormAPI.getState().values : {};

    // Build params matching existing handleSubmit signature
    const params = {
      message: formValues.initialMessage ? formValues.initialMessage.trim() : null,
      card: null, // No card element for wallet payments
      formId,
      formValues,
      paymentMethod: 'walletPayment', // New payment method type
      walletPaymentMethodId: paymentMethodId, // The actual Stripe payment method ID
    };

    // Complete the payment request UI (tell wallet it succeeded)
    event.complete('success');

    // Call the existing onSubmit handler
    onSubmit(params);
  }

  /**
   * Handle Klarna button click
   * Collects form data and submits with Klarna payment method
   */
  handleKlarnaClick() {
    const { onSubmit, formId } = this.props;

    this.setState({ klarnaPaymentInProgress: true });

    // Get current form values for shipping, billing, message, etc.
    const formValues = this.finalFormAPI ? this.finalFormAPI.getState().values : {};

    // Build params with Klarna payment method flag
    const params = {
      message: formValues.initialMessage ? formValues.initialMessage.trim() : null,
      card: null, // No card element for Klarna payments
      formId,
      formValues,
      paymentMethod: 'klarna', // Klarna payment method type
    };

    // Call the onSubmit handler
    onSubmit(params);
  }

  initializeStripeElement(element) {
    const elements = this.stripe.elements(stripeElementsOptions);

    if (!this.card) {
      this.card = elements.create('card', { style: cardStyles });
      this.card.mount(element || this.cardContainer);
      this.card.addEventListener('change', this.handleCardValueChange);
      // EventListener is the only way to simulate breakpoints with Stripe.
      window.addEventListener('resize', () => {
        if (this.card) {
          if (window.innerWidth < 768) {
            this.card.update({ style: { base: { fontSize: '14px', lineHeight: '24px' } } });
          } else {
            this.card.update({ style: { base: { fontSize: '18px', lineHeight: '24px' } } });
          }
        }
      });
    }
  }

  updateBillingDetailsToMatchShippingAddress(shouldFill) {
    const formApi = this.finalFormAPI;
    const values = formApi.getState()?.values || {};
    formApi.batch(() => {
      formApi.change('name', shouldFill ? values.recipientName : '');
      formApi.change('addressLine1', shouldFill ? values.recipientAddressLine1 : '');
      formApi.change('postal', shouldFill ? values.recipientPostal : '');
      formApi.change('city', shouldFill ? values.recipientCity : '');
      formApi.change('country', shouldFill ? values.recipientCountry : '');
    });
  }

  changePaymentMethod(changedTo) {
    if (this.card && changedTo === 'defaultCard') {
      this.card.removeEventListener('change', this.handleCardValueChange);
      this.card.unmount();
      this.card = null;
      this.setState({ cardValueValid: false });
    }
    this.setState({ paymentMethod: changedTo });
    if (changedTo === 'defaultCard' && this.finalFormAPI) {
      this.finalFormAPI.change('sameAddressCheckbox', undefined);
    } else if (changedTo === 'replaceCard' && this.finalFormAPI) {
      this.finalFormAPI.change('sameAddressCheckbox', ['sameAddress']);
      this.updateBillingDetailsToMatchShippingAddress(true);
    }
  }

  handleStripeElementRef(el) {
    this.cardContainer = el;
    if (this.stripe && el) {
      this.initializeStripeElement(el);
    }
  }

  handleCardValueChange(event) {
    const { intl } = this.props;
    const { error, complete } = event;

    const postalCode = event.value.postalCode;
    if (this.finalFormAPI) {
      this.finalFormAPI.change('postal', postalCode);
    }

    this.setState(prevState => {
      return {
        error: error ? stripeErrorTranslation(intl, error) : null,
        cardValueValid: complete,
      };
    });
  }
  handleSubmit(values) {
    const {
      onSubmit,
      inProgress,
      formId,
      hasHandledCardPayment,
      defaultPaymentMethod,
    } = this.props;
    const { initialMessage } = values;
    const { cardValueValid, paymentMethod } = this.state;
    const hasDefaultPaymentMethod = defaultPaymentMethod?.id;
    const selectedPaymentMethod = getPaymentMethod(paymentMethod, hasDefaultPaymentMethod);
    const { onetimePaymentNeedsAttention } = checkOnetimePaymentFields(
      cardValueValid,
      selectedPaymentMethod,
      hasDefaultPaymentMethod,
      hasHandledCardPayment
    );

    if (inProgress || onetimePaymentNeedsAttention) {
      // Already submitting or card value incomplete/invalid
      return;
    }

    const params = {
      message: initialMessage ? initialMessage.trim() : null,
      card: this.card,
      formId,
      formValues: values,
      paymentMethod: getPaymentMethod(
        paymentMethod,
        ensurePaymentMethodCard(defaultPaymentMethod).id
      ),
    };
    onSubmit(params);
  }

  paymentForm(formRenderProps) {
    const {
      className,
      rootClassName,
      inProgress: submitInProgress,
      loadingData,
      formId,
      providerDisplayName,
      showInitialMessageInput,
      intl,
      initiateOrderError,
      confirmCardPaymentError,
      confirmPaymentError,
      invalid,
      handleSubmit,
      form: formApi,
      hasHandledCardPayment,
      defaultPaymentMethod,
      listingLocation,
      askShippingDetails,
      showLocation,
      showPickUpLocation,
      totalPrice,
      locale,
      stripePublishableKey,
      marketplaceName,
      isBooking,
      isFuzzyLocation,
      isKlarnaPending,
      isCardPending,
      klarnaReturnFailed,
      onCancelKlarnaPayment,
      cancelKlarnaInProgress,
      values,
    } = formRenderProps;

    this.finalFormAPI = formApi;

    const ensuredDefaultPaymentMethod = ensurePaymentMethodCard(defaultPaymentMethod);
    const billingDetailsNeeded = !(hasHandledCardPayment || confirmPaymentError);

    // Determine what payment methods to show based on pending state
    const showKlarnaButton = !isCardPending && !isKlarnaPending;
    const showCardInputs = !isKlarnaPending;
    // Only show cancel UI when user returned from Klarna with a failed payment
    const showCancelKlarnaUI = isKlarnaPending && klarnaReturnFailed;

    const { cardValueValid, paymentMethod } = this.state;
    const hasDefaultPaymentMethod = ensuredDefaultPaymentMethod.id;
    const selectedPaymentMethod = getPaymentMethod(paymentMethod, hasDefaultPaymentMethod);
    const { onetimePaymentNeedsAttention, showOnetimePaymentFields } = checkOnetimePaymentFields(
      cardValueValid,
      selectedPaymentMethod,
      hasDefaultPaymentMethod,
      hasHandledCardPayment
    );

    const submitDisabled = invalid || onetimePaymentNeedsAttention || submitInProgress;
    const hasCardError = this.state.error && !submitInProgress;
    const hasPaymentErrors = confirmCardPaymentError || confirmPaymentError;
    const classes = classNames(rootClassName || css.root, className);
    const cardClasses = classNames(css.card, {
      [css.cardSuccess]: this.state.cardValueValid,
      [css.cardError]: hasCardError,
    });

    // Note: totalPrice might not be available initially
    // when speculateTransaction call is in progress.
    const totalPriceMaybe = totalPrice || '';

    // TODO: confirmCardPayment can create all kinds of errors.
    // Currently, we provide translation support for one:
    // https://stripe.com/docs/error-codes
    const piAuthenticationFailure = 'payment_intent_authentication_failure';
    const paymentErrorMessage =
      confirmCardPaymentError && confirmCardPaymentError.code === piAuthenticationFailure
        ? intl.formatMessage({ id: 'StripePaymentForm.confirmCardPaymentError' })
        : confirmCardPaymentError
        ? confirmCardPaymentError.message
        : confirmPaymentError
        ? intl.formatMessage({ id: 'StripePaymentForm.confirmPaymentError' })
        : intl.formatMessage({ id: 'StripePaymentForm.genericError' });

    const billingDetailsNameLabel = intl.formatMessage({
      id: 'StripePaymentForm.billingDetailsNameLabel',
    });

    const billingDetailsNamePlaceholder = intl.formatMessage({
      id: 'StripePaymentForm.billingDetailsNamePlaceholder',
    });

    const messagePlaceholder = intl.formatMessage(
      { id: 'StripePaymentForm.messagePlaceholder' },
      { name: providerDisplayName }
    );

    const messageOptionalText = intl.formatMessage({
      id: 'StripePaymentForm.messageOptionalText',
    });

    const initialMessageLabel = intl.formatMessage(
      { id: 'StripePaymentForm.messageLabel' },
      { messageOptionalText: messageOptionalText }
    );

    // Asking billing address is recommended in PaymentIntent flow.
    // In CheckoutPage, we send name and email as billing details, but address only if it exists.
    const billingAddress = (
      <StripePaymentAddress
        intl={intl}
        form={formApi}
        fieldId={formId}
        card={this.card}
        locale={locale}
      />
    );

    const hasStripeKey = stripePublishableKey;

    const handleSameAddressCheckbox = event => {
      const checked = event.target.checked;
      this.updateBillingDetailsToMatchShippingAddress(checked);
    };
    const isBookingYesNo = isBooking ? 'yes' : 'no';

    return hasStripeKey ? (
      <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="OrderDetailsPage">
        <LocationOrShippingDetails
          askShippingDetails={askShippingDetails}
          showPickUpLocation={showPickUpLocation}
          showLocation={showLocation}
          listingLocation={listingLocation}
          isFuzzyLocation={isFuzzyLocation}
          formApi={formApi}
          locale={locale}
          intl={intl}
        />

        {/* Cancel Klarna payment UI - shown when stuck in Klarna pending state */}
        {showCancelKlarnaUI && (
          <div className={css.cancelKlarnaSection}>
            <p className={css.cancelKlarnaMessage}>
              <FormattedMessage id="StripePaymentForm.klarnaPaymentPending" />
            </p>
            <PrimaryButton
              type="button"
              onClick={onCancelKlarnaPayment}
              inProgress={cancelKlarnaInProgress}
              className={css.cancelKlarnaButton}
            >
              <FormattedMessage id="StripePaymentForm.cancelKlarnaAndTryDifferent" />
            </PrimaryButton>
          </div>
        )}

        {/* Express Checkout - Klarna + Wallet Payments (Google Pay, Apple Pay, Link) */}
        {billingDetailsNeeded && !loadingData && !showCancelKlarnaUI ? (
          <ExpressCheckout
            paymentRequest={this.state.paymentRequest}
            canMakePayment={this.state.canMakePayment}
            walletPaymentInProgress={this.state.walletPaymentInProgress}
            walletError={this.state.walletError}
            onKlarnaClick={this.handleKlarnaClick}
            klarnaInProgress={this.state.klarnaPaymentInProgress}
            showKlarnaButton={showKlarnaButton}
            intl={intl}
          />
        ) : null}

        {billingDetailsNeeded && !loadingData && showCardInputs ? (
          <React.Fragment>
            {hasDefaultPaymentMethod ? (
              <PaymentMethodSelector
                cardClasses={cardClasses}
                formId={formId}
                defaultPaymentMethod={ensuredDefaultPaymentMethod}
                changePaymentMethod={this.changePaymentMethod}
                handleStripeElementRef={this.handleStripeElementRef}
                hasCardError={hasCardError}
                error={this.state.error}
                paymentMethod={selectedPaymentMethod}
                intl={intl}
                marketplaceName={marketplaceName}
              />
            ) : (
              <React.Fragment>
                <Heading as="h3" rootClassName={classNames(css.heading, {
                  [css.headingAfterWallet]: billingDetailsNeeded && !loadingData && !showCancelKlarnaUI && (showKlarnaButton || this.state.canMakePayment)
                })}>
                  <FormattedMessage id="StripePaymentForm.paymentHeading" />
                </Heading>
                <OneTimePaymentWithCardElement
                  cardClasses={cardClasses}
                  formId={formId}
                  handleStripeElementRef={this.handleStripeElementRef}
                  hasCardError={hasCardError}
                  error={this.state.error}
                  intl={intl}
                  marketplaceName={marketplaceName}
                />
              </React.Fragment>
            )}

            {showOnetimePaymentFields ? (
              <div className={css.billingDetails}>
                <Heading as="h3" rootClassName={css.heading}>
                  <FormattedMessage id="StripePaymentForm.billingDetails" />
                </Heading>

                {askShippingDetails ? (
                  <FieldCheckbox
                    className={css.sameAddressCheckbox}
                    textClassName={css.sameAddressLabel}
                    id="sameAddressCheckbox"
                    name="sameAddressCheckbox"
                    label={intl.formatMessage({
                      id: 'StripePaymentForm.sameBillingAndShippingAddress',
                    })}
                    value="sameAddress"
                    useSuccessColor
                    onChange={handleSameAddressCheckbox}
                  />
                ) : null}

                <FieldTextInput
                  className={css.field}
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="cc-name"
                  label={billingDetailsNameLabel}
                  placeholder={billingDetailsNamePlaceholder}
                />

                {billingAddress}
              </div>
            ) : null}
          </React.Fragment>
        ) : loadingData ? (
          <p className={css.spinner}>
            <IconSpinner />
          </p>
        ) : null}

        {initiateOrderError ? (
          <span className={css.errorMessage}>{initiateOrderError.message}</span>
        ) : null}
        {showInitialMessageInput ? (
          <div>
            <Heading as="h3" rootClassName={css.heading}>
              <FormattedMessage id="StripePaymentForm.messageHeading" />
            </Heading>

            <FieldTextInput
              type="textarea"
              id={`${formId}-message`}
              name="initialMessage"
              label={initialMessageLabel}
              placeholder={messagePlaceholder}
              className={css.message}
            />
          </div>
        ) : null}
        <div className={css.submitContainer}>
          {hasPaymentErrors ? (
            <span className={css.errorMessage}>{paymentErrorMessage}</span>
          ) : null}
          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
          >
            {billingDetailsNeeded ? (
              <FormattedMessage
                id="StripePaymentForm.submitPaymentInfo"
                values={{ totalPrice: totalPriceMaybe, isBooking: isBookingYesNo }}
              />
            ) : (
              <FormattedMessage
                id="StripePaymentForm.submitConfirmPaymentInfo"
                values={{ totalPrice: totalPriceMaybe, isBooking: isBookingYesNo }}
              />
            )}
          </PrimaryButton>
          <p className={css.paymentInfo}>
            <FormattedMessage
              id="StripePaymentForm.submitConfirmPaymentFinePrint"
              values={{ isBooking: isBookingYesNo, name: providerDisplayName }}
            />
          </p>
        </div>
      </Form>
    ) : (
      <div className={css.missingStripeKey}>
        <FormattedMessage id="StripePaymentForm.missingStripeKey" />
      </div>
    );
  }

  render() {
    const { onSubmit, ...rest } = this.props;
    return <FinalForm onSubmit={this.handleSubmit} {...rest} render={this.paymentForm} />;
  }
}

export default injectIntl(StripePaymentForm);
