import React, { useRef, useCallback } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { useIntl } from '../../../../../util/reactIntl';
import { useConfiguration } from '../../../../../context/configurationContext';
import { isMainSearchTypeKeywords } from '../../../../../util/search';
import { createResourceLocatorString } from '../../../../../util/routes';
import { useRouteConfiguration } from '../../../../../context/routeConfigurationContext';
import { Form, PrimaryButton, LocationAutocompleteInput, KeywordSearchPredictions } from '../../../../../components';
import useKeywordSearchPredictions from '../../../../../hooks/useKeywordSearchPredictions';

import css from './TopbarDesktopSearchForm.module.css';

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

const TopbarDesktopSearchForm = props => {
  const intl = useIntl();
  const history = useHistory();
  const routes = useRouteConfiguration();
  const config = useConfiguration();
  const searchInputRef = useRef(null);
  const selectionInProgressRef = useRef(false);
  const { className, rootClassName, onSubmit, appConfig } = props;

  const isKeywordsSearch = isMainSearchTypeKeywords(appConfig);

  // Get categories from hosted config
  const categories = config?.categoryConfiguration?.categories || [];

  // Use the custom hook for keyword search predictions
  const {
    searchTerm,
    predictions,
    isLoading,
    highlightedIndex,
    showPredictions,
    handleSearchChange,
    handleKeyDown,
    getSelectedItem,
    hidePredictions,
    showPredictionsPanel,
    setHighlightedIndex,
  } = useKeywordSearchPredictions(categories);

  const hasPredictions =
    predictions.categories.length > 0 ||
    predictions.listings.length > 0 ||
    predictions.sellers.length > 0;

  const handleLocationChange = location => {
    if (!isKeywordsSearch && location.selectedPlace) {
      onSubmit({ location });
      searchInputRef?.current?.blur();
    }
  };

  const handleKeywordSubmit = values => {
    if (isKeywordsSearch) {
      // Check if there's a highlighted item
      const selectedItem = getSelectedItem();
      if (selectedItem) {
        handlePredictionSelect(selectedItem);
      } else {
        onSubmit({ keywords: values.keywords || searchTerm });
      }
      searchInputRef?.current?.blur();
      hidePredictions();
    }
  };

  const handleLocationSubmit = values => {
    if (!isKeywordsSearch) {
      onSubmit({ location: values.location });
    }
  };

  const handlePredictionSelect = useCallback(
    selection => {
      const { type, data } = selection;

      if (type === 'category') {
        const searchPath = createResourceLocatorString(
          'SearchPage',
          routes,
          {},
          { pub_categoryLevel1: data.id }
        );
        history.push(searchPath);
      } else if (type === 'listing') {
        const listingPath = createResourceLocatorString(
          'ListingPage',
          routes,
          { id: data.id?.uuid, slug: data.slug || 'listing' },
          {}
        );
        history.push(listingPath);
      } else if (type === 'seller') {
        const profilePath = createResourceLocatorString(
          'ProfilePage',
          routes,
          { id: data.id?.uuid },
          {}
        );
        history.push(profilePath);
      }

      hidePredictions();
    },
    [routes, history, hidePredictions]
  );

  const handleInputKeyDown = useCallback(
    e => {
      if (e.key === 'Enter') {
        const selectedItem = getSelectedItem();
        if (selectedItem) {
          e.preventDefault();
          e.stopPropagation();
          handlePredictionSelect(selectedItem);
          searchInputRef?.current?.blur();
          return;
        }
      }
      handleKeyDown(e);
    },
    [handleKeyDown, getSelectedItem, handlePredictionSelect]
  );

  const handleInputFocus = useCallback(() => {
    showPredictionsPanel();
  }, [showPredictionsPanel]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding to allow click events on predictions
    if (!selectionInProgressRef.current) {
      setTimeout(() => {
        if (!selectionInProgressRef.current) {
          hidePredictions();
        }
      }, 200);
    }
  }, [hidePredictions]);

  const handleSelectStart = useCallback(() => {
    selectionInProgressRef.current = true;
  }, []);

  const handleSelectEnd = useCallback(
    selection => {
      selectionInProgressRef.current = false;
      handlePredictionSelect(selection);
    },
    [handlePredictionSelect]
  );

  const submit = isKeywordsSearch ? handleKeywordSubmit : handleLocationSubmit;

  return (
    <FinalForm
      onSubmit={submit}
      render={({ handleSubmit }) => {
        const classes = classNames(rootClassName || css.root, className);
        const placeholder = intl.formatMessage({ id: 'TopbarSearchForm.placeholder' });
        const exploreText = intl.formatMessage({ id: 'HeroSearchForm.explore' });

        const inputWrapperClasses = classNames(css.inputWrapper, {
          [css.inputWrapperWithPredictions]: showPredictions && hasPredictions,
        });

        return (
          <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="SearchPage">
            <div className={inputWrapperClasses}>
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
                        value={searchTerm}
                        onChange={e => {
                          input.onChange(e);
                          handleSearchChange(e.target.value);
                        }}
                        onKeyDown={handleInputKeyDown}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    )}
                  />
                  <PrimaryButton type="submit" className={css.submitButton}>
                    <span className={css.buttonText}>{exploreText}</span>
                    <IconArrowRight />
                  </PrimaryButton>
                  {showPredictions && (hasPredictions || isLoading) && (
                    <KeywordSearchPredictions
                      className={css.predictions}
                      categories={predictions.categories}
                      listings={predictions.listings}
                      sellers={predictions.sellers}
                      highlightedIndex={highlightedIndex}
                      onSelectStart={handleSelectStart}
                      onSelectEnd={handleSelectEnd}
                      onHighlightChange={setHighlightedIndex}
                      isLoading={isLoading}
                    />
                  )}
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

export default TopbarDesktopSearchForm;
