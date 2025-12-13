import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { toggleLanguageModal, isLanguageModalOpen, manageDisableScrolling } from '../../ducks/ui.duck';

import Footer from './Footer';

const FooterContainer = () => {
  const dispatch = useDispatch();
  const config = useConfiguration();
  const { footer = {}, topbar } = config;

  // Get language modal state from Redux
  const languageModalOpen = useSelector(isLanguageModalOpen);

  // Extract footer data from hosted assets
  const {
    blocks = [],
    slogan,
    copyright,
    numberOfColumns = 1,
    socialMediaLinks = [],
  } = footer;

  const handleToggleLanguageModal = isOpen => {
    dispatch(toggleLanguageModal(isOpen));
  };

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
      languageModalOpen={languageModalOpen}
      onToggleLanguageModal={handleToggleLanguageModal}
      onManageDisableScrolling={handleManageDisableScrolling}
    />
  );
};

export default FooterContainer;
