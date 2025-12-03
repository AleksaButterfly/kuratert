import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { queryListings } from './LandingPage.duck';
import SectionHero from './SectionHero/SectionHero';
import SectionListings from './SectionListings/SectionListings';
import SectionCategories from './SectionCategories/SectionCategories';
import SectionEditorial from './SectionEditorial/SectionEditorial';
import SectionSeller from './SectionSeller/SectionSeller';
import css from './FallbackLandingPage.module.css';

const FallbackLandingPage = props => {
  const intl = useIntl();
  const config = useConfiguration();
  const dispatch = useDispatch();
  const { scrollingDisabled } = props;

  const [currentPerPage, setCurrentPerPage] = useState(8);

  const {
    listingRefs,
    queryListingsInProgress,
    totalItems,
    featuredArticles,
    featuredArticlesInProgress,
  } = useSelector(state => state.LandingPage);

  const listings = useSelector(state => getMarketplaceEntities(state, listingRefs));

  const handleLoadMore = () => {
    const newPerPage = currentPerPage + 8;
    setCurrentPerPage(newPerPage);
    dispatch(queryListings(config, newPerPage));
  };

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
          <SectionListings
            listings={listings}
            isLoading={queryListingsInProgress}
            totalItems={totalItems}
            onLoadMore={handleLoadMore}
          />
          <SectionCategories />
          <SectionEditorial
            articles={featuredArticles}
            isLoading={featuredArticlesInProgress}
          />
          <SectionSeller />
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default FallbackLandingPage;
