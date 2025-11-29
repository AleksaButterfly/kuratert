import React from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import classNames from 'classnames';

import { useIntl } from '../../../../util/reactIntl';
import { Form, PrimaryButton } from '../../../../components';

import css from './HeroSearchForm.module.css';

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M13 13L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HeroSearchForm = props => {
  const intl = useIntl();
  const { className, rootClassName, onSubmit } = props;

  const handleSubmit = values => {
    onSubmit({ keywords: values.keywords });
  };

  return (
    <FinalForm
      onSubmit={handleSubmit}
      render={({ handleSubmit }) => {
        const classes = classNames(rootClassName || css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="SearchPage">
            <div className={css.inputWrapper}>
              <span className={css.searchIcon}>
                <IconSearch />
              </span>
              <Field
                name="keywords"
                render={({ input }) => (
                  <input
                    {...input}
                    className={css.input}
                    type="text"
                    placeholder={intl.formatMessage({ id: 'SectionHero.searchPlaceholder' })}
                    autoComplete="off"
                  />
                )}
              />
              <PrimaryButton type="submit" className={css.submitButton}>
                <span className={css.buttonText}>
                  {intl.formatMessage({ id: 'HeroSearchForm.explore' })}
                </span>
                <IconArrowRight />
              </PrimaryButton>
            </div>
          </Form>
        );
      }}
    />
  );
};

export default HeroSearchForm;
