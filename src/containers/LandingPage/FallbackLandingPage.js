import React from 'react';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import SectionHero from './SectionHero';
import css from './FallbackLandingPage.module.css';

/**
 * Fallback Landing Page component
 * Used when REACT_APP_USE_HOSTED_LANDING_PAGE is not set to 'true'
 * or when hosted landing page fails to load.
 *
 * TODO: Add custom sections here (e.g., Hero, Featured Listings, etc.)
 */
const FallbackLandingPage = props => {
  const intl = useIntl();
  const config = useConfiguration();
  const { scrollingDisabled } = props;

  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'LandingPage.schemaTitle' },
    { marketplaceName }
  );
  const schemaDescription = intl.formatMessage(
    { id: 'LandingPage.schemaDescription' },
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
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default FallbackLandingPage;
