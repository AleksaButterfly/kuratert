import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './SectionAbout.module.css';

const IconGlobe = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M3 12H21" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 3C14.5 5.5 15.5 8.5 15.5 12C15.5 15.5 14.5 18.5 12 21" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 3C9.5 5.5 8.5 8.5 8.5 12C8.5 15.5 9.5 18.5 12 21" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L4 7V11C4 15.5 7.5 19.5 12 21C16.5 19.5 20 15.5 20 11V7L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconTrending = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M17 7H21V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconSupport = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="15" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M3 21V18C3 16.3431 4.34315 15 6 15H12C13.6569 15 15 16.3431 15 18V21" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M15 15H18C19.6569 15 21 16.3431 21 18V21" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const IconMarketing = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V7M12 7L8 5M12 7L16 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M12 17V21M12 17L8 19M12 17L16 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M5 12H3M5 12L7 8M5 12L7 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M19 12H21M19 12L17 8M19 12L17 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconCurated = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const features = [
  { icon: IconGlobe, titleId: 'feature1.title', descriptionId: 'feature1.description' },
  { icon: IconShield, titleId: 'feature2.title', descriptionId: 'feature2.description' },
  { icon: IconTrending, titleId: 'feature3.title', descriptionId: 'feature3.description' },
  { icon: IconSupport, titleId: 'feature4.title', descriptionId: 'feature4.description' },
  { icon: IconMarketing, titleId: 'feature5.title', descriptionId: 'feature5.description' },
  { icon: IconCurated, titleId: 'feature6.title', descriptionId: 'feature6.description' },
];

const SectionAbout = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <div className={css.header}>
        <h2 className={css.title}>
          <FormattedMessage id="SellerLandingPage.SectionAbout.title" />
        </h2>
        <p className={css.subtitle}>
          <FormattedMessage id="SellerLandingPage.SectionAbout.subtitle" />
        </p>
      </div>
      <div className={css.grid}>
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div key={index} className={css.card}>
              <div className={css.iconWrapper}>
                <IconComponent />
              </div>
              <h3 className={css.cardTitle}>
                <FormattedMessage id={`SellerLandingPage.SectionAbout.${feature.titleId}`} />
              </h3>
              <p className={css.cardDescription}>
                <FormattedMessage id={`SellerLandingPage.SectionAbout.${feature.descriptionId}`} />
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

SectionAbout.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionAbout;
