import React from 'react';
import { bool } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import SectionSellers from './SectionSellers/SectionSellers';

import css from './SellerLandingPage.module.css';

const SellerLandingPageComponent = props => {
  const { scrollingDisabled } = props;
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
          <SectionSellers />
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

SellerLandingPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
};

const mapStateToProps = state => ({
  scrollingDisabled: isScrollingDisabled(state),
});

const SellerLandingPage = compose(connect(mapStateToProps))(SellerLandingPageComponent);

export default SellerLandingPage;
