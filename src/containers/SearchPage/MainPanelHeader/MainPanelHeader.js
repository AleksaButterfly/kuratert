import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import ActiveFilters from '../ActiveFilters/ActiveFilters';

import css from './MainPanelHeader.module.css';

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const IconList = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="2.5" cy="3.5" r="1" fill="currentColor" />
    <circle cx="2.5" cy="8" r="1" fill="currentColor" />
    <circle cx="2.5" cy="12.5" r="1" fill="currentColor" />
    <line x1="5.5" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="5.5" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="5.5" y1="12.5" x2="14" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * MainPanelHeader component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {React.Node} props.children - The children
 * @param {React.Node} props.sortByComponent - The sort by component
 * @param {boolean} props.isSortByActive - Whether the sort by is active
 * @param {boolean} props.listingsAreLoaded - Whether the listings are loaded
 * @param {number} props.resultsCount - The results count
 * @param {boolean} props.searchInProgress - Whether the search is in progress
 * @param {React.Node} props.noResultsInfo - The no results info
 * @param {Object} props.urlQueryParams - The URL query params for active filters
 * @param {Array} props.filterConfigs - The filter configurations
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @param {Array} props.listingCategories - The listing categories
 * @param {Function} props.onRemoveFilter - Callback to remove a filter
 * @param {string} props.viewMode - The current view mode ('grid' or 'list')
 * @param {Function} props.onViewModeChange - Callback to change the view mode
 * @returns {JSX.Element}
 */
const MainPanelHeader = props => {
  const {
    rootClassName,
    className,
    children,
    sortByComponent,
    isSortByActive,
    listingsAreLoaded,
    resultsCount,
    searchInProgress = false,
    noResultsInfo,
    urlQueryParams,
    filterConfigs,
    marketplaceCurrency,
    listingCategories,
    listingTypes,
    onRemoveFilter,
    onResetAll,
    viewMode = 'grid',
    onViewModeChange,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const hasNoResults = listingsAreLoaded && resultsCount === 0;

  const activeFiltersComponent = filterConfigs && onRemoveFilter ? (
    <ActiveFilters
      urlQueryParams={urlQueryParams}
      filterConfigs={filterConfigs}
      marketplaceCurrency={marketplaceCurrency}
      listingCategories={listingCategories}
      listingTypes={listingTypes}
      onRemoveFilter={onRemoveFilter}
    />
  ) : null;

  return (
    <div className={classes}>
      <div className={css.breadcrumbs}>
        <FormattedMessage id="MainPanelHeader.breadcrumbs" />
      </div>

      {hasNoResults ? (
        <>
          {/* When no results: ActiveFilters above the no results message */}
          {activeFiltersComponent}

          <div className={classNames(css.headerRow, css.headerRowNoResults)}>
            <div className={css.titleSection}>
              <p className={css.noResultsText}>
                <FormattedMessage id="SearchPage.noResults" />
              </p>
              {onResetAll ? (
                <button className={css.resetFiltersButton} onClick={onResetAll}>
                  <FormattedMessage id="SearchPage.resetAllFilters" />
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* When has results: header row first, then ActiveFilters below */}
          <div className={css.headerRow}>
            <div className={css.titleSection}>
              <h1 className={css.pageTitle}>
                <FormattedMessage id="MainPanelHeader.pageTitle" />
              </h1>
              <p className={css.resultsCount}>
                {searchInProgress ? (
                  <FormattedMessage id="MainPanelHeader.loadingResults" />
                ) : (
                  <FormattedMessage
                    id="MainPanelHeader.foundResults"
                    values={{ count: resultsCount }}
                  />
                )}
              </p>
            </div>

            <div className={css.controlsSection}>
              {isSortByActive ? (
                <div className={css.sortByWrapper}>
                  {sortByComponent}
                </div>
              ) : null}

              {onViewModeChange ? (
                <div className={css.viewToggle}>
                  <button
                    type="button"
                    className={classNames(css.viewButton, {
                      [css.viewButtonActive]: viewMode === 'grid',
                    })}
                    onClick={() => onViewModeChange('grid')}
                    aria-label="Grid view"
                  >
                    <IconGrid />
                  </button>
                  <button
                    type="button"
                    className={classNames(css.viewButton, {
                      [css.viewButtonActive]: viewMode === 'list',
                    })}
                    onClick={() => onViewModeChange('list')}
                    aria-label="List view"
                  >
                    <IconList />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {activeFiltersComponent}
        </>
      )}

      {children}
    </div>
  );
};

export default MainPanelHeader;
