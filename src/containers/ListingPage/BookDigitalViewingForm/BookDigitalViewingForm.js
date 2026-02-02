import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { getStartOf, isInRange } from '../../../util/dates';

import {
  ErrorMessage,
  FieldSelect,
  FieldSingleDatePicker,
  FieldTextInput,
  Form,
  Heading,
  IconInquiry,
  PrimaryButton,
} from '../../../components';

import css from './BookDigitalViewingForm.module.css';

// Generate time slot options from 9:00 to 18:00
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 18; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({ value: time, label: time });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

/**
 * The BookDigitalViewingForm component.
 * Used to request a digital viewing for a listing.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.submitButtonWrapperClassName] - Custom class to be passed for the submit button wrapper
 * @param {boolean} [props.inProgress] - Whether the request is in progress
 * @param {string} props.listingTitle - The listing title
 * @param {string} props.authorDisplayName - The author display name
 * @param {propTypes.error} props.sendDigitalViewingError - The send digital viewing error
 * @returns {JSX.Element} book digital viewing form component
 */
const BookDigitalViewingForm = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        submitButtonWrapperClassName,
        formId,
        handleSubmit,
        inProgress = false,
        listingTitle,
        authorDisplayName,
        sendDigitalViewingError,
      } = fieldRenderProps;

      const intl = useIntl();

      // Date field
      const dateLabel = intl.formatMessage({ id: 'BookDigitalViewingForm.dateLabel' });
      const datePlaceholder = intl.formatMessage({ id: 'BookDigitalViewingForm.datePlaceholder' });
      const dateRequiredMessage = intl.formatMessage({ id: 'BookDigitalViewingForm.dateRequired' });
      const dateRequired = validators.required(dateRequiredMessage);

      // Time field
      const timeLabel = intl.formatMessage({ id: 'BookDigitalViewingForm.timeLabel' });
      const timePlaceholder = intl.formatMessage({ id: 'BookDigitalViewingForm.timePlaceholder' });
      const timeRequiredMessage = intl.formatMessage({ id: 'BookDigitalViewingForm.timeRequired' });
      const timeRequired = validators.required(timeRequiredMessage);

      // Message field (optional)
      const messageLabel = intl.formatMessage(
        { id: 'BookDigitalViewingForm.messageLabel' },
        { authorDisplayName }
      );
      const messagePlaceholder = intl.formatMessage(
        { id: 'BookDigitalViewingForm.messagePlaceholder' },
        { authorDisplayName }
      );

      // Date range: today + 90 days
      const isOutsideRange = day => {
        const start = getStartOf(new Date(), 'day');
        const end = getStartOf(start, 'day', null, 90, 'days');
        return !isInRange(day, start, end, 'day');
      };

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="OrderDetailsPage">
          <IconInquiry className={css.icon} />
          <Heading as="h2" rootClassName={css.heading}>
            <FormattedMessage id="BookDigitalViewingForm.heading" values={{ listingTitle }} />
          </Heading>

          <FieldSingleDatePicker
            className={css.field}
            name="viewingDate"
            id={formId ? `${formId}.viewingDate` : 'viewingDate'}
            label={dateLabel}
            placeholderText={datePlaceholder}
            isOutsideRange={isOutsideRange}
            validate={dateRequired}
            showErrorMessage
          />

          <FieldSelect
            className={css.field}
            name="viewingTime"
            id={formId ? `${formId}.viewingTime` : 'viewingTime'}
            label={timeLabel}
            validate={timeRequired}
          >
            <option value="">{timePlaceholder}</option>
            {TIME_SLOTS.map(slot => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </FieldSelect>

          <FieldTextInput
            className={css.field}
            type="textarea"
            name="message"
            id={formId ? `${formId}.message` : 'message'}
            label={messageLabel}
            placeholder={messagePlaceholder}
          />

          <div className={submitButtonWrapperClassName}>
            <ErrorMessage error={sendDigitalViewingError} />
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="BookDigitalViewingForm.submitButtonText" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

export default BookDigitalViewingForm;
