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
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { getListingsById, getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { pathByRouteName } from '../../util/routes';
import { types as sdkTypes } from '../../util/sdkLoader';

import {
  Page,
  LayoutSingleColumn,
  ListingCard,
  NamedLink,
  Avatar,
  Modal,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import css from './FavoritesPage.module.css';

const { UUID } = sdkTypes;

// Icons
const IconShare = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.667 8.667V12.667C12.667 13.02 12.526 13.359 12.276 13.609C12.026 13.859 11.687 14 11.333 14H3.333C2.98 14 2.64 13.859 2.39 13.609C2.14 13.359 2 13.02 2 12.667V4.667C2 4.313 2.14 3.974 2.39 3.724C2.64 3.474 2.98 3.333 3.333 3.333H7.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M6.667 9.333L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M11 5V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.0084 4.92548 17.3425 8.75 17.9V12.3125H6.71875V10H8.75V8.2375C8.75 6.2325 9.94438 5.125 11.7717 5.125C12.6467 5.125 13.5625 5.28125 13.5625 5.28125V7.25H12.5533C11.56 7.25 11.25 7.86667 11.25 8.5V10H13.4688L13.1146 12.3125H11.25V17.9C15.0745 17.3425 18 14.0084 18 10Z" fill="currentColor"/>
  </svg>
);

const IconTwitter = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.2719 3H17.6831L12.4106 9.01244L18.5 17H13.6788L10.0381 12.2018L5.88438 17H3.47188L9.10312 10.5706L3.25 3H8.19375L11.4775 7.37562L15.2719 3ZM14.3869 15.5019H15.6781L7.43 4.32312H6.04563L14.3869 15.5019Z" fill="currentColor"/>
  </svg>
);

const IconLinkedIn = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.0391 17.0391H14.0773V12.6016C14.0773 11.5449 14.0578 10.1836 12.5352 10.1836C10.9922 10.1836 10.7559 11.3242 10.7559 12.5195V17.0391H7.79297V7.5H10.6367V8.73438H10.6758C11.0742 7.98047 12.043 7.18359 13.4844 7.18359C16.4883 7.18359 17.0391 9.16016 17.0391 11.7227V17.0391ZM4.45312 6.26172C3.49609 6.26172 2.72656 5.48828 2.72656 4.53516C2.72656 3.58203 3.49609 2.80859 4.45312 2.80859C5.40625 2.80859 6.17969 3.58203 6.17969 4.53516C6.17969 5.48828 5.40625 6.26172 4.45312 6.26172ZM5.9375 17.0391H2.96875V7.5H5.9375V17.0391ZM18.5234 0H1.47656C0.660156 0 0 0.644531 0 1.44141V18.5586C0 19.3555 0.660156 20 1.47656 20H18.5195C19.3359 20 20 19.3555 20 18.5586V1.44141C20 0.644531 19.3359 0 18.5195 0H18.5234Z" fill="currentColor"/>
  </svg>
);

const IconEmail = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 3.33334H16.6667C17.5833 3.33334 18.3333 4.08334 18.3333 5.00001V15C18.3333 15.9167 17.5833 16.6667 16.6667 16.6667H3.33333C2.41667 16.6667 1.66667 15.9167 1.66667 15V5.00001C1.66667 4.08334 2.41667 3.33334 3.33333 3.33334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M18.3333 5L10 10.8333L1.66667 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const FavoritesPageComponent = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
    onManageDisableScrolling,
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

  // Show share button only for own favorites and when there are listings
  const showShareButton = isOwnFavorites && currentUser?.id && hasListings;

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

            <div className={css.titleRow}>
              <h1 className={css.title}>
                {isOwnFavorites ? (
                  <FormattedMessage id="FavoritesPage.heading" />
                ) : (
                  <FormattedMessage id="FavoritesPage.headingOther" values={{ name: displayName }} />
                )}
              </h1>

              {/* Share button - only show for own favorites with listings */}
              {showShareButton && (
                <button
                  className={css.shareButton}
                  onClick={() => setIsShareModalOpen(true)}
                  title={intl.formatMessage({ id: 'FavoritesPage.share' })}
                >
                  <IconShare />
                </button>
              )}
            </div>
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

      {/* Share Modal */}
      <Modal
        id="FavoritesPage.shareModal"
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <div className={css.modalContent}>
          <h2 className={css.modalTitle}>
            <FormattedMessage id="FavoritesPage.shareModalTitle" />
          </h2>

          {/* Copy link section */}
          <div className={css.copyLinkSection}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className={css.copyLinkInput}
            />
            <button
              className={css.copyLinkButton}
              onClick={handleCopyLink}
            >
              {copied ? <IconCheck /> : <IconCopy />}
              <span>{copied ? intl.formatMessage({ id: 'FavoritesPage.copied' }) : intl.formatMessage({ id: 'FavoritesPage.copyLink' })}</span>
            </button>
          </div>

          {/* Social share buttons */}
          <div className={css.socialShareSection}>
            <p className={css.socialShareLabel}>
              <FormattedMessage id="FavoritesPage.shareOn" />
            </p>
            <div className={css.socialButtons}>
              <button className={css.socialButton} onClick={handleShareFacebook} title="Facebook">
                <IconFacebook />
              </button>
              <button className={css.socialButton} onClick={handleShareTwitter} title="X (Twitter)">
                <IconTwitter />
              </button>
              <button className={css.socialButton} onClick={handleShareLinkedIn} title="LinkedIn">
                <IconLinkedIn />
              </button>
              <button className={css.socialButton} onClick={handleShareEmail} title="Email">
                <IconEmail />
              </button>
            </div>
          </div>
        </div>
      </Modal>
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

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const FavoritesPage = compose(connect(mapStateToProps, mapDispatchToProps))(FavoritesPageComponent);

export default FavoritesPage;
