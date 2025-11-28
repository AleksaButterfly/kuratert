import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import {
  ExternalLink,
  IconArrowHead,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  NamedLink,
} from '../../../../../components';

import css from './LinksMenu.module.css';

/**
 * Link components to be shown inside the dropdown.
 */
const LinkComponent = ({ linkConfig, currentPage }) => {
  const { text, type, href, route } = linkConfig;
  const getCurrentPageClass = page => {
    const hasPageName = name => currentPage?.indexOf(name) === 0;
    const isCMSPage = pageId => hasPageName('CMSPage') && currentPage === `${page}:${pageId}`;
    const isInboxPage = tab => hasPageName('InboxPage') && currentPage === `${page}:${tab}`;
    const isCurrentPage = currentPage === page;
    return isCMSPage(route?.params?.pageId) || isInboxPage(route?.params?.tab) || isCurrentPage
      ? css.currentPage
      : null;
  };

  if (type === 'internal' && route) {
    const { name, params, to } = route || {};
    const className = classNames(css.menuLink, getCurrentPageClass(name));
    return (
      <NamedLink name={name} params={params} to={to} className={className}>
        <span className={css.menuItemBorder} />
        {text}
      </NamedLink>
    );
  }
  return (
    <ExternalLink href={href} className={css.menuLink}>
      <span className={css.menuItemBorder} />
      {text}
    </ExternalLink>
  );
};

/**
 * When the links menu shows "More" label, the label width needs to be measured.
 */
const MeasureMoreMenu = props => {
  const moreMenuRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const { width, setWidth, label } = props;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && moreMenuRef.current && !width) {
      setWidth(moreMenuRef.current.offsetWidth);
    }
  }, [mounted, moreMenuRef, width]);

  const styleWrapper = !!width
    ? {}
    : {
        style: {
          position: 'absolute',
          top: '-2000px',
          left: '-2000px',
          width: 'auto',
          height: 'var(--topbarHeightDesktop)',
          display: 'flex',
          flexDirection: 'row',
        },
      };

  return !width && mounted
    ? ReactDOM.createPortal(
        <div
          id="measureMoreLabel"
          className={css.linkMenuLabel}
          ref={moreMenuRef}
          {...styleWrapper}
        >
          {label}
        </div>,
        document.body
      )
    : null;
};

/**
 * Menu label has text (Menu vs More) and arrow
 */
const MenuLabelContent = ({ showMoreLabel, isOpen, intl }) => {
  const menuLabel = showMoreLabel
    ? intl.formatMessage({ id: 'TopbarDesktop.LinksMenu.more' })
    : intl.formatMessage({ id: 'TopbarDesktop.LinksMenu.all' });
  return (
    <span className={css.linkMenuLabelWrapper}>
      {menuLabel}
      <IconArrowHead
        direction="down"
        size="small"
        rootClassName={css.arrowIcon}
        ariaLabel={menuLabel}
      />
    </span>
  );
};

/**
 * Menu that shows custom links with label showing either "Menu" or "More".
 */
const LinksMenu = props => {
  const [isOpen, setIsOpen] = useState(false);
  const { id, currentPage, links, showMoreLabel, moreLabelWidth, setMoreLabelWidth, intl } = props;
  const contentPlacementOffset = moreLabelWidth ? -1 * (moreLabelWidth / 2) : 24;
  return (
    <>
      <Menu
        id={id}
        contentPlacementOffset={contentPlacementOffset}
        contentPosition="left"
        isOpen={isOpen}
        onToggleActive={setIsOpen}
      >
        <MenuLabel className={css.linkMenuLabel} isOpenClassName={css.linkMenuIsOpen}>
          <MenuLabelContent showMoreLabel={showMoreLabel} isOpen={isOpen} intl={intl} />
        </MenuLabel>
        <MenuContent className={css.linkMenuContent}>
          {links.map((linkConfig, index) => {
            return (
              <MenuItem key={`${linkConfig.text}_${index}`}>
                <LinkComponent linkConfig={linkConfig} currentPage={currentPage} />
              </MenuItem>
            );
          })}
        </MenuContent>
      </Menu>
      <MeasureMoreMenu
        width={moreLabelWidth}
        setWidth={setMoreLabelWidth}
        label={<MenuLabelContent showMoreLabel={true} intl={intl} />}
      />
    </>
  );
};

export default LinksMenu;
