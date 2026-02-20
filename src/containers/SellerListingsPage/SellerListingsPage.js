import React from 'react';
import { arrayOf, bool, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';

import {
  Page,
  LayoutSingleColumn,
  ListingCard,
  NamedLink,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './SellerListingsPage.module.css';

export const SellerListingsPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();

  const {
    sellerName,
    listings,
    scrollingDisabled,
    queryInProgress,
    queryError,
  } = props;

  const displayName = sellerName ? decodeURIComponent(sellerName) : '';
  const hasListings = listings && listings.length > 0;
  const isLoading = queryInProgress;
  const listingCount = listings?.length || 0;

  const title = intl.formatMessage(
    { id: 'SellerListingsPage.title' },
    { sellerName: displayName }
  );

  const schemaTitle = intl.formatMessage(
    { id: 'SellerListingsPage.schemaTitle' },
    { sellerName: displayName, marketplaceName: config.marketplaceName }
  );

  const cardRenderSizes = [
    '(max-width: 549px) 100vw',
    '(max-width: 767px) 50vw',
    '(max-width: 1023px) 33vw',
    '(max-width: 1920px) 25vw',
    '20vw',
  ].join(', ');

  return (
    <Page
      className={css.root}
      title={title}
      scrollingDisabled={scrollingDisabled}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'CollectionPage',
        name: schemaTitle,
      }}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.content}>
          <div className={hasListings ? css.header : `${css.header} ${css.headerEmpty}`}>
            <div className={css.titleRow}>
              <h1 className={css.title}>{displayName}</h1>
            </div>
          </div>

          {queryError ? (
            <p className={css.error}>
              <FormattedMessage id="SellerListingsPage.queryError" />
            </p>
          ) : isLoading ? (
            <p className={css.loading}>
              <FormattedMessage id="SellerListingsPage.loading" />
            </p>
          ) : !hasListings ? (
            <div className={css.emptyState}>
              <p className={css.noResults}>
                <FormattedMessage
                  id="SellerListingsPage.noResults"
                  values={{ sellerName: displayName }}
                />
              </p>
              <NamedLink name="SearchPage" className={css.browseLink}>
                <FormattedMessage id="SellerListingsPage.browseAll" />
              </NamedLink>
            </div>
          ) : (
            <div className={css.listingCards}>
              {listings.map(listing => (
                <ListingCard
                  key={listing.id.uuid}
                  listing={listing}
                  renderSizes={cardRenderSizes}
                  showAuthorInfo={false}
                />
              ))}
            </div>
          )}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

SellerListingsPageComponent.propTypes = {
  sellerName: string,
  listings: arrayOf(propTypes.listing),
  scrollingDisabled: bool.isRequired,
  queryInProgress: bool.isRequired,
  queryError: propTypes.error,
};

const mapStateToProps = state => {
  const { queryInProgress, queryError, listingIds, sellerName } = state.SellerListingsPage;

  // Get listings from marketplace data
  const listings = getListingsById(state, listingIds);

  return {
    sellerName,
    listings,
    scrollingDisabled: isScrollingDisabled(state),
    queryInProgress,
    queryError,
  };
};

const SellerListingsPage = compose(connect(mapStateToProps))(SellerListingsPageComponent);

export default SellerListingsPage;
