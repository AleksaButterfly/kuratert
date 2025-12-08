import React, { useRef } from 'react';
import debounce from 'lodash/debounce';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { constructQueryParamName } from '../../../util/search';

import FilterPlain from '../FilterPlain/FilterPlain';
import FieldSelectIntegerRange from '../IntegerRangeFilter/FieldSelectIntegerRange';

import css from './DimensionsFilter.module.css';

const RADIX = 10;

// Dimension keys that should be grouped
const DIMENSION_KEYS = ['dimension_height', 'dimension_width', 'dimension_depth'];

// Check if a filter config is a dimension filter
export const isDimensionFilter = config => DIMENSION_KEYS.includes(config?.key);

// Get dimension label key (Height, Width, Depth)
const getDimensionLabel = key => {
  switch (key) {
    case 'dimension_height':
      return 'DimensionsFilter.height';
    case 'dimension_width':
      return 'DimensionsFilter.width';
    case 'dimension_depth':
      return 'DimensionsFilter.depth';
    default:
      return key;
  }
};

// Convert query param to object (e.g., "30,100" -> { minValue: 30, maxValue: 100 })
const convertQueryParamToObject = valueRange => {
  const [minValue, maxValue] = !!valueRange
    ? valueRange.split(',').map(v => Number.parseInt(v, RADIX))
    : [];
  return !!valueRange && minValue != null && maxValue != null ? { minValue, maxValue } : null;
};

// Format to query param (e.g., { minValue: 30, maxValue: 100 } -> "30,100")
const formatToQueryParam = (range, queryParamName) => {
  const { minValue, maxValue } = range || {};
  const value = minValue != null && maxValue != null ? `${minValue},${maxValue}` : null;
  return { [queryParamName]: value };
};

// Get valid range values from URL params
const getValidRangeValues = (queryParamValue, min, max) => {
  const parsedRangeValues = queryParamValue
    ? convertQueryParamToObject(queryParamValue)
    : {};

  const { minValue, maxValue } = parsedRangeValues || {};
  const hasValidMinValue = minValue != null && minValue >= min;
  const hasValidMaxValue = maxValue != null && maxValue >= minValue && maxValue <= max;
  const hasRangeValues = hasValidMinValue && hasValidMaxValue;

  return hasRangeValues ? { minValue, maxValue } : {};
};

// Single dimension row component using FieldSelectIntegerRange
const DimensionRow = props => {
  const {
    dimensionKey,
    name,
    min,
    max,
    step,
    initialValues,
    intl,
  } = props;

  const labelId = getDimensionLabel(dimensionKey);
  const label = intl.formatMessage({ id: labelId });

  return (
    <div className={css.dimensionRow}>
      <label className={css.dimensionLabel}>{label}</label>
      <FieldSelectIntegerRange
        isInSideBar
        max={max}
        min={min}
        name={name}
        step={step}
        initialValues={initialValues}
        intl={intl}
      />
    </div>
  );
};

/**
 * DimensionsFilter - Groups dimension_height, dimension_width, dimension_depth into one filter
 */
const DimensionsFilter = props => {
  const intl = useIntl();
  const {
    dimensionConfigs,
    urlQueryParams,
    initialValues, // This is a curried function: (queryParamNames, isLiveEdit) => values
    getHandleChangedValueFn,
    className,
    id = 'DimensionsFilter',
    ...rest
  } = props;

  const bypassDebounce = useRef({});

  // Build query param names for all dimensions
  const allQueryParamNames = dimensionConfigs.map(config => {
    const { key, scope } = config;
    return constructQueryParamName(key, scope);
  });

  // Get actual initial values by calling the curried function
  // initialValues is (queryParamNames, isLiveEdit) => { paramName: value }
  const urlValues = initialValues(allQueryParamNames, true);

  // Get query param names and initial values for each dimension
  const dimensionsData = dimensionConfigs.map(config => {
    const { key, scope, minimum = 0, maximum = 9999999, step = 1 } = config;
    const queryParamName = constructQueryParamName(key, scope);
    const queryParamValue = urlValues[queryParamName];
    const validValues = getValidRangeValues(queryParamValue, minimum, maximum);

    return {
      key,
      queryParamName,
      min: minimum,
      max: maximum,
      step,
      initialValue: validValues,
      hasValue: Object.keys(validValues).length > 0,
    };
  });

  const hasAnyInitialValues = dimensionsData.some(d => d.hasValue);
  const selectedCount = dimensionsData.filter(d => d.hasValue).length;

  const label = intl.formatMessage({ id: 'DimensionsFilter.label' });
  const labelSelection = hasAnyInitialValues
    ? intl.formatMessage({ id: 'DimensionsFilter.labelSelected' }, { count: selectedCount })
    : '';

  // Create debounced submit handler for each dimension
  const debouncedHandlers = useRef({});
  const getDebouncedHandler = (queryParamName) => {
    if (!debouncedHandlers.current[queryParamName]) {
      debouncedHandlers.current[queryParamName] = debounce(
        values => {
          if (bypassDebounce.current[queryParamName]) {
            bypassDebounce.current[queryParamName] = false;
            return;
          }
          const formattedValue = formatToQueryParam(values, queryParamName);
          getHandleChangedValueFn(true)(formattedValue);
        },
        400,
        { leading: false, trailing: true }
      );
    }
    return debouncedHandlers.current[queryParamName];
  };

  const handleSubmit = formValues => {
    // Process each dimension's values
    dimensionsData.forEach(dimension => {
      const values = formValues?.[dimension.key];
      if (values && (values.minValue != null || values.maxValue != null)) {
        const handler = getDebouncedHandler(dimension.queryParamName);
        handler(values);
      }
    });
  };

  const handleClear = () => {
    // Bypass debounce for clear
    dimensionsData.forEach(d => {
      bypassDebounce.current[d.queryParamName] = true;
    });
    // Clear all dimension filters
    const clearedValues = dimensionsData.reduce((acc, d) => {
      acc[d.queryParamName] = null;
      return acc;
    }, {});
    getHandleChangedValueFn(true)(clearedValues);
  };

  // Build initial values object for the form (keyed by dimension key, not query param name)
  const formInitialValues = dimensionsData.reduce((acc, d) => {
    acc[d.key] = d.initialValue;
    return acc;
  }, {});

  const classes = classNames(css.root, className);

  return (
    <FilterPlain
      className={classes}
      label={label}
      labelSelection={labelSelection}
      labelSelectionSeparator=":"
      isSelected={hasAnyInitialValues}
      id={id}
      liveEdit
      onClear={handleClear}
      onSubmit={handleSubmit}
      initialValues={formInitialValues}
      {...rest}
    >
      <div className={css.dimensionsContainer}>
        {dimensionsData.map(dimension => (
          <DimensionRow
            key={dimension.key}
            dimensionKey={dimension.key}
            name={dimension.key}
            min={dimension.min}
            max={dimension.max}
            step={dimension.step}
            initialValues={formInitialValues}
            intl={intl}
          />
        ))}
      </div>
    </FilterPlain>
  );
};

export default DimensionsFilter;
export { DIMENSION_KEYS };
