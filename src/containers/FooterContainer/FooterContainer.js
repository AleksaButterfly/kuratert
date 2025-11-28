import React from 'react';
import { useConfiguration } from '../../context/configurationContext';

import Footer from './Footer';

const FooterContainer = () => {
  const { footer = {}, topbar } = useConfiguration();

  // Extract footer data from hosted assets
  const {
    blocks = [],
    slogan,
    copyright,
    numberOfColumns = 1,
    socialMediaLinks = [],
  } = footer;

  return (
    <Footer
      blocks={blocks}
      slogan={slogan}
      copyright={copyright}
      numberOfColumns={numberOfColumns}
      socialMediaLinks={socialMediaLinks}
      linkLogoToExternalSite={topbar?.logoLink}
    />
  );
};

export default FooterContainer;
