import React from 'react';
import { string, array, bool, number, func } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { ListingCard } from '../../../components';

import css from './SectionListings.module.css';

const SectionListings = props => {
  const intl = useIntl();
  const {
    rootClassName,
    className,
    listings,
    isLoading,
    totalItems,
    onLoadMore,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const sectionTitle = intl.formatMessage({ id: 'SectionListings.title' });
  const sectionSubtitle = intl.formatMessage({ id: 'SectionListings.subtitle' });
  const loadMoreText = intl.formatMessage({ id: 'SectionListings.loadMore' });

  if (!listings || listings.length === 0) {
    return null;
  }

  const hasMoreListings = totalItems > listings.length;

  return (
    <section className={classes}>
      <div className={css.sectionContent}>
        <div className={css.sectionHeader}>
          <h2 className={css.sectionTitle}>{sectionTitle}</h2>
          <p className={css.sectionSubtitle}>{sectionSubtitle}</p>
        </div>

        <div className={css.listingsGrid}>
          {listings.map(listing => (
            <ListingCard
              key={listing.id.uuid}
              className={css.listingCard}
              listing={listing}
              showAuthorInfo={true}
            />
          ))}
        </div>

        {hasMoreListings && (
          <div className={css.loadMoreWrapper}>
            <button
              className={css.loadMoreButton}
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? intl.formatMessage({ id: 'SectionListings.loading' }) : loadMoreText}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

SectionListings.propTypes = {
  rootClassName: string,
  className: string,
  listings: array,
  isLoading: bool,
  totalItems: number,
  onLoadMore: func,
};

export default SectionListings;
