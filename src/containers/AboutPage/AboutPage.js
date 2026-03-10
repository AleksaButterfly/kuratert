import React from 'react';
import { useIntl } from '../../util/reactIntl';
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
    'Grev Wedels Plass Auksjoner',
    'Blomqvist Kunsthandel',
    'QB Galleri',
    'Galleri Riis',
    'OSL Contemporary',
    'Standard Oslo',
    'Høyersten Contemporary',
    'Galleri Opdahl',
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
                Velkommen til Kuratert: Der kvalitet bytter hender
              </h1>
            </div>
          </section>

          {/* Main Content Section */}
          <section className={css.mainSection}>
            <div className={css.mainContent}>
              {/* Intro paragraph */}
              <p className={css.paragraph}>
                Hva om det fantes ett sted å gå når du vil kjøpe kunst og faktisk vite at du gjør et godt valg? Det er akkurat det Kuratert er.
              </p>

              {/* About Cornelia */}
              <p className={css.paragraph}>
                Bak plattformen står Cornelia Svedman: kunsthistoriker, tidligere ekspert hos Christie's i London, og en av Norges mest profilerte stemmer innen kunstmarkedet. Hun har tilbrakt 20 år i bransjen, rådgitt norske kjøpere og selgere i transaksjoner for titalls millioner dollar, og skrevet om kunst og investering for Dagens Næringsliv. Nå har hun samlet det hun vet om gode kunstkjøp på én lett tilgjengelig, digital plattform.
              </p>

              {/* About the platform */}
              <p className={css.paragraph}>
                Kuratert er ikke en åpen markedsplass der alle slipper til. Det er et nøye utvalgt univers, der hvert galleri og hvert verk er håndplukket med faglighet i bunn. Ved lansering er disse med:
              </p>

              {/* Gallery Partners */}
              <div className={css.partnersSection}>
                <div className={css.partnersGrid}>
                  {galleryPartners.map((partner, index) => (
                    <LogoPlaceholder key={index} name={partner} />
                  ))}
                </div>
              </div>

              {/* Service partners intro */}
              <p className={css.paragraph}>
                I tillegg samarbeider vi med ledende tjenesteleverandører innenfor rådgivning, taksering, forsikring, transport og oppheng:
              </p>

              {/* Service Partners */}
              <div className={css.partnersSection}>
                <div className={css.servicePartnersGrid}>
                  {servicePartners.map((partner, index) => (
                    <LogoPlaceholder key={index} name={partner} />
                  ))}
                </div>
              </div>

              {/* Final paragraphs */}
              <p className={css.paragraph}>
                Enten du er erfaren samler eller skal kjøpe ditt første verk, tilbyr Kuratert gratis kunstrådgivning, digitale visninger og en enkel kjøpsprosess, fra første klikk til levering på døren.
              </p>

              <p className={css.closingParagraph}>
                Vi har allerede valgt ut det beste. Nå er det din tur.
              </p>
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default AboutPage;
