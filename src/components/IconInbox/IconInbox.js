import React from 'react';
import classNames from 'classnames';

import css from './IconInbox.module.css';

/**
 * Inbox icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconInbox = props => {
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
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.667}
        d="M2.5 10h4.167a.833.833 0 0 1 .833.833 2.5 2.5 0 0 0 5 0 .833.833 0 0 1 .833-.833H17.5"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.667}
        d="M4.542 4.308 2.5 10v5a1.667 1.667 0 0 0 1.667 1.667h11.666A1.667 1.667 0 0 0 17.5 15v-5l-2.042-5.692a1.667 1.667 0 0 0-1.575-1.141H6.117a1.667 1.667 0 0 0-1.575 1.141Z"
      />
    </svg>
  );
};

export default IconInbox;
