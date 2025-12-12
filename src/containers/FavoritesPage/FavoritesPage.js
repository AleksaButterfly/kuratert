import React, { useState } from 'react';
import { arrayOf, bool, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { getFavoriteListingIds } from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getListingsById, getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { pathByRouteName } from '../../util/routes';
import { types as sdkTypes } from '../../util/sdkLoader';

import {
  Page,
  LayoutSingleColumn,
  ListingCard,
  NamedLink,
  Avatar,
  IconSocialMediaFacebook,
  IconSocialMediaTwitter,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import css from './FavoritesPage.module.css';

const { UUID } = sdkTypes;

// Share icons
const IconLinkedIn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const IconEmail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconCopy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export const FavoritesPageComponent = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const [copied, setCopied] = useState(false);

  const {
    currentUser,
    user,
    userId,
    favoriteListings,
    scrollingDisabled,
    queryInProgress,
    queryError,
    userShowError,
  } = props;

  // Determine if viewing own favorites or someone else's
  const isOwnFavorites = !userId;
  const viewingUser = isOwnFavorites ? currentUser : user;

  // If viewing own favorites and not authenticated, show not found
  if (isOwnFavorites && !currentUser?.id) {
    return <NotFoundPage />;
  }

  // If viewing someone else's favorites and user not found
  if (!isOwnFavorites && userShowError) {
    return <NotFoundPage />;
  }

  const displayName = viewingUser?.attributes?.profile?.displayName || '';
  const hasListings = favoriteListings && favoriteListings.length > 0;
  const isLoading = queryInProgress;

  // Generate share URL for own favorites
  const shareUrl = isOwnFavorites && currentUser?.id
    ? `${config.marketplaceRootURL}${pathByRouteName('UserFavoritesPage', routeConfiguration, { id: currentUser.id.uuid })}`
    : typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const text = intl.formatMessage({ id: 'FavoritesPage.shareText' }, { name: displayName });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareEmail = () => {
    const subject = intl.formatMessage({ id: 'FavoritesPage.shareEmailSubject' }, { name: displayName });
    const body = intl.formatMessage({ id: 'FavoritesPage.shareEmailBody' }, { name: displayName, url: shareUrl });
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const title = isOwnFavorites
    ? intl.formatMessage({ id: 'FavoritesPage.title' })
    : intl.formatMessage({ id: 'FavoritesPage.titleOther' }, { name: displayName });

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
            {/* Show user info when viewing someone else's favorites */}
            {!isOwnFavorites && viewingUser && (
              <div className={css.userInfo}>
                <Avatar className={css.avatar} user={viewingUser} disableProfileLink />
                <NamedLink name="ProfilePage" params={{ id: viewingUser.id.uuid }} className={css.userLink}>
                  {displayName}
                </NamedLink>
              </div>
            )}

            <h1 className={css.title}>
              {isOwnFavorites ? (
                <FormattedMessage id="FavoritesPage.heading" />
              ) : (
                <FormattedMessage id="FavoritesPage.headingOther" values={{ name: displayName }} />
              )}
            </h1>

            {/* Share buttons - only show for own favorites */}
            {isOwnFavorites && currentUser?.id && (
              <div className={css.shareSection}>
                <span className={css.shareLabel}>
                  <FormattedMessage id="FavoritesPage.shareLabel" />
                </span>
                <div className={css.shareButtons}>
                  <button className={css.shareButton} onClick={handleCopyLink} title={intl.formatMessage({ id: 'FavoritesPage.copyLink' })}>
                    {copied ? <IconCheck /> : <IconCopy />}
                  </button>
                  <button className={css.shareButton} onClick={handleShareFacebook} title="Facebook">
                    <IconSocialMediaFacebook />
                  </button>
                  <button className={css.shareButton} onClick={handleShareTwitter} title="X (Twitter)">
                    <IconSocialMediaTwitter />
                  </button>
                  <button className={css.shareButton} onClick={handleShareLinkedIn} title="LinkedIn">
                    <IconLinkedIn />
                  </button>
                  <button className={css.shareButton} onClick={handleShareEmail} title="Email">
                    <IconEmail />
                  </button>
                </div>
              </div>
            )}
          </div>

          {queryError || userShowError ? (
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
                {isOwnFavorites ? (
                  <FormattedMessage id="FavoritesPage.noResults" />
                ) : (
                  <FormattedMessage id="FavoritesPage.noResultsOther" values={{ name: displayName }} />
                )}
              </p>
              {isOwnFavorites && (
                <NamedLink name="SearchPage" className={css.browseLink}>
                  <FormattedMessage id="FavoritesPage.browseListing" />
                </NamedLink>
              )}
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
  user: propTypes.user,
  userId: string,
  favoriteListings: arrayOf(propTypes.listing),
  scrollingDisabled: bool.isRequired,
  queryInProgress: bool.isRequired,
  queryError: propTypes.error,
  userShowError: propTypes.error,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { queryInProgress, queryError, userId, userShowError } = state.FavoritesPage;

  // Get the user being viewed (for shared favorites)
  let user = null;
  let favoriteListings = [];

  if (userId) {
    // Viewing someone else's favorites
    const userRef = { id: new UUID(userId), type: 'user' };
    const entities = getMarketplaceEntities(state, [userRef]);
    user = entities.length > 0 ? entities[0] : null;

    // Get favorites from the fetched user's publicData
    const favoriteListingIds = getFavoriteListingIds(user);
    const listingIds = favoriteListingIds.map(id => ({ uuid: id }));
    favoriteListings = getListingsById(state, listingIds);
  } else {
    // Viewing own favorites
    const favoriteListingIds = getFavoriteListingIds(currentUser);
    const listingIds = favoriteListingIds.map(id => ({ uuid: id }));
    favoriteListings = getListingsById(state, listingIds);
  }

  return {
    currentUser,
    user,
    userId,
    favoriteListings,
    scrollingDisabled: isScrollingDisabled(state),
    queryInProgress,
    queryError,
    userShowError,
  };
};

const FavoritesPage = compose(connect(mapStateToProps))(FavoritesPageComponent);

export default FavoritesPage;
