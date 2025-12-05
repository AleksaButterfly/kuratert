import React from 'react';
import { bool, func, string } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';
import { InlineTextButton } from '../../components';

import IconFavorite from '../IconFavorite/IconFavorite';
import IconFavoriteFilled from './IconFavoriteFilled';

import css from './ButtonFavorite.module.css';

const ButtonFavorite = props => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    listingId,
    isFavorite,
    isAuthenticated,
    onToggleFavorite,
    addInProgress,
    removeInProgress,
  } = props;

  const classes = classNames(rootClassName || css.root, className, {
    [css.favorited]: isFavorite,
  });
  const isInProgress = addInProgress || removeInProgress;

  const handleClick = e => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login page
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const signupURL = `/signup?from=${encodeURIComponent(currentPath)}`;
      if (typeof window !== 'undefined') {
        window.location.href = signupURL;
      }
      return;
    }

    if (!isInProgress) {
      onToggleFavorite(listingId, isFavorite);
    }
  };

  const icon = isInProgress ? (
    <div className={css.spinner}>
      <svg className={css.spinnerIcon} viewBox="0 0 24 24">
        <circle className={css.spinnerPath} cx="12" cy="12" r="10" fill="none" strokeWidth="2" />
      </svg>
    </div>
  ) : isFavorite ? (
    <IconFavoriteFilled className={css.icon} />
  ) : (
    <IconFavorite className={css.icon} />
  );

  const ariaLabel = intl.formatMessage({
    id: isFavorite ? 'ButtonFavorite.removeFromFavorites' : 'ButtonFavorite.addToFavorites',
  });

  return (
    <InlineTextButton
      className={classes}
      onClick={handleClick}
      disabled={isInProgress}
      aria-label={ariaLabel}
    >
      {icon}
    </InlineTextButton>
  );
};

ButtonFavorite.propTypes = {
  className: string,
  rootClassName: string,
  listingId: string.isRequired,
  isFavorite: bool,
  isAuthenticated: bool,
  onToggleFavorite: func.isRequired,
  addInProgress: bool,
  removeInProgress: bool,
};

export default ButtonFavorite;
