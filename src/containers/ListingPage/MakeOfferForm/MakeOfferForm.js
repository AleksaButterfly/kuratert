import React from 'react';
import classNames from 'classnames';
import { Form as FinalForm, Field } from 'react-final-form';

import appSettings from '../../../config/settings';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { formatMoney } from '../../../util/currency';
import { required, moneySubUnitAmountAtLeast, composeValidators } from '../../../util/validators';
import { types as sdkTypes } from '../../../util/sdkLoader';

import {
  FieldCurrencyInput,
  FieldTextInput,
  Form,
  Heading,
  PrimaryButton,
  IconInquiry,
} from '../../../components';

import css from './MakeOfferForm.module.css';

const { Money } = sdkTypes;

/**
 * The MakeOfferForm component.
 * Customer makes an offer on a listing.
 *
 * @component
 */
const MakeOfferForm = props => {
  const intl = useIntl();

  // Extract custom props that shouldn't be passed to FinalForm
  const {
    submitError,
    listingTitle,
    listingPrice,
    authorDisplayName,
    marketplaceCurrency,
    inProgress,
    shippingEnabled,
    pickupEnabled,
    shippingPriceInSubunits,
    ...restProps
  } = props;

  // Format shipping price if available
  const shippingPrice = shippingPriceInSubunits
    ? new Money(shippingPriceInSubunits, marketplaceCurrency)
    : null;
  const shippingPriceFormatted = shippingPrice ? formatMoney(intl, shippingPrice) : null;

  // Determine delivery method availability
  const hasShipping = !!shippingEnabled;
  const hasPickup = !!pickupEnabled;
  const hasMultipleDeliveryMethods = hasShipping && hasPickup;
  const hasSingleDeliveryMethod = (hasShipping || hasPickup) && !hasMultipleDeliveryMethods;
  const singleDeliveryMethod = hasSingleDeliveryMethod ? (hasShipping ? 'shipping' : 'pickup') : null;

  // Set initial values with single delivery method if only one is available
  const initialValues = {
    ...(singleDeliveryMethod ? { deliveryMethod: singleDeliveryMethod } : {}),
  };

  return (
    <FinalForm
      {...restProps}
      initialValues={initialValues}
      render={fieldRenderProps => {
        const {
          className,
          rootClassName,
          handleSubmit,
          values,
        } = fieldRenderProps;

        const currencyConfig = appSettings.getCurrencyFormatting(marketplaceCurrency);

        // Minimum offer is 1 unit of currency
        const minPrice = new Money(100, marketplaceCurrency); // 1.00 in subunits
        const minPriceFormatted = formatMoney(intl, minPrice);

        const offerRequiredMsg = intl.formatMessage({ id: 'MakeOfferForm.offerRequired' });
        const offerMinMsg = intl.formatMessage(
          { id: 'MakeOfferForm.offerMin' },
          { minPrice: minPriceFormatted }
        );

        const offerValidators = composeValidators(
          required(offerRequiredMsg),
          moneySubUnitAmountAtLeast(offerMinMsg, 100) // At least 1.00
        );

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress || false;

        // Require delivery method selection if multiple methods available
        const needsDeliveryMethod = hasMultipleDeliveryMethods && !values.deliveryMethod;
        const submitDisabled = submitInProgress || needsDeliveryMethod;

        const errorMessageMaybe = submitError ? (
          <p className={css.errorPlaceholder}>
            <FormattedMessage id="MakeOfferForm.submitFailed" />
          </p>
        ) : null;

        const listingPriceFormatted = listingPrice ? formatMoney(intl, listingPrice) : null;

        return (
          <Form className={classes} onSubmit={handleSubmit}>
            <IconInquiry className={css.icon} />
            <Heading as="h2" rootClassName={css.heading}>
              <FormattedMessage id="MakeOfferForm.heading" values={{ listingTitle }} />
            </Heading>

            {listingPriceFormatted && (
              <div className={css.currentPrice}>
                <span className={css.currentPriceLabel}>
                  <FormattedMessage id="MakeOfferForm.currentPrice" />
                </span>{' '}
                <span className={css.currentPriceValue}>{listingPriceFormatted}</span>
              </div>
            )}

            <FieldCurrencyInput
              className={css.field}
              id="offerPrice"
              name="offerPrice"
              label={intl.formatMessage({ id: 'MakeOfferForm.offerLabel' })}
              placeholder={intl.formatMessage(
                { id: 'MakeOfferForm.offerPlaceholder' },
                { marketplaceCurrency }
              )}
              currencyConfig={currencyConfig}
              validate={offerValidators}
            />

            {/* Delivery Method Selection */}
            {(hasShipping || hasPickup) && (
              <div className={css.deliveryMethodSection}>
                <label className={css.deliveryMethodLabel}>
                  <FormattedMessage id="MakeOfferForm.deliveryMethodLabel" />
                </label>
                {hasMultipleDeliveryMethods ? (
                  <Field name="deliveryMethod">
                    {({ input }) => (
                      <select
                        {...input}
                        className={css.deliveryMethodSelect}
                      >
                        <option value="" disabled>
                          {intl.formatMessage({ id: 'MakeOfferForm.selectDeliveryMethod' })}
                        </option>
                        <option value="shipping">
                          {intl.formatMessage({ id: 'MakeOfferForm.deliveryShipping' })}
                        </option>
                        <option value="pickup">
                          {intl.formatMessage({ id: 'MakeOfferForm.deliveryPickup' })}
                        </option>
                      </select>
                    )}
                  </Field>
                ) : (
                  <span className={css.deliveryMethodSingle}>
                    {singleDeliveryMethod === 'shipping'
                      ? intl.formatMessage({ id: 'MakeOfferForm.deliveryShipping' })
                      : intl.formatMessage({ id: 'MakeOfferForm.deliveryPickup' })}
                  </span>
                )}
                {/* Show shipping price when shipping is selected */}
                {shippingPriceFormatted && (values.deliveryMethod === 'shipping' || singleDeliveryMethod === 'shipping') && (
                  <p className={css.shippingPriceNote}>
                    <FormattedMessage
                      id="MakeOfferForm.shippingPriceNote"
                      values={{ shippingPrice: shippingPriceFormatted }}
                    />
                  </p>
                )}
              </div>
            )}

            <FieldTextInput
              className={css.messageField}
              type="textarea"
              id="message"
              name="message"
              label={intl.formatMessage(
                { id: 'MakeOfferForm.messageLabel' },
                { authorDisplayName }
              )}
              placeholder={intl.formatMessage(
                { id: 'MakeOfferForm.messagePlaceholder' },
                { authorDisplayName }
              )}
            />

            {errorMessageMaybe}

            <PrimaryButton
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              <FormattedMessage id="MakeOfferForm.submitButton" />
            </PrimaryButton>
          </Form>
        );
      }}
    />
  );
};

export default MakeOfferForm;
