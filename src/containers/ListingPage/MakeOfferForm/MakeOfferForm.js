import React from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';

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
    ...restProps
  } = props;

  return (
    <FinalForm
      {...restProps}
      render={fieldRenderProps => {
        const {
          className,
          rootClassName,
          handleSubmit,
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
        const submitDisabled = submitInProgress;

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
