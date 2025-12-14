import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';

import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';
import { FormattedMessage } from '../../../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { createResourceLocatorString } from '../../../../util/routes';
import { isMainSearchTypeKeywords } from '../../../../util/search';
import { supportedLanguages } from '../../../../util/translations';
import { getSearchPageResourceLocatorStringParams } from '../../../SearchPage/SearchPage.shared';
import {
  Avatar,
  InlineTextButton,
  LinkedLogo,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  NamedLink,
  IconCart,
  IconFavorites,
  IconSearch,
  IconUser,
  IconLanguage,
  LanguageModal,
} from '../../../../components';
import { getFavoriteListingIds } from '../../../../util/userHelpers';

import CategoryLinks from './CategoryLinks/CategoryLinks';
import CustomLinksMenu from './CustomLinksMenu/CustomLinksMenu';
import TopbarDesktopSearchForm from './TopbarDesktopSearchForm/TopbarDesktopSearchForm';

import css from './TopbarDesktop.module.css';

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SearchButton = ({ intl, isSearchOpen, onClick }) => {
  return (
    <button
      className={css.topbarLink}
      onClick={onClick}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.search' })}
    >
      <span className={css.topbarLinkLabel}>
        {isSearchOpen ? <IconClose /> : <IconSearch />}
      </span>
    </button>
  );
};

const FavoritesLink = ({ intl, count }) => {
  return (
    <NamedLink
      name="FavoritesPage"
      className={css.topbarLink}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.favorites' })}
    >
      <span className={css.topbarLinkLabel}>
        <IconFavorites />
        {count > 0 && <span className={css.favoritesBadge}>{count}</span>}
      </span>
    </NamedLink>
  );
};

const CartLink = ({ intl, count }) => {
  return (
    <NamedLink
      name="CartPage"
      className={css.topbarLink}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.cart' })}
    >
      <span className={css.topbarLinkLabel}>
        <IconCart />
        {count > 0 && <span className={css.cartBadge}>{count}</span>}
      </span>
    </NamedLink>
  );
};

const SignupLink = ({ intl }) => {
  return (
    <NamedLink
      name="SignupPage"
      className={css.topbarLink}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.signup' })}
    >
      <span className={css.topbarLinkLabel}>
        <IconUser />
      </span>
    </NamedLink>
  );
};

const LanguageButton = ({ intl, currentLanguage, onClick }) => {
  return (
    <button
      type="button"
      className={css.topbarLink}
      onClick={onClick}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.language' })}
    >
      <span className={css.topbarLinkLabel}>
        <IconLanguage className={css.languageIcon} />
      </span>
    </button>
  );
};

