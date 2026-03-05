import React from 'react';

import { FormattedMessage } from '../../util/reactIntl';
import { isFieldForListingType } from '../../util/fieldHelpers';

import { Heading } from '../../components';

import css from './ListingPage.module.css';

const SectionDetailsMaybe = props => {
  const { publicData, metadata = {}, listingFieldConfigs, isFieldForCategory, intl } = props;

  if (!publicData || !listingFieldConfigs) {
    return null;
  }

  const pickListingFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, showConfig = {} } = config;
    const listingType = publicData.listingType;
    const isTargetListingType = isFieldForListingType(listingType, config);
    const isTargetCategory = isFieldForCategory(config);

    const { isDetail, label } = showConfig;
    const publicDataValue = publicData[key];
    const metadataValue = metadata[key];
    const value = typeof publicDataValue != null ? publicDataValue : metadataValue;

    if (isDetail && isTargetListingType && isTargetCategory && typeof value !== 'undefined') {
      const findSelectedOption = enumValue => enumOptions?.find(o => enumValue === `${o.option}`);
      const getBooleanMessage = value =>
        value
          ? intl.formatMessage({ id: 'SearchPage.detailYes' })
          : intl.formatMessage({ id: 'SearchPage.detailNo' });
      const optionConfig = findSelectedOption(value);

      // Handle multi-enum - value is an array, convert to comma-separated labels
      const getMultiEnumLabels = (values) => {
        if (!Array.isArray(values)) return values;
        return values
          .map(v => {
            const option = enumOptions?.find(o => v === `${o.option}`);
            return option?.label || v;
          })
          .join(', ');
      };

      return schemaType === 'enum'
        ? filteredConfigs.concat({ key, value: optionConfig?.label, label })
        : schemaType === 'multi-enum'
        ? filteredConfigs.concat({ key, value: getMultiEnumLabels(value), label })
        : schemaType === 'boolean'
        ? filteredConfigs.concat({ key, value: getBooleanMessage(value), label })
        : schemaType === 'long'
        ? filteredConfigs.concat({ key, value, label })
        : schemaType === 'text'
        ? filteredConfigs.concat({ key, value, label })
        : filteredConfigs;
    }
    return filteredConfigs;
  };

  const existingListingFields = listingFieldConfigs.reduce(pickListingFields, []);

  return existingListingFields.length > 0 ? (
    <section className={css.sectionDetails}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="ListingPage.detailsTitle" />
      </Heading>
      <ul className={css.details}>
        {existingListingFields.map(detail => (
          <li key={detail.key} className={css.detailsRow}>
            <span className={css.detailLabel}>{detail.label}</span>
            <span>{detail.value}</span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;
};

export default SectionDetailsMaybe;
