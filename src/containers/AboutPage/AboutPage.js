import React from 'react';
import { useIntl, FormattedMessage } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { useSelector } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './AboutPage.module.css';

// Partner logos
import logoOslContemporary from './images/osl-contemporary.avif';
import logoGalleriRiis from './images/galleri-riis.avif';
import logoGalleriOpdahl from './images/galleri-opdahl.avif';
import logoQbGallery from './images/qb-gallery.avif';
import logoGrevWedels from './images/grev-wedels-plass.avif';
import logoStandardOslo from './images/standard-oslo.avif';
import logoHoyersten from './images/hoyersten-contemporary.avif';
import logoBlomqvist from './images/blomqvist.avif';
import logoMieMortensen from './images/mie-mortensen-abstrakt.avif';
import logoCornelia from './images/cornelia-svedman.avif';

const AboutPage = () => {
  const intl = useIntl();
  const config = useConfiguration();
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'AboutPage.schemaTitle' },
    { marketplaceName }
  );
  const schemaDescription = intl.formatMessage(
    { id: 'AboutPage.schemaDescription' },
    { marketplaceName }
  );

  // Gallery partners
  const galleryPartners = [
    { name: 'OSL Contemporary', logo: logoOslContemporary },
    { name: 'STANDARD (Oslo)', logo: logoStandardOslo },
    { name: 'Galleri Riis', logo: logoGalleriRiis },
    { name: 'Galleri Opdahl', logo: logoGalleriOpdahl },
    { name: 'Høyersten Contemporary', logo: logoHoyersten },
    { name: 'QB Galleri', logo: logoQbGallery },
    { name: 'Grev Wedels Plass Auksjoner', logo: logoGrevWedels },
    { name: 'Blomqvist Kunsthandel', logo: logoBlomqvist },
  ];

  // Service partners
  const servicePartners = [
    { name: 'Mie Mortensen/Abstrakt AS', logo: logoMieMortensen },
    { name: 'Cornelia Svedman Art Advisory', logo: logoCornelia },
  ];

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      description={schemaDescription}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'AboutPage',
        name: schemaTitle,
        description: schemaDescription,
      }}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          {/* Hero Section */}
          <section className={css.heroSection}>
            <div className={css.heroContent}>
              <h1 className={css.heroTitle}>
                <FormattedMessage id="AboutPage.heroTitle" />
              </h1>
            </div>
          </section>

          {/* Main Content Section */}
          <section className={css.mainSection}>
            <div className={css.mainContent}>
              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.dateline" />
              </p>

              {/* Et samlet kunstmarked */}
              <h2 className={css.sectionHeading}>
                <FormattedMessage id="AboutPage.samletHeading" />
              </h2>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.samletIntro" />
              </p>

              {/* Gallery Partners */}
              <div className={css.partnersSection}>
                <p className={css.partnersLabel}>
                  <FormattedMessage id="AboutPage.galleryPartnersLabel" />
                </p>
                <div className={css.partnersGrid}>
                  {galleryPartners.map((partner, index) => (
                    <div key={index} className={css.logoCard}>
                      {partner.logo ? (
                        <img src={partner.logo} alt={partner.name} className={css.logoImage} />
                      ) : (
                        <span className={css.logoText}>{partner.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Partners */}
              <div className={css.partnersSection}>
                <p className={css.partnersLabel}>
                  <FormattedMessage id="AboutPage.servicePartnersLabel" />
                </p>
                <div className={css.servicePartnersGrid}>
                  {servicePartners.map((partner, index) => (
                    <div key={index} className={css.logoCard}>
                      {partner.logo ? (
                        <img src={partner.logo} alt={partner.name} className={css.logoImage} />
                      ) : (
                        <span className={css.logoText}>{partner.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.samletOutro" />
              </p>

              {/* Blomqvist Quote */}
              <blockquote className={css.quote}>
                <p><FormattedMessage id="AboutPage.blomqvistQuoteText" /></p>
                <cite><FormattedMessage id="AboutPage.blomqvistQuoteCite" /></cite>
              </blockquote>

              {/* Gjør gode kunstkjøp enklere */}
              <h2 className={css.sectionHeading}>
                <FormattedMessage id="AboutPage.enklereHeading" />
              </h2>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.corneliaBio" />
              </p>

              {/* Cornelia Quote */}
              <blockquote className={css.quote}>
                <p><FormattedMessage id="AboutPage.corneliaQuoteText" /></p>
                <cite><FormattedMessage id="AboutPage.corneliaQuoteCite" /></cite>
              </blockquote>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.platformFeatures" />
              </p>

              {/* Om Kuratert */}
              <h2 className={css.sectionHeading}>
                <FormattedMessage id="AboutPage.omHeading" />
              </h2>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.omText" />
              </p>
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default AboutPage;
