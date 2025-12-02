import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  REVIEW_TYPE_OF_PROVIDER,
  REVIEW_TYPE_OF_CUSTOMER,
  propTypes,
} from '../../util/types';
import {
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
  PROFILE_PAGE_PENDING_APPROVAL_VARIANT,
} from '../../util/urlHelpers';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
  isNotFoundError,
} from '../../util/errors';
import {
  getCurrentUserTypeRoles,
  hasPermissionToViewData,
  isUserAuthorized,
} from '../../util/userHelpers';

import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  Page,
  ListingCard,
  Reviews,
  NamedRedirect,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import ProfileHero from './ProfileHero';
import css from './ProfilePage.module.css';

const MAX_MOBILE_SCREEN_WIDTH = 768;

// Tab constants
const TAB_LISTINGS = 'listings';
const TAB_REVIEWS_SELLER = 'reviews-seller';
const TAB_REVIEWS_BUYER = 'reviews-buyer';
const TAB_REVIEWS = 'reviews';

export const ReviewsErrorMaybe = props => {
  const { queryReviewsError } = props;
  return queryReviewsError ? (
    <p className={css.error}>
      <FormattedMessage id="ProfilePage.loadingReviewsFailed" />
    </p>
  ) : null;
};

export const MainContent = props => {
  const {
    user,
    userShowError,
    bio,
    displayName,
    listings,
    queryListingsError,
    reviews = [],
    queryReviewsError,
    intl,
    hideReviews,
    userTypeRoles,
    isCurrentUser,
    onManageDisableScrolling,
    userStats,
  } = props;

  const { provider: isSeller } = userTypeRoles;

  // For sellers: default to listings tab, for buyers: default to reviews tab
  const defaultTab = isSeller ? TAB_LISTINGS : TAB_REVIEWS;
  const [activeTab, setActiveTab] = useState(defaultTab);

  const reviewsOfProvider = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_PROVIDER);
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);

  if (userShowError || queryListingsError) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProfilePage.loadingDataFailed" />
      </p>
    );
  }

  // Build tabs based on user type
  const tabs = [];

  if (isSeller) {
    // Seller tabs: Active Listings, Reviews as Seller, Reviews as Buyer
    tabs.push({
      id: TAB_LISTINGS,
      label: intl.formatMessage({ id: 'ProfilePage.tabActiveListings' }, { count: listings.length }),
    });
    tabs.push({
      id: TAB_REVIEWS_SELLER,
      label: intl.formatMessage({ id: 'ProfilePage.tabReviewsAsSeller' }, { count: reviewsOfProvider.length }),
    });
    tabs.push({
      id: TAB_REVIEWS_BUYER,
      label: intl.formatMessage({ id: 'ProfilePage.tabReviewsAsBuyer' }, { count: reviewsOfCustomer.length }),
    });
  } else {
    // Buyer tabs: just Reviews
    tabs.push({
      id: TAB_REVIEWS,
      label: intl.formatMessage({ id: 'ProfilePage.tabReviews' }, { count: reviewsOfCustomer.length }),
    });
  }

  return (
    <div className={css.mainContent}>
      {/* Profile Hero Section */}
      <ProfileHero
        user={user}
        bio={bio}
        displayName={displayName}
        isCurrentUser={isCurrentUser}
        listings={listings}
        reviews={reviews}
        onManageDisableScrolling={onManageDisableScrolling}
        isSeller={isSeller}
        userStats={userStats}
      />

      {/* Tabs Section for Sellers */}
      {isSeller && (
        <div className={css.tabsSection}>
          {/* Tab Navigation */}
          <div className={css.tabsNav}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={classNames(css.tab, { [css.tabActive]: activeTab === tab.id })}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={css.tabContent}>
            {/* Active Listings Tab */}
            {activeTab === TAB_LISTINGS && (
              <ul className={css.listings}>
                {listings.map(l => (
                  <li className={css.listing} key={l.id.uuid}>
                    <ListingCard listing={l} showAuthorInfo={false} />
                  </li>
                ))}
                {listings.length === 0 && (
                  <p className={css.noContent}>
                    <FormattedMessage id="ProfilePage.noListings" />
                  </p>
                )}
              </ul>
            )}

            {/* Reviews as Seller Tab */}
            {activeTab === TAB_REVIEWS_SELLER && !hideReviews && (
              <div className={css.reviewsContent}>
                <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
                {reviewsOfProvider.length > 0 ? (
                  <Reviews reviews={reviewsOfProvider} />
                ) : (
                  <p className={css.noContent}>
                    <FormattedMessage id="ProfilePage.noReviewsAsSeller" />
                  </p>
                )}
              </div>
            )}

            {/* Reviews as Buyer Tab */}
            {activeTab === TAB_REVIEWS_BUYER && !hideReviews && (
              <div className={css.reviewsContent}>
                <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
                {reviewsOfCustomer.length > 0 ? (
                  <Reviews reviews={reviewsOfCustomer} />
                ) : (
                  <p className={css.noContent}>
                    <FormattedMessage id="ProfilePage.noReviewsAsBuyer" />
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Section for Buyers (no tabs, just section title) */}
      {!isSeller && !hideReviews && (
        <div className={css.buyerReviewsSection}>
          <h2 className={css.sectionTitle}>
            <FormattedMessage id="ProfilePage.tabReviews" values={{ count: reviewsOfCustomer.length }} />
          </h2>
          <div className={css.reviewsContent}>
            <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
            {reviewsOfCustomer.length > 0 ? (
              <Reviews reviews={reviewsOfCustomer} />
            ) : (
              <p className={css.noContent}>
                <FormattedMessage id="ProfilePage.noReviews" />
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ProfilePageComponent
 */
export const ProfilePageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    scrollingDisabled,
    params: pathParams,
    currentUser,
    useCurrentUser,
    userShowError,
    user,
    onManageDisableScrolling,
    ...rest
  } = props;
  const isVariant = pathParams.variant?.length > 0;
  const isPreview = isVariant && pathParams.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;

  // Stripe's onboarding needs a business URL for each seller
  const searchParams = rest?.location?.search;
  const isStorefront = searchParams
    ? new URLSearchParams(searchParams)?.get('mode') === 'storefront'
    : false;
  if (isStorefront) {
    return <NamedRedirect name="LandingPage" />;
  }

  const isCurrentUser = currentUser?.id && currentUser?.id?.uuid === pathParams.id;
  const profileUser = useCurrentUser ? currentUser : user;
  const { bio, displayName } = profileUser?.attributes?.profile || {};
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const isUnauthorizedOnPrivateMarketplace = isPrivateMarketplace && isUnauthorizedUser;
  const hasUserPendingApprovalError = isErrorUserPendingApproval(userShowError);
  const hasNoViewingRightsUser = currentUser && !hasPermissionToViewData(currentUser);
  const hasNoViewingRightsOnPrivateMarketplace = isPrivateMarketplace && hasNoViewingRightsUser;

  const userTypeRoles = getCurrentUserTypeRoles(config, profileUser);

  const isDataLoaded = isPreview
    ? currentUser != null || userShowError != null
    : hasNoViewingRightsOnPrivateMarketplace
    ? currentUser != null || userShowError != null
    : user != null || userShowError != null;

  const schemaTitleVars = { name: displayName, marketplaceName: config.marketplaceName };
  const schemaTitle = intl.formatMessage({ id: 'ProfilePage.schemaTitle' }, schemaTitleVars);

  if (!isDataLoaded) {
    return null;
  } else if (!isPreview && isNotFoundError(userShowError)) {
    return <NotFoundPage staticContext={props.staticContext} />;
  } else if (!isPreview && (isUnauthorizedOnPrivateMarketplace || hasUserPendingApprovalError)) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (
    (!isPreview && hasNoViewingRightsOnPrivateMarketplace && !isCurrentUser) ||
    isErrorNoViewingPermission(userShowError)
  ) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  } else if (!isPreview && isForbiddenError(userShowError)) {
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  } else if (isPreview && mounted && !isCurrentUser) {
    return isCurrentUser === false ? (
      <NamedRedirect name="ProfilePage" params={{ id: currentUser?.id?.uuid }} />
    ) : null;
  } else if ((isPreview || isPrivateMarketplace) && !mounted) {
    return null;
  }

  return (
    <Page
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: profileUser?.attributes?.profile?.displayName,
        },
        name: schemaTitle,
      }}
    >
      <TopbarContainer />
      <div className={css.pageContent}>
        <MainContent
          user={profileUser}
          bio={bio}
          displayName={displayName}
          userShowError={userShowError}
          hideReviews={hasNoViewingRightsOnPrivateMarketplace}
          intl={intl}
          userTypeRoles={userTypeRoles}
          isCurrentUser={mounted && isCurrentUser}
          onManageDisableScrolling={onManageDisableScrolling}
          {...rest}
        />
      </div>
      <FooterContainer />
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    userId,
    userShowError,
    queryListingsError,
    userListingRefs,
    reviews = [],
    queryReviewsError,
    userStats,
  } = state.ProfilePage;
  const userMatches = getMarketplaceEntities(state, [{ type: 'user', id: userId }]);
  const user = userMatches.length === 1 ? userMatches[0] : null;

  const isCurrentUser = userId?.uuid === currentUser?.id?.uuid;
  const useCurrentUser =
    isCurrentUser && !(isUserAuthorized(currentUser) && hasPermissionToViewData(currentUser));

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    useCurrentUser,
    user,
    userShowError,
    queryListingsError,
    listings: getMarketplaceEntities(state, userListingRefs),
    reviews,
    queryReviewsError,
    userStats,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const ProfilePage = compose(connect(mapStateToProps, mapDispatchToProps))(ProfilePageComponent);

export default ProfilePage;
