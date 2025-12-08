import React from 'react';
import { useIntl } from '../../../util/reactIntl';
import { constructQueryParamName } from '../../../util/search';
import { formatMoney } from '../../../util/currency';
import { types as sdkTypes } from '../../../util/sdkLoader';

import css from './ActiveFilters.module.css';

const { Money } = sdkTypes;

// Dimension filter keys
const DIMENSION_KEYS = ['dimension_height', 'dimension_width', 'dimension_depth'];

// Get dimension label
const getDimensionLabel = (key, intl) => {
  switch (key) {
    case 'dimension_height':
      return intl.formatMessage({ id: 'DimensionsFilter.height' });
    case 'dimension_width':
      return intl.formatMessage({ id: 'DimensionsFilter.width' });
    case 'dimension_depth':
      return intl.formatMessage({ id: 'DimensionsFilter.depth' });
    default:
      return key;
  }
};

const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Find category/subcategory label from categories tree
 */
const findCategoryLabel = (categories, categoryId) => {
  if (!categories || !Array.isArray(categories)) return null;

  for (const cat of categories) {
    if (cat.id === categoryId) {
      return cat.name;
    }
    if (cat.subcategories) {
      const found = findCategoryLabel(cat.subcategories, categoryId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Get the display label for a filter value
 */
const getFilterLabel = (filterConfig, value, intl, marketplaceCurrency, listingCategories, listingTypes) => {
  const { key, schemaType, enumOptions, filterConfig: filterCfg } = filterConfig;
  const label = filterCfg?.label || filterConfig.label;

  // Handle dimension filters
  if (DIMENSION_KEYS.includes(key) && value) {
    try {
      const [minValue, maxValue] = value.split(',').map(Number);
      if (!isNaN(minValue) && !isNaN(maxValue)) {
        const dimensionLabel = getDimensionLabel(key, intl);
        return `${dimensionLabel} (cm): ${minValue} - ${maxValue}`;
      }
    } catch (e) {
      return getDimensionLabel(key, intl);
    }
  }

  // Handle other long/integer range filters
  if (schemaType === 'long' && value) {
    try {
      const [minValue, maxValue] = value.split(',').map(Number);
      if (!isNaN(minValue) && !isNaN(maxValue)) {
        return `${label}: ${minValue} - ${maxValue}`;
      }
    } catch (e) {
      return label || key;
    }
  }

  // Handle price filter
  if (schemaType === 'price' && value) {
    try {
      const [minPrice, maxPrice] = value.split(',').map(Number);
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        const minMoney = new Money(minPrice, marketplaceCurrency);
        const maxMoney = new Money(maxPrice, marketplaceCurrency);
        const minFormatted = formatMoney(intl, minMoney);
        const maxFormatted = formatMoney(intl, maxMoney);
        return `${label}: ${minFormatted} - ${maxFormatted}`;
      }
    } catch (e) {
      // If price parsing fails, return a simple label
      return label || 'Price';
    }
  }

  // Handle category filter
  if (schemaType === 'category') {
    const categoryName = findCategoryLabel(listingCategories || [], value);
    const categoryLabel = intl.formatMessage({ id: 'FilterComponent.categoryLabel' });
    return categoryName ? `${categoryLabel}: ${categoryName}` : value;
  }

  // Handle enum/multi-enum filters
  if (enumOptions && enumOptions.length > 0) {
    const values = value.split(',');
    const labels = values.map(v => {
      const option = enumOptions.find(opt => opt.option === v);
      return option ? option.label : v;
    });
    const selectedLabels = labels.join(', ');
    return label ? `${label}: ${selectedLabels}` : selectedLabels;
  }

  // Handle listingType filter
  if (schemaType === 'listingType' && listingTypes) {
    const listingTypeConfig = listingTypes.find(lt => lt.listingType === value);
    return listingTypeConfig?.label || value;
  }

  // Handle keywords
  if (key === 'keywords') {
    const keywordsLabel = intl.formatMessage({ id: 'FilterComponent.keywordsLabel' });
    return `${keywordsLabel}: "${value}"`;
  }

  // Try to find if value matches a category/subcategory in the tree
  // This handles cases where filters use category IDs but aren't explicitly category type
  const categoryLabel = findCategoryLabel(listingCategories || [], value);
  if (categoryLabel) {
    return categoryLabel;
  }

  // Default: return the value as-is
  return value;
};

/**
 * Parse active filters from URL query params and filter configs
 */
const parseActiveFilters = (urlQueryParams, filterConfigs, intl, marketplaceCurrency, listingCategories, listingTypes) => {
  const activeFilters = [];

  // Keys to ignore (not user-facing filters)
  const ignoreKeys = ['bounds', 'address', 'origin', 'page', 'sort', 'mapSearch'];

  filterConfigs.forEach(filterConfig => {
    const { key, schemaType, scope } = filterConfig;

    // Handle category filters (they have levels like pub_categoryLevel1, pub_categoryLevel2, etc.)
    if (schemaType === 'category') {
      // Check for category level params
      for (let level = 1; level <= 3; level++) {
        const paramName = constructQueryParamName(`${key}${level}`, 'public');
        const value = urlQueryParams[paramName];
        if (value) {
          activeFilters.push({
            key: paramName,
            filterConfig,
            value,
            label: getFilterLabel(filterConfig, value, intl, marketplaceCurrency, listingCategories, listingTypes),
          });
        }
      }
    } else {
      // Handle other filters
      const paramName = schemaType === 'price' || schemaType === 'keywords' || schemaType === 'dates' || schemaType === 'seats'
        ? key
        : constructQueryParamName(key, scope);

      const value = urlQueryParams[paramName];
      if (value && !ignoreKeys.includes(paramName)) {
        activeFilters.push({
          key: paramName,
          filterConfig,
          value,
          label: getFilterLabel(filterConfig, value, intl, marketplaceCurrency, listingCategories, listingTypes),
        });
      }
    }
  });

  // Also check for keywords if not in filterConfigs
  if (urlQueryParams.keywords && !activeFilters.find(f => f.key === 'keywords')) {
    activeFilters.push({
      key: 'keywords',
      filterConfig: { key: 'keywords', label: 'Keywords' },
      value: urlQueryParams.keywords,
      label: `"${urlQueryParams.keywords}"`,
    });
  }

  return activeFilters;
};

/**
 * ActiveFilters component displays active filter tags with remove buttons
 */
const ActiveFilters = props => {
  const {
    urlQueryParams,
    filterConfigs,
    marketplaceCurrency,
    listingCategories,
    listingTypes,
    onRemoveFilter,
  } = props;

  const intl = useIntl();

  const activeFilters = parseActiveFilters(
    urlQueryParams,
    filterConfigs,
    intl,
    marketplaceCurrency,
    listingCategories,
    listingTypes
  );

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={css.root}>
      <span className={css.label}>
        {intl.formatMessage({ id: 'ActiveFilters.label' })}
      </span>
      <div className={css.tags}>
        {activeFilters.map(filter => (
          <div key={filter.key} className={css.tag}>
            <span className={css.tagText}>{filter.label}</span>
            <button
              className={css.removeButton}
              onClick={() => onRemoveFilter(filter.key)}
              type="button"
              aria-label={intl.formatMessage(
                { id: 'ActiveFilters.removeFilter' },
                { filter: filter.label }
              )}
            >
              <IconClose />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveFilters;
