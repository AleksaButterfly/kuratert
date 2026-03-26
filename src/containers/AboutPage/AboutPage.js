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
                Velkommen til Kuratert: Der kvalitet bytter hender
              </h1>
            </div>
          </section>

          {/* Main Content Section */}
          <section className={css.mainSection}>
            <div className={css.mainContent}>
              {/* Intro paragraph */}
              <p className={css.paragraph}>
                Kuratert er en digital markedsplass som samler Norges ledende gallerier, auksjonshus og kunstfaglige tjenesteleverandører på én plattform
              </p>

              <p className={css.paragraph}>
                Kuratert bringer sammen sentrale aktører i det norske kunstmarkedet, nøye utvalgt basert på kvalitet, integritet og relevans:
              </p>

              {/* Gallery Partners */}
              <div className={css.partnersSection}>
                <p className={css.partnersLabel}>Gallerier og auksjonshus:</p>
                <div className={css.partnersGrid}>
                  {galleryPartners.map((partner, index) => (
                    <LogoPlaceholder key={index} name={partner} />
                  ))}
                </div>
              </div>

              {/* Service Partners */}
              <div className={css.partnersSection}>
                <p className={css.partnersLabel}>Tjenesteleverandører:</p>
                <div className={css.servicePartnersGrid}>
                  {servicePartners.map((partner, index) => (
                    <LogoPlaceholder key={index} name={partner} />
                  ))}
                </div>
              </div>

              <p className={css.paragraph}>
                Ved å samle disse aktørene digitalt, åpner Kuratert et marked som tradisjonelt har vært fragmentert og lite tilgjengelig.
              </p>

              {/* About Cornelia */}
              <p className={css.paragraph}>
                Bak Kuratert står kunstrådgiver og -historiker Cornelia Svedman, med 20 års erfaring fra det internasjonale kunstmarkedet. Som tidligere ekspert hos Christie's i London og profilert skribent for blant annet Dagens Næringsliv, er Svedman en av Norges mest respekterte stemmer innen kunst og investering.
              </p>

              {/* Quote */}
              <blockquote className={css.quote}>
                <p>Det finnes mye god kunst i Norge, men markedet kan oppleves lukket og uoversiktlig. Med Kuratert ønsket jeg å gjøre det enklere å navigere, uten å gå på kompromiss med faglighet eller kvalitet.</p>
                <cite>– Cornelia Svedman, grunnlegger</cite>
              </blockquote>

              {/* Platform features */}
              <p className={css.paragraph}>
                Plattformen kombinerer klassisk kunstrådgivning med moderne teknologi, og gir både nye og erfarne kjøpere tilgang til et kuratert utvalg av kunst fra ledende aktører; kostnadsfri kunstrådgivning; digitale visninger; integrert bestilling av transport og ramme; og trygge og fleksible betalingsløsninger, inkludert Klarna og American Express.
              </p>
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default AboutPage;
