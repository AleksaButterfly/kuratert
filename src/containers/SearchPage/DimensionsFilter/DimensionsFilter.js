import React, { useRef } from 'react';
import debounce from 'lodash/debounce';
import classNames from 'classnames';
import { Field } from 'react-final-form';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
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

// Convert query param to object
const convertQueryParamToObject = valueRange => {
  const [minValue, maxValue] = !!valueRange
    ? valueRange.split(',').map(v => Number.parseInt(v, RADIX))
    : [];
  return !!valueRange && minValue != null && maxValue != null ? { minValue, maxValue } : null;
};

// Format to query param
const formatToQueryParam = (range, queryParamName) => {
  const { minValue, maxValue } = range || {};
  const value = minValue != null && maxValue != null ? `${minValue},${maxValue}` : null;
  return { [queryParamName]: value };
};

// Get valid range values
const getValidRangeValues = (queryParamName, rangeParams, min, max) => {
  const parsedRangeValues = rangeParams?.[queryParamName]
    ? convertQueryParamToObject(rangeParams[queryParamName])
    : {};

  const { minValue, maxValue } = parsedRangeValues || {};
  const hasValidMinValue = minValue != null && minValue >= min;
  const hasValidMaxValue = maxValue != null && maxValue >= minValue && maxValue <= max;
  const hasRangeValues = rangeParams && hasValidMinValue && hasValidMaxValue;

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
    initialValues,
    getHandleChangedValueFn,
    className,
    id = 'DimensionsFilter',
    ...rest
  } = props;

  const bypassDebounce = useRef({});

  // Get query param names and initial values for each dimension
  const dimensionsData = dimensionConfigs.map(config => {
    const { key, scope, minimum = 0, maximum = 1000, step = 1 } = config;
    const queryParamName = constructQueryParamName(key, scope);
    const validValues = getValidRangeValues(
      queryParamName,
      initialValues,
      minimum,
      maximum
    );
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

  // Create debounced submit handler
  const createDebouncedHandler = (queryParamName, useHistoryPush) => {
    return debounce(
      values => {
        if (bypassDebounce.current[queryParamName]) {
          bypassDebounce.current[queryParamName] = false;
          return;
        }
        const formattedValue = formatToQueryParam(values, queryParamName);
        getHandleChangedValueFn(useHistoryPush)(formattedValue);
      },
      400,
      { leading: false, trailing: true }
    );
  };

  const handleSubmit = formValues => {
    // Process each dimension's values
    dimensionsData.forEach(dimension => {
      const values = formValues?.[dimension.key];
      if (values) {
        const handler = createDebouncedHandler(dimension.queryParamName, true);
        handler(values);
      }
    });
  };

  const handleClear = () => {
    // Clear all dimension filters
    const clearedValues = dimensionsData.reduce((acc, d) => {
      acc[d.queryParamName] = null;
      return acc;
    }, {});
    getHandleChangedValueFn(true)(clearedValues);
  };

  // Build initial values object for the form
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
