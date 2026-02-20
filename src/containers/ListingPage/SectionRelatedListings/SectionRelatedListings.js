import React from 'react';
import { arrayOf } from 'prop-types';

import { FormattedMessage } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { ListingCard } from '../../../components';

import css from './SectionRelatedListings.module.css';

const SectionRelatedListings = props => {
  const { listings } = props;

  if (!listings || listings.length === 0) {
    return null;
  }

  const cardRenderSizes = [
    '(max-width: 549px) 50vw',
    '(max-width: 767px) 50vw',
    '(max-width: 1023px) 33vw',
    '(max-width: 1920px) 25vw',
    '20vw',
  ].join(', ');

  return (
    <div className={css.root}>
      <h2 className={css.title}>
        <FormattedMessage id="SectionRelatedListings.title" />
      </h2>
      <div className={css.listingsGrid}>
        {listings.map(listing => (
          <ListingCard
            key={listing.id.uuid}
            listing={listing}
            renderSizes={cardRenderSizes}
            showAuthorInfo={false}
          />
        ))}
      </div>
    </div>
  );
};

SectionRelatedListings.propTypes = {
  listings: arrayOf(propTypes.listing),
};

export default SectionRelatedListings;
