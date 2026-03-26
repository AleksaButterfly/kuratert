import React from 'react';
import { useDispatch } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { manageDisableScrolling } from '../../ducks/ui.duck';

import Footer from './Footer';

const FooterContainer = () => {
  const dispatch = useDispatch();
  const config = useConfiguration();
  const { footer = {}, topbar } = config;

  // Extract footer data from hosted assets
  const {
    blocks = [],
    slogan,
    copyright,
    numberOfColumns = 1,
    socialMediaLinks = [],
  } = footer;

  const handleManageDisableScrolling = (componentId, disableScrolling) => {
    dispatch(manageDisableScrolling(componentId, disableScrolling));
  };

  return (
    <Footer
      blocks={blocks}
      slogan={slogan}
      copyright={copyright}
      numberOfColumns={numberOfColumns}
      socialMediaLinks={socialMediaLinks}
      linkLogoToExternalSite={topbar?.logoLink}
      onManageDisableScrolling={handleManageDisableScrolling}
    />
  );
};

export default FooterContainer;
