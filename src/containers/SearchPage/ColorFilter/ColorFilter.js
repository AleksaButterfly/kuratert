import React from 'react';
import classNames from 'classnames';
import { Field } from 'react-final-form';

import { useIntl } from '../../../util/reactIntl';
import { parseSelectFilterOptions } from '../../../util/search';
import { SCHEMA_TYPE_MULTI_ENUM } from '../../../util/types';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import css from './ColorFilter.module.css';

// Special color values that need custom handling
const SPECIAL_COLORS = {
  multicolor: 'linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)',
};

// Get color value from option - uses option directly as CSS color
const getColorValue = option => {
  const normalizedOption = option?.toLowerCase().replace(/\s+/g, '');
  // Check for special colors first, otherwise use the option value directly as CSS color
  return SPECIAL_COLORS[normalizedOption] || option;
};

// Light colors that need dark checkmark
const LIGHT_COLORS = ['white', 'ivory', 'cream', 'beige', 'yellow', 'lime', 'mint', 'peach', 'lavender', 'silver', 'khaki', 'tan', 'pink', 'cyan', 'aqua', 'lightyellow', 'lightgreen', 'lightpink', 'lightblue', 'lightgray', 'lightgrey'];

// Check if color is light (for showing dark checkmark)
const isLightColor = colorValue => {
  if (colorValue?.startsWith('linear-gradient')) return true;
  const normalizedColor = colorValue?.toLowerCase().replace(/\s+/g, '');
  return LIGHT_COLORS.includes(normalizedColor);
};

// Checkmark icon component
const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" fill="none" />
  </svg>
);

// Color swatch field component
const ColorSwatchField = ({ id, name, option, label }) => {
  const colorValue = getColorValue(option);
  const isLight = isLightColor(option);
  const isWhite = option?.toLowerCase() === 'white';

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
                background: colorValue,
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
