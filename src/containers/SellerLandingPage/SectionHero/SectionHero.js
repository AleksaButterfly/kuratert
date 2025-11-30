import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';

import css from './SectionHero.module.css';

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SectionHero = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      <div className={css.overlay} />
      <div className={css.heroContent}>
        <div className={css.badge}>
          <span className={css.badgeText}>
            <FormattedMessage id="SellerLandingPage.SectionHero.badge" />
          </span>
        </div>
        <h1 className={css.heroTitle}>
          <FormattedMessage id="SellerLandingPage.SectionHero.title" />
        </h1>
        <p className={css.heroSubtitle}>
          <FormattedMessage id="SellerLandingPage.SectionHero.subtitle" />
        </p>
        <div className={css.buttons}>
          <NamedLink name="NewListingPage" className={css.primaryButton}>
            <FormattedMessage id="SellerLandingPage.SectionHero.startSelling" />
            <IconArrowRight />
          </NamedLink>
          <NamedLink name="CMSPage" params={{ pageId: 'about' }} className={css.secondaryButton}>
            <FormattedMessage id="SellerLandingPage.SectionHero.learnMore" />
          </NamedLink>
        </div>
      </div>
    </div>
  );
};

SectionHero.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHero;