const ProfileMenu = ({ currentPage, currentUser, onLogout, showManageListingsLink, notificationCount, inboxTab, intl }) => {
  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    const isInboxPage = page === 'InboxPage' && currentPage === 'InboxPage';
    return currentPage === page || isAccountSettingsPage || isInboxPage ? css.currentPage : null;
  };

  return (
    <Menu ariaLabel={intl.formatMessage({ id: 'TopbarDesktop.screenreader.profileMenu' })}>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <span className={css.avatarWrapper}>
          <Avatar className={css.avatar} user={currentUser} disableProfileLink />
          {notificationCount > 0 && <span className={css.avatarNotificationDot} />}
        </span>
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        <MenuItem key="InboxPage">
          <NamedLink
            className={classNames(css.menuLink, css.inboxMenuLink, currentPageClass('InboxPage'))}
            name="InboxPage"
            params={{ tab: inboxTab }}
          >
            <span className={css.menuItemBorder} />
            <span className={css.inboxLinkContent}>
              <FormattedMessage id="TopbarDesktop.inboxLink" />
              {notificationCount > 0 && (
                <span className={css.inboxMenuBadge}>{notificationCount}</span>
              )}
            </span>
          </NamedLink>
        </MenuItem>
        {showManageListingsLink ? (
          <MenuItem key="ManageListingsPage">
            <NamedLink
              className={classNames(css.menuLink, currentPageClass('ManageListingsPage'))}
              name="ManageListingsPage"
            >
              <span className={css.menuItemBorder} />
              <FormattedMessage id="TopbarDesktop.yourListingsLink" />
            </NamedLink>
          </MenuItem>
        ) : null}
        <MenuItem key="ProfileSettingsPage">
          <NamedLink
            className={classNames(css.menuLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.profileSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="AccountSettingsPage">
          <NamedLink
            className={classNames(css.menuLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.accountSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="logout">
          <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.logout" />
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  );
};

/**
 * Topbar for desktop layout
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {CurrentUser} props.currentUser API entity
 * @param {string?} props.currentPage
 * @param {boolean} props.isAuthenticated
 * @param {number} props.notificationCount
 * @param {Function} props.onLogout
 * @param {Object} props.intl
 * @param {Object} props.config
 * @param {Array<Object>} props.customLinks
 * @param {boolean} props.showSearchForm
 * @param {boolean} props.showCreateListingsLink
 * @param {string} props.inboxTab
 * @returns {JSX.Element} topbar desktop component
 */
const TopbarDesktop = props => {
  const {
    className,
    config,
    customLinks,
    currentUser,
    currentPage,
    rootClassName,
    intl,
    isAuthenticated,
    notificationCount = 0,
    validCartItemCount = 0,
    onLogout,
    showCreateListingsLink,
    showSearchForm,
    inboxTab,
    languageModalOpen,
    onToggleLanguageModal,
    onManageDisableScrolling,
  } = props;
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const history = useHistory();
  const location = useLocation();
  const routeConfiguration = useRouteConfiguration();

  // Get current language for display
  const locale = config.localization?.locale || 'nb-NO';
  const currentLanguageCode = locale.startsWith('nb') || locale === 'no' ? 'no' : 'en';
  const currentLanguage = supportedLanguages.find(lang => lang.code === currentLanguageCode);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchSubmit = values => {
    const isKeywordsSearch = isMainSearchTypeKeywords(config);
    const { routeName, pathParams } = getSearchPageResourceLocatorStringParams(
      routeConfiguration,
      location
    );

    let searchParams = {};
    if (isKeywordsSearch) {
      searchParams = { keywords: values?.keywords };
    } else {
      const { search, selectedPlace } = values?.location || {};
      const { origin, bounds } = selectedPlace || {};
      searchParams = {
        ...(search ? { address: search } : {}),
        ...(origin ? { origin: `${origin.lat},${origin.lng}` } : {}),
        ...(bounds ? { bounds: `${bounds.ne.lat},${bounds.ne.lng},${bounds.sw.lat},${bounds.sw.lng}` } : {}),
      };
    }

    history.push(
      createResourceLocatorString(routeName, routeConfiguration, pathParams, searchParams)
    );
    setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const marketplaceName = config.marketplaceName;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;

  const classes = classNames(rootClassName || css.root, className);

  // Get favorites count from currentUser
  const favoritesCount = getFavoriteListingIds(currentUser).length;

  // Search button is conditionally shown based on Console settings
  const searchButton = showSearchForm ? (
    <SearchButton intl={intl} isSearchOpen={isSearchOpen} onClick={toggleSearch} />
  ) : null;
  const favoritesLink = <FavoritesLink intl={intl} count={favoritesCount} />;
  // Use validCartItemCount which only counts items with stock > 0
  const cartLink = <CartLink intl={intl} count={validCartItemCount} />;
  const languageButton = (
    <LanguageButton
      intl={intl}
      currentLanguage={currentLanguage}
      onClick={() => onToggleLanguageModal(true)}
    />
  );

  const profileMenuMaybe = authenticatedOnClientSide ? (
    <ProfileMenu
      currentPage={currentPage}
      currentUser={currentUser}
      onLogout={onLogout}
      showManageListingsLink={showCreateListingsLink}
      notificationCount={notificationCount}
      inboxTab={inboxTab}
      intl={intl}
    />
  ) : null;

  const signupLinkMaybe = isAuthenticatedOrJustHydrated ? null : <SignupLink intl={intl} />;

  return (
    <nav
      className={classes}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.screenreader.topbarNavigation' })}
    >
      <LinkedLogo
        className={css.logoLink}
        logoClassName={css.logo}
        layout="desktop"
        alt={intl.formatMessage({ id: 'TopbarDesktop.logo' }, { marketplaceName })}
        linkToExternalSite={config?.topbar?.logoLink}
      />

      {isSearchOpen ? (
        <TopbarDesktopSearchForm
          className={css.searchForm}
          onSubmit={handleSearchSubmit}
          appConfig={config}
        />
      ) : (
        <CategoryLinks className={css.categoryLinks} />
      )}

      <div className={css.navItems}>
        <CustomLinksMenu
          currentPage={currentPage}
          customLinks={customLinks}
          intl={intl}
          hasClientSideContentReady={authenticatedOnClientSide || !isAuthenticatedOrJustHydrated}
          showCreateListingsLink={showCreateListingsLink}
        />
        {languageButton}
        {searchButton}
        {favoritesLink}
        {cartLink}
        {profileMenuMaybe}
        {signupLinkMaybe}
      </div>

      {/* Language Modal */}
      <LanguageModal
        id="TopbarLanguageModal"
        isOpen={languageModalOpen}
        onCloseModal={() => onToggleLanguageModal(false)}
        onManageDisableScrolling={onManageDisableScrolling}
      />
    </nav>
  );
};

export default TopbarDesktop;
