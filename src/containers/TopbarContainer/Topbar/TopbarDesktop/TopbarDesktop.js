import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
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
} from '../../../../components';

import CategoryLinks from './CategoryLinks/CategoryLinks';
import CustomLinksMenu from './CustomLinksMenu/CustomLinksMenu';

import css from './TopbarDesktop.module.css';

const SearchLink = ({ intl }) => {
  return (
    <NamedLink
      name="SearchPage"
      className={css.topbarLink}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.search' })}
    >
      <span className={css.topbarLinkLabel}>
        <IconSearch />
      </span>
    </NamedLink>
  );
};

const FavoritesLink = ({ intl }) => {
  return (
    <NamedLink
      name="LandingPage"
      className={css.topbarLink}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.favorites' })}
    >
      <span className={css.topbarLinkLabel}>
        <IconFavorites />
      </span>
    </NamedLink>
  );
};

const CartLink = ({ intl }) => {
  return (
    <NamedLink
      name="LandingPage"
      className={css.topbarLink}
      aria-label={intl.formatMessage({ id: 'TopbarDesktop.cart' })}
    >
      <span className={css.topbarLinkLabel}>
        <IconCart />
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

const ProfileMenu = ({ currentPage, currentUser, onLogout, showManageListingsLink, intl }) => {
  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  return (
    <Menu ariaLabel={intl.formatMessage({ id: 'TopbarDesktop.screenreader.profileMenu' })}>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <Avatar className={css.avatar} user={currentUser} disableProfileLink />
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
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
    onLogout,
    showCreateListingsLink,
    showSearchForm,
  } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const marketplaceName = config.marketplaceName;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;

  const classes = classNames(rootClassName || css.root, className);

  // Search link is conditionally shown based on Console settings
  const searchLink = showSearchForm ? <SearchLink intl={intl} /> : null;
  const favoritesLink = <FavoritesLink intl={intl} />;
  const cartLink = <CartLink intl={intl} />;

  const profileMenuMaybe = authenticatedOnClientSide ? (
    <ProfileMenu
      currentPage={currentPage}
      currentUser={currentUser}
      onLogout={onLogout}
      showManageListingsLink={showCreateListingsLink}
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

      <CategoryLinks className={css.categoryLinks} />

      <div className={css.navItems}>
        <CustomLinksMenu
          currentPage={currentPage}
          customLinks={customLinks}
          intl={intl}
          hasClientSideContentReady={authenticatedOnClientSide || !isAuthenticatedOrJustHydrated}
          showCreateListingsLink={showCreateListingsLink}
        />
        {searchLink}
        {favoritesLink}
        {profileMenuMaybe}
        {signupLinkMaybe}
        {cartLink}
      </div>
    </nav>
  );
};

export default TopbarDesktop;
