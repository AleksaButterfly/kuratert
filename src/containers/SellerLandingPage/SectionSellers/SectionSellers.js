import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './SectionSellers.module.css';

const LogoPlaceholder = ({ name }) => (
  <div className={css.logoPlaceholder}>
    <span className={css.logoText}>{name}</span>
  </div>
);

const partners = [
  'OSL Contemporary',
  'STANDARD (Oslo)',
  'Galleri Riis',
  'Galleri Opdahl',
  'Høyersten Contemporary',
  'QB Galleri',
  'Grev Wedels Plass Auksjoner',
  'Blomqvist Kunsthandel',
  'Mie Mortensen/Abstrakt AS',
  'Cornelia Svedman Art Advisory',
];

const SectionSellers = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <div className={css.content}>
        <h2 className={css.title}>
          <FormattedMessage id="SellerLandingPage.SectionSellers.title" />
        </h2>
        <p className={css.subtitle}>
          <FormattedMessage id="SellerLandingPage.SectionSellers.subtitle" />
        </p>
        <div className={css.grid}>
          {partners.map((partner, index) => (
            <LogoPlaceholder key={index} name={partner} />
          ))}
        </div>
        <p className={css.footerText}>
          <FormattedMessage id="SellerLandingPage.SectionSellers.footerText" />
        </p>
      </div>
    </section>
  );
};

SectionSellers.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionSellers;
