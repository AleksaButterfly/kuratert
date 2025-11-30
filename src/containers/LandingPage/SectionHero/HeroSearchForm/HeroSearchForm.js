import React, { useRef } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import classNames from 'classnames';

import { useIntl } from '../../../../util/reactIntl';
import { isMainSearchTypeKeywords } from '../../../../util/search';
import { Form, PrimaryButton, LocationAutocompleteInput } from '../../../../components';

import css from './HeroSearchForm.module.css';

const identity = v => v;

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
  const searchInputRef = useRef(null);
  const { className, rootClassName, onSubmit, appConfig } = props;

  const isKeywordsSearch = isMainSearchTypeKeywords(appConfig);

  const handleLocationChange = location => {
    if (!isKeywordsSearch && location.selectedPlace) {
      onSubmit({ location });
      searchInputRef?.current?.blur();
    }
  };

  const handleKeywordSubmit = values => {
    if (isKeywordsSearch) {
      onSubmit({ keywords: values.keywords });
      searchInputRef?.current?.blur();
    }
  };

  const handleLocationSubmit = values => {
    if (!isKeywordsSearch) {
      onSubmit({ location: values.location });
    }
  };

  const submit = isKeywordsSearch ? handleKeywordSubmit : handleLocationSubmit;

  return (
    <FinalForm
      onSubmit={submit}
      render={({ handleSubmit }) => {
        const classes = classNames(rootClassName || css.root, className);
        const placeholder = intl.formatMessage({ id: 'SectionHero.searchPlaceholder' });
        const exploreText = intl.formatMessage({ id: 'HeroSearchForm.explore' });

        return (
          <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="SearchPage">
            <div className={css.inputWrapper}>
              <span className={css.searchIcon}>
                <IconSearch />
              </span>
              {isKeywordsSearch ? (
                <>
                  <Field
                    name="keywords"
                    render={({ input }) => (
                      <input
                        {...input}
                        ref={searchInputRef}
                        className={css.input}
                        type="text"
                        placeholder={placeholder}
                        autoComplete="off"
                      />
                    )}
                  />
                  <PrimaryButton type="submit" className={css.submitButton}>
                    <span className={css.buttonText}>{exploreText}</span>
                    <IconArrowRight />
                  </PrimaryButton>
                </>
              ) : (
                <Field
                  name="location"
                  format={identity}
                  render={({ input, meta }) => {
                    const { onChange, ...restInput } = input;
                    const searchOnChange = value => {
                      onChange(value);
                      handleLocationChange(value);
                    };

                    return (
                      <LocationAutocompleteInput
                        className={css.locationInputRoot}
                        inputClassName={css.locationInput}
                        predictionsClassName={css.predictions}
                        placeholder={placeholder}
                        closeOnBlur={true}
                        inputRef={searchInputRef}
                        input={{ ...restInput, onChange: searchOnChange }}
                        meta={meta}
                        hideIcon={true}
                        useDarkText={true}
                      />
                    );
                  }}
                />
              )}
            </div>
          </Form>
        );
      }}
    />
  );
};

export default HeroSearchForm;
