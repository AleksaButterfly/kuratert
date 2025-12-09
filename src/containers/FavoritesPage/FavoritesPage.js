import { arrayOf, bool } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { getFavoriteListingIds } from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';

import { Page, LayoutSingleColumn, ListingCard, NamedLink } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import css from './FavoritesPage.module.css';

export const FavoritesPageComponent = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();

  const { currentUser, favoriteListings, scrollingDisabled, queryInProgress, queryError } = props;

  // If user is not authenticated, show not found page
  if (!currentUser?.id) {
    return <NotFoundPage />;
  }

  const hasListings = favoriteListings && favoriteListings.length > 0;
  const isLoading = queryInProgress;

  const title = intl.formatMessage({ id: 'FavoritesPage.title' });

  const schemaTitle = intl.formatMessage(
    { id: 'FavoritesPage.schemaTitle' },
    { marketplaceName: config.marketplaceName }
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
        '@type': 'WebPage',
        name: schemaTitle,
      }}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.content}>
          <div className={classNames(css.header, { [css.headerEmpty]: !hasListings })}>
            <h1 className={css.title}>
              <FormattedMessage id="FavoritesPage.heading" />
            </h1>
          </div>

          {queryError ? (
            <p className={css.error}>
              <FormattedMessage id="FavoritesPage.queryError" />
            </p>
          ) : isLoading ? (
            <p className={css.loading}>
              <FormattedMessage id="FavoritesPage.loading" />
            </p>
          ) : !hasListings ? (
            <div className={css.emptyState}>
              <p className={css.noResults}>
                <FormattedMessage id="FavoritesPage.noResults" />
              </p>
              <NamedLink name="SearchPage" className={css.browseLink}>
                <FormattedMessage id="FavoritesPage.browseListing" />
              </NamedLink>
            </div>
          ) : (
            <div className={css.listingCards}>
              {favoriteListings.map(listing => (
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

FavoritesPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  favoriteListings: arrayOf(propTypes.listing),
  scrollingDisabled: bool.isRequired,
  queryInProgress: bool.isRequired,
  queryError: propTypes.error,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { queryInProgress, queryError } = state.FavoritesPage;

  // Get favoriteListingIds directly from currentUser so it updates when favorites change
  const favoriteListingIds = getFavoriteListingIds(currentUser);

  // Convert string IDs to UUID-like objects for getListingsById
  const listingIds = favoriteListingIds.map(id => ({ uuid: id }));
  const favoriteListings = getListingsById(state, listingIds);

  return {
    currentUser,
    favoriteListings,
    scrollingDisabled: isScrollingDisabled(state),
    queryInProgress,
    queryError,
  };
};

const FavoritesPage = compose(connect(mapStateToProps))(FavoritesPageComponent);

export default FavoritesPage;
