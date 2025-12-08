import React from 'react';
import classNames from 'classnames';
import { Field } from 'react-final-form';

import { useIntl } from '../../../util/reactIntl';
import { parseSelectFilterOptions } from '../../../util/search';
import { SCHEMA_TYPE_MULTI_ENUM } from '../../../util/types';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import css from './ColorFilter.module.css';

// Map color option values to hex colors
const COLOR_MAP = {
  black: '#000000',
  white: '#FFFFFF',
  grey: '#808080',
  gray: '#808080',
  beige: '#D4C4B0',
  brown: '#8B5A3C',
  red: '#D0021B',
  orange: '#FF6B35',
  yellow: '#FFD700',
  gold: '#C9A961',
  green: '#7ED321',
  blue: '#4A90E2',
  purple: '#9013FE',
  pink: '#FF69B4',
  navy: '#001F3F',
  teal: '#008080',
  coral: '#FF7F50',
  maroon: '#800000',
  olive: '#808000',
  silver: '#C0C0C0',
  tan: '#D2B48C',
  cream: '#FFFDD0',
  ivory: '#FFFFF0',
  burgundy: '#800020',
  lavender: '#E6E6FA',
  mint: '#98FF98',
  peach: '#FFCBA4',
  turquoise: '#40E0D0',
  magenta: '#FF00FF',
  cyan: '#00FFFF',
  lime: '#00FF00',
  indigo: '#4B0082',
  violet: '#EE82EE',
  khaki: '#C3B091',
  multicolor: 'linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)',
};

// Get hex color from option value
const getColorHex = option => {
  const normalizedOption = option?.toLowerCase().replace(/\s+/g, '');
  return COLOR_MAP[normalizedOption] || '#CCCCCC';
};

// Check if color is light (for showing dark checkmark)
const isLightColor = hex => {
  if (hex.startsWith('linear-gradient')) return true;
  const color = hex.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

// Checkmark icon component
const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" fill="none" />
  </svg>
);

// Color swatch field component
const ColorSwatchField = ({ id, name, option, label }) => {
  const colorHex = getColorHex(option);
  const isLight = isLightColor(colorHex);
  const isWhite = option?.toLowerCase() === 'white';
  const isMulticolor = option?.toLowerCase() === 'multicolor';

  return (
    <Field name={name} type="checkbox" value={option}>
      {({ input }) => {
        const isSelected = input.checked;
        return (
          <label
            htmlFor={id}
            className={classNames(css.swatchLabel, {
              [css.selected]: isSelected,
              [css.whiteSwatch]: isWhite,
            })}
            title={label}
          >
            <input
              id={id}
              className={css.hiddenInput}
              type="checkbox"
              {...input}
            />
            <span
              className={css.swatch}
              style={{
                background: isMulticolor ? colorHex : colorHex,
              }}
            >
              {isSelected && (
                <CheckIcon className={classNames(css.checkIcon, { [css.darkCheck]: isLight })} />
              )}
            </span>
          </label>
        );
      }}
    </Field>
  );
};

// Group of color swatches
const GroupOfColorSwatches = props => {
  const { id, className, name, options } = props;
  return (
    <div className={classNames(css.swatchGroup, className)}>
      {options.map(optionConfig => {
        const { option, label } = optionConfig;
        const fieldId = `${id}.${option}`;
        return (
          <ColorSwatchField
            key={fieldId}
            id={fieldId}
            name={name}
            option={option}
            label={label}
          />
        );
      })}
    </div>
  );
};

const getQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;
};

// Format URI component's query param: { pub_key: 'has_all:a,b,c' }
const format = (selectedOptions, queryParamName, schemaType, searchMode) => {
  const hasOptionsSelected = selectedOptions && selectedOptions.length > 0;
  const mode = schemaType === SCHEMA_TYPE_MULTI_ENUM && searchMode ? `${searchMode}:` : '';
  const value = hasOptionsSelected ? `${mode}${selectedOptions.join(',')}` : null;
  return { [queryParamName]: value };
};

/**
 * ColorFilter component - renders color swatches instead of checkboxes
 */
const ColorFilter = props => {
  const intl = useIntl();
  const {
    rootClassName,
    className,
    id,
    name,
    label,
    getAriaLabel,
    options,
    initialValues,
    contentPlacementOffset = 0,
    onSubmit,
    queryParamNames,
    schemaType,
    searchMode,
    showAsPopup,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const queryParamName = getQueryParamName(queryParamNames);
  const hasInitialValues = !!initialValues && !!initialValues[queryParamName];
  const selectedOptions = hasInitialValues
    ? parseSelectFilterOptions(initialValues[queryParamName])
    : [];

  const labelForPopup = hasInitialValues
    ? intl.formatMessage(
        { id: 'SelectMultipleFilter.labelSelected' },
        { labelText: label, count: selectedOptions.length }
      )
    : label;

  const labelSelectionForPlain = hasInitialValues
    ? intl.formatMessage(
        { id: 'SelectMultipleFilterPlainForm.labelSelected' },
        { count: selectedOptions.length }
      )
    : '';

  const namedInitialValues = { [name]: selectedOptions };

  const handleSubmit = values => {
    const usedValue = values ? values[name] : values;
    onSubmit(format(usedValue, queryParamName, schemaType, searchMode));
  };

  return showAsPopup ? (
    <FilterPopup
      className={classes}
      rootClassName={rootClassName}
      popupClassName={css.popupSize}
      label={labelForPopup}
      ariaLabel={getAriaLabel(label, selectedOptions.join(', '))}
      isSelected={hasInitialValues}
      id={`${id}.popup`}
      showAsPopup
      contentPlacementOffset={contentPlacementOffset}
      onSubmit={handleSubmit}
      initialValues={namedInitialValues}
      keepDirtyOnReinitialize
      {...rest}
    >
      <GroupOfColorSwatches
        className={css.fieldGroup}
        name={name}
        id={`${id}-color-group`}
        options={options}
      />
    </FilterPopup>
  ) : (
    <FilterPlain
      className={className}
      rootClassName={rootClassName}
      label={label}
      labelSelection={labelSelectionForPlain}
      ariaLabel={getAriaLabel(label, selectedOptions.join(', '))}
      isSelected={hasInitialValues}
      id={`${id}.plain`}
      liveEdit
      onSubmit={handleSubmit}
      initialValues={namedInitialValues}
      {...rest}
    >
      <GroupOfColorSwatches
        className={css.fieldGroupPlain}
        name={name}
        id={`${id}-color-group`}
        options={options}
      />
    </FilterPlain>
  );
};

export default ColorFilter;
