import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { useIntl } from '../../../../util/reactIntl';
import { Form, FieldTextInput, PrimaryButton } from '../../../../components';

import css from './NewsletterForm.module.css';

const NewsletterForm = props => {
  const { className, rootClassName, onSubmit, inProgress } = props;
  const intl = useIntl();

  return (
    <FinalForm
      onSubmit={onSubmit}
      render={formRenderProps => {
        const { handleSubmit, invalid, form } = formRenderProps;
        const classes = classNames(rootClassName || css.root, className);
        const submitDisabled = invalid || inProgress;

        const handleFormSubmit = values => {
          handleSubmit(values);
          form.reset();
        };

        return (
          <Form className={classes} onSubmit={handleFormSubmit}>
            <div className={css.inputWrapper}>
              <FieldTextInput
                id="newsletterEmail"
                name="email"
                type="email"
                className={css.fieldWrapper}
                inputRootClass={css.emailInput}
                placeholder={intl.formatMessage({ id: 'NewsletterForm.emailPlaceholder' })}
              />
              <PrimaryButton
                type="submit"
                className={css.submitButton}
                spinnerClassName={css.buttonSpinner}
                inProgress={inProgress}
                disabled={submitDisabled}
              >
                {intl.formatMessage({ id: 'NewsletterForm.subscribe' })}
              </PrimaryButton>
            </div>
          </Form>
        );
      }}
    />
  );
};

export default NewsletterForm;
