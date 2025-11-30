import React from 'react';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { useSelector } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import SectionHero from './SectionHero/SectionHero';
import SectionAbout from './SectionAbout/SectionAbout';
import SectionSellers from './SectionSellers/SectionSellers';
import SectionHowItWorks from './SectionHowItWorks/SectionHowItWorks';
import SectionPricing from './SectionPricing/SectionPricing';
import SectionSell from './SectionSell/SectionSell';

import css from './SellerLandingPage.module.css';

const SellerLandingPage = () => {
  const intl = useIntl();
  const config = useConfiguration();
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'SellerLandingPage.schemaTitle' },
    { marketplaceName }
  );
  const schemaDescription = intl.formatMessage(
    { id: 'SellerLandingPage.schemaDescription' },
    { marketplaceName }
  );

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      description={schemaDescription}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        name: schemaTitle,
        description: schemaDescription,
      }}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <SectionHero />
          <SectionAbout />
          <SectionSellers />
          <SectionHowItWorks />
          <SectionPricing />
          <SectionSell />
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default SellerLandingPage;
