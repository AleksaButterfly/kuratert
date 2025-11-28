import React from 'react';
import classNames from 'classnames';

import css from './IconFavorites.module.css';

/**
 * Heart/Favorites icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconFavorites = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      fill="none"
      viewBox="0 0 20 20"
    >
      <g clipPath="url(#favorites-clip)">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.667}
          d="M1.667 7.917a4.583 4.583 0 0 1 7.992-3.064.467.467 0 0 0 .682 0 4.575 4.575 0 0 1 7.992 3.064c0 1.908-1.25 3.333-2.5 4.583l-4.576 4.427a1.668 1.668 0 0 1-2.5.016L4.167 12.5c-1.25-1.25-2.5-2.667-2.5-4.583Z"
        />
      </g>
      <defs>
        <clipPath id="favorites-clip">
          <path fill="#fff" d="M0 0h20v20H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default IconFavorites;
