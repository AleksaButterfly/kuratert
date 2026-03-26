import React from 'react';
import { array, bool } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';

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

const SellerLandingPageComponent = props => {
  const { sellers, querySellersInProgress, scrollingDisabled } = props;
  const intl = useIntl();
  const config = useConfiguration();

  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'SellerLandingPage.schemaTitle' },
    { marketplaceName }
  );
  const schemaDescription = intl.formatMessage(
    { id: 'SellerLandingPage.schemaDescription' },
    { marketplaceName }
  );

  // Only show sellers section if we have sellers
  const hasSellers = sellers && sellers.length > 0;

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
          {hasSellers && !querySellersInProgress ? (
            <SectionSellers sellers={sellers} />
          ) : null}
          <SectionHowItWorks />
          <SectionPricing />
          <SectionSell />
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

SellerLandingPageComponent.propTypes = {
  sellers: array,
  querySellersInProgress: bool,
  scrollingDisabled: bool.isRequired,
};

const mapStateToProps = state => {
  const { sellers, querySellersInProgress, querySellersError } = state.SellerLandingPage;

  return {
    sellers,
    querySellersInProgress,
    querySellersError,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const SellerLandingPage = compose(connect(mapStateToProps))(SellerLandingPageComponent);

export default SellerLandingPage;
