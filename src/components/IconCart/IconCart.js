import React from 'react';
import classNames from 'classnames';

import css from './IconCart.module.css';

/**
 * Shopping cart/bag icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconCart = props => {
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
        d="M13.333 8.333a3.334 3.334 0 0 1-6.666 0M2.586 5.028h14.828"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.667}
        d="M2.833 4.556c-.216.288-.333.64-.333 1v11.11a1.667 1.667 0 0 0 1.667 1.667h11.666a1.667 1.667 0 0 0 1.667-1.666V5.556c0-.36-.117-.712-.333-1L15.5 2.333a1.667 1.667 0 0 0-1.333-.666H5.833a1.667 1.667 0 0 0-1.333.666L2.833 4.556Z"
      />
    </svg>
  );
};

export default IconCart;
