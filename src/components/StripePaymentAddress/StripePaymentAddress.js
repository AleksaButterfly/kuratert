import React from 'react';

import { intlShape } from '../../util/reactIntl';
import * as validators from '../../util/validators';
import getCountryCodes from '../../translations/countryCodes';
import { FieldTextInput, FieldSelect } from '../../components';

import css from './StripePaymentAddress.module.css';

/**
 * A component that renders a Stripe payment address.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {intlShape} props.intl - The intl object
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {Object} props.form - The form object
 * @param {string} props.fieldId - The field id
 * @param {Object} props.card - The card object
 * @param {string} props.locale - The locale
 * @returns {JSX.Element}
 */
const StripePaymentAddress = props => {
  const { className, intl, disabled, form, fieldId, card, locale } = props;

  const optionalText = intl.formatMessage({
    id: 'StripePaymentAddress.optionalText',
  });

  const addressLine1Label = intl.formatMessage({
    id: 'StripePaymentAddress.addressLine1Label',
  });
  const addressLine1Placeholder = intl.formatMessage({
    id: 'StripePaymentAddress.addressLine1Placeholder',
  });
  const addressLine1Required = validators.required(
    intl.formatMessage({
      id: 'StripePaymentAddress.addressLine1Required',
    })
  );

  const postalCodeLabel = intl.formatMessage({ id: 'StripePaymentAddress.postalCodeLabel' });
  const postalCodePlaceholder = intl.formatMessage({
    id: 'StripePaymentAddress.postalCodePlaceholder',
  });
  const postalCodeRequired = validators.required(
    intl.formatMessage({
      id: 'StripePaymentAddress.postalCodeRequired',
    })
  );

  const cityLabel = intl.formatMessage({ id: 'StripePaymentAddress.cityLabel' });
  const cityPlaceholder = intl.formatMessage({ id: 'StripePaymentAddress.cityPlaceholder' });
  const cityRequired = validators.required(
    intl.formatMessage({
      id: 'StripePaymentAddress.cityRequired',
    })
  );

  const countryLabel = intl.formatMessage({ id: 'StripePaymentAddress.countryLabel' });
  const countryPlaceholder = intl.formatMessage({ id: 'StripePaymentAddress.countryPlaceholder' });
  const countryRequired = validators.required(
    intl.formatMessage({
      id: 'StripePaymentAddress.countryRequired',
    })
  );

  const handleOnChange = event => {
    const value = event.target.value;
    form.change('postal', value);
    card.update({ value: { postalCode: value } });
  };

  // Use the language set in config.localization.locale to get the correct translations of the country names
  const countryCodes = getCountryCodes(locale);

  return (
    <div className={className ? className : css.root}>
      <FieldTextInput
        id={`${fieldId}.addressLine1`}
        name="addressLine1"
        disabled={disabled}
        className={css.fieldFullWidth}
        type="text"
        autoComplete="billing address-line1"
        label={addressLine1Label}
        placeholder={addressLine1Placeholder}
        validate={addressLine1Required}
        onUnmount={() => form.change('addressLine1', undefined)}
      />
      <div className={css.formRow}>
        <FieldTextInput
          id={`${fieldId}.postalCode`}
          name="postal"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="billing postal-code"
          label={postalCodeLabel}
          placeholder={postalCodePlaceholder}
          validate={postalCodeRequired}
          onUnmount={() => form.change('postal', undefined)}
          onChange={event => handleOnChange(event)}
        />

        <FieldTextInput
          id={`${fieldId}.city`}
          name="city"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="billing address-level2"
          label={cityLabel}
          placeholder={cityPlaceholder}
          validate={cityRequired}
          onUnmount={() => form.change('city', undefined)}
        />
      </div>
      <FieldSelect
        id={`${fieldId}.country`}
        name="country"
        disabled={disabled}
        className={css.fieldFullWidth}
        label={countryLabel}
        validate={countryRequired}
      >
        <option disabled value="">
          {countryPlaceholder}
        </option>
        {countryCodes.map(country => {
          return (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          );
        })}
      </FieldSelect>
    </div>
  );
};

export default StripePaymentAddress;
