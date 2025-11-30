import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';

import css from './SectionPricing.module.css';

const IconPricing = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M6 28C6 21.3726 10.4772 16 16 16C21.5228 16 26 21.3726 26 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const features = [
  { id: 'feature1' },
  { id: 'feature2' },
  { id: 'feature3' },
];

const SectionPricing = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage id="SellerLandingPage.SectionPricing.title" />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage id="SellerLandingPage.SectionPricing.subtitle" />
          </p>
        </div>
        <div className={css.card}>
          <div className={css.iconWrapper}>
            <IconPricing />
          </div>
          <h3 className={css.cardTitle}>
            <FormattedMessage id="SellerLandingPage.SectionPricing.cardTitle" />
          </h3>
          <p className={css.cardDescription}>
            <FormattedMessage id="SellerLandingPage.SectionPricing.cardDescription" />
          </p>
          <div className={css.features}>
            {features.map((feature, index) => (
              <div key={index} className={css.featureItem}>
                <span className={css.checkIcon}>
                  <IconCheck />
                </span>
                <span className={css.featureText}>
                  <FormattedMessage id={`SellerLandingPage.SectionPricing.${feature.id}`} />
                </span>
              </div>
            ))}
          </div>
          <NamedLink name="CMSPage" params={{ pageId: 'contact' }} className={css.ctaButton}>
            <FormattedMessage id="SellerLandingPage.SectionPricing.ctaButton" />
            <IconArrowRight />
          </NamedLink>
        </div>
      </div>
    </section>
  );
};

SectionPricing.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionPricing;
