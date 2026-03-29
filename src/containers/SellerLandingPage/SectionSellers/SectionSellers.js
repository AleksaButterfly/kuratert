import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './SectionSellers.module.css';

// Partner logos (shared with AboutPage)
import logoOslContemporary from '../../AboutPage/images/osl-contemporary.avif';
import logoStandardOslo from '../../AboutPage/images/standard-oslo.avif';
import logoGalleriRiis from '../../AboutPage/images/galleri-riis.avif';
import logoGalleriOpdahl from '../../AboutPage/images/galleri-opdahl.avif';
import logoHoyersten from '../../AboutPage/images/hoyersten-contemporary.avif';
import logoQbGallery from '../../AboutPage/images/qb-gallery.avif';
import logoGrevWedels from '../../AboutPage/images/grev-wedels-plass.avif';
import logoBlomqvist from '../../AboutPage/images/blomqvist.avif';
import logoMieMortensen from '../../AboutPage/images/mie-mortensen-abstrakt.avif';
import logoCornelia from '../../AboutPage/images/cornelia-svedman.avif';

const partners = [
  { name: 'OSL Contemporary', logo: logoOslContemporary },
  { name: 'STANDARD (Oslo)', logo: logoStandardOslo },
  { name: 'Galleri Riis', logo: logoGalleriRiis },
  { name: 'Galleri Opdahl', logo: logoGalleriOpdahl },
  { name: 'Høyersten Contemporary', logo: logoHoyersten },
  { name: 'QB Galleri', logo: logoQbGallery },
  { name: 'Grev Wedels Plass Auksjoner', logo: logoGrevWedels },
  { name: 'Blomqvist Kunsthandel', logo: logoBlomqvist },
  { name: 'Mie Mortensen/Abstrakt AS', logo: logoMieMortensen },
  { name: 'Cornelia Svedman Art Advisory', logo: logoCornelia },
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
            <div key={index} className={css.logoCard}>
              <img src={partner.logo} alt={partner.name} className={css.logoImage} />
            </div>
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
