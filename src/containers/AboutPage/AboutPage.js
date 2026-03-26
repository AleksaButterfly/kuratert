import React from 'react';
import { useIntl, FormattedMessage } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { useSelector } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './AboutPage.module.css';

// Placeholder logo component
const LogoPlaceholder = ({ name }) => (
  <div className={css.logoPlaceholder}>
    <span className={css.logoText}>{name}</span>
  </div>
);

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
    'OSL Contemporary',
    'STANDARD (Oslo)',
    'Galleri Riis',
    'Galleri Opdahl',
    'Høyersten Contemporary',
    'QB Galleri',
    'Grev Wedels Plass Auksjoner',
    'Blomqvist Kunsthandel',
  ];

  // Service partners
  const servicePartners = [
    'Mie Mortensen/Abstrakt AS',
    'Cornelia Svedman Art Advisory',
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
                <FormattedMessage id="AboutPage.intro1" />
              </p>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.intro2" />
              </p>

              {/* Gallery Partners */}
              <div className={css.partnersSection}>
                <p className={css.partnersLabel}>
                  <FormattedMessage id="AboutPage.galleryPartnersLabel" />
                </p>
                <div className={css.partnersGrid}>
                  {galleryPartners.map((partner, index) => (
                    <LogoPlaceholder key={index} name={partner} />
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
                    <LogoPlaceholder key={index} name={partner} />
                  ))}
                </div>
              </div>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.digitalParagraph" />
              </p>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.corneliaBio" />
              </p>

              {/* Quote */}
              <blockquote className={css.quote}>
                <p><FormattedMessage id="AboutPage.quoteText" /></p>
                <cite><FormattedMessage id="AboutPage.quoteCite" /></cite>
              </blockquote>

              <p className={css.paragraph}>
                <FormattedMessage id="AboutPage.platformFeatures" />
              </p>
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default AboutPage;
