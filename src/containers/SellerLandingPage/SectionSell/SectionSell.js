import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';

import css from './SectionSell.module.css';

const IconArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const SectionSell = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <div className={css.container}>
        <h2 className={css.title}>
          <FormattedMessage id="SellerLandingPage.SectionSell.title" />
        </h2>
        <p className={css.subtitle}>
          <FormattedMessage id="SellerLandingPage.SectionSell.subtitle" />
        </p>
        <NamedLink name="SignupPage" className={css.ctaButton}>
          <FormattedMessage id="SellerLandingPage.SectionSell.ctaButton" />
          <IconArrowRight />
        </NamedLink>
      </div>
    </section>
  );
};

SectionSell.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionSell;
