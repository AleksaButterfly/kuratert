import React from 'react';
import { string, array, func, number, bool } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';
import { NamedLink } from '../../components';

import css from './KeywordSearchPredictions.module.css';

const IconCategory = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const IconListing = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M4.5 6H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M4.5 9H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const IconSeller = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M2 14.5C2 11.5 4.5 9.5 8 9.5C11.5 9.5 14 11.5 14 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const PredictionItem = props => {
  const { prediction, type, isHighlighted, onMouseEnter, onMouseDown, onMouseUp, intl } = props;

  const classes = classNames(css.predictionItem, {
    [css.highlighted]: isHighlighted,
  });

  if (type === 'category') {
    return (
      <li
        className={classes}
        onMouseEnter={onMouseEnter}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        <NamedLink
          name="SearchPage"
          to={{ search: `?pub_categoryLevel1=${prediction.id}` }}
          className={css.predictionLink}
        >
          <IconCategory />
          <span>{prediction.name}</span>
        </NamedLink>
      </li>
    );
  }

  if (type === 'listing') {
    return (
      <li
        className={classes}
        onMouseEnter={onMouseEnter}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        <NamedLink
          name="ListingPage"
          params={{ id: prediction.id?.uuid, slug: prediction.slug || 'listing' }}
          className={css.predictionLink}
        >
          <IconListing />
          <span>{prediction.title}</span>
        </NamedLink>
      </li>
    );
  }

  if (type === 'seller') {
    return (
      <li
        className={classes}
        onMouseEnter={onMouseEnter}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        <NamedLink
          name="ProfilePage"
          params={{ id: prediction.id?.uuid }}
          className={css.predictionLink}
        >
          <IconSeller />
          <span>{prediction.displayName}</span>
        </NamedLink>
      </li>
    );
  }

  return null;
};

const KeywordSearchPredictions = props => {
  const {
    rootClassName,
    className,
    categories,
    listings,
    sellers,
    highlightedIndex,
    onSelectStart,
    onSelectEnd,
    onHighlightChange,
    isLoading,
  } = props;

  const intl = useIntl();
  const classes = classNames(rootClassName || css.root, className);

  const hasCategories = categories && categories.length > 0;
  const hasListings = listings && listings.length > 0;
  const hasSellers = sellers && sellers.length > 0;
  const hasResults = hasCategories || hasListings || hasSellers;

  if (!hasResults && !isLoading) {
    return null;
  }

  // Calculate flat index for keyboard navigation
  let currentIndex = 0;

  const categoryLabel = intl.formatMessage({ id: 'KeywordSearchPredictions.categories' });
  const listingsLabel = intl.formatMessage({ id: 'KeywordSearchPredictions.listings' });
  const sellersLabel = intl.formatMessage({ id: 'KeywordSearchPredictions.sellers' });

  return (
    <div className={classes}>
      {isLoading && !hasResults && (
        <div className={css.loadingContainer}>
          <span className={css.loadingText}>
            {intl.formatMessage({ id: 'KeywordSearchPredictions.loading' })}
          </span>
        </div>
      )}

      {hasCategories && (
        <div className={css.section}>
          <div className={css.sectionHeader}>{categoryLabel}</div>
          <ul className={css.predictionList}>
            {categories.map((category, index) => {
              const itemIndex = currentIndex++;
              return (
                <PredictionItem
                  key={category.id}
                  prediction={category}
                  type="category"
                  isHighlighted={itemIndex === highlightedIndex}
                  onMouseEnter={() => onHighlightChange(itemIndex)}
                  onMouseDown={onSelectStart}
                  onMouseUp={() => onSelectEnd({ type: 'category', data: category })}
                  intl={intl}
                />
              );
            })}
          </ul>
        </div>
      )}

      {hasListings && (
        <div className={css.section}>
          <div className={css.sectionHeader}>{listingsLabel}</div>
          <ul className={css.predictionList}>
            {listings.map((listing, index) => {
              const itemIndex = currentIndex++;
              return (
                <PredictionItem
                  key={listing.id?.uuid || index}
                  prediction={listing}
                  type="listing"
                  isHighlighted={itemIndex === highlightedIndex}
                  onMouseEnter={() => onHighlightChange(itemIndex)}
                  onMouseDown={onSelectStart}
                  onMouseUp={() => onSelectEnd({ type: 'listing', data: listing })}
                  intl={intl}
                />
              );
            })}
          </ul>
        </div>
      )}

      {hasSellers && (
        <div className={css.section}>
          <div className={css.sectionHeader}>{sellersLabel}</div>
          <ul className={css.predictionList}>
            {sellers.map((seller, index) => {
              const itemIndex = currentIndex++;
              return (
                <PredictionItem
                  key={seller.id?.uuid || index}
                  prediction={seller}
                  type="seller"
                  isHighlighted={itemIndex === highlightedIndex}
                  onMouseEnter={() => onHighlightChange(itemIndex)}
                  onMouseDown={onSelectStart}
                  onMouseUp={() => onSelectEnd({ type: 'seller', data: seller })}
                  intl={intl}
                />
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

KeywordSearchPredictions.defaultProps = {
  rootClassName: null,
  className: null,
  categories: [],
  listings: [],
  sellers: [],
  highlightedIndex: -1,
  isLoading: false,
};

KeywordSearchPredictions.propTypes = {
  rootClassName: string,
  className: string,
  categories: array,
  listings: array,
  sellers: array,
  highlightedIndex: number,
  onSelectStart: func.isRequired,
  onSelectEnd: func.isRequired,
  onHighlightChange: func.isRequired,
  isLoading: bool,
};

export default KeywordSearchPredictions;
