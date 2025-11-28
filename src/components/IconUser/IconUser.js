import React from 'react';
import classNames from 'classnames';

import css from './IconUser.module.css';

/**
 * User/Profile icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconUser = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M8 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"
      />
    </svg>
  );
};

export default IconUser;
