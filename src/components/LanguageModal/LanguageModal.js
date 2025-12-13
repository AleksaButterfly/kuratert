import React from 'react';
import classNames from 'classnames';

import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { supportedLanguages } from '../../util/translations';

import { Modal } from '../../components';

import css from './LanguageModal.module.css';

const LanguageOption = ({ language, isSelected, onSelectLanguage }) => {
  const languageClasses = classNames(css.language, {
    [css.selectedLanguage]: isSelected,
  });

  const handleClick = () => {
    onSelectLanguage(language.code);
  };

  return (
    <button
      type="button"
      className={languageClasses}
      onClick={handleClick}
    >
      <div className={css.languageText}>{language.language}</div>
      <div className={css.languageCountry}>{language.country}</div>
    </button>
  );
};

const LanguageSelector = ({ selectedLanguageId, onSelectLanguage }) => (
  <div className={css.languages}>
    {supportedLanguages.map(language => (
      <LanguageOption
        key={language.code}
        language={language}
        isSelected={language.code === selectedLanguageId}
        onSelectLanguage={onSelectLanguage}
      />
    ))}
  </div>
);

const LanguageModal = ({
  className = null,
  rootClassName = null,
  id,
  isOpen,
  onCloseModal,
  onManageDisableScrolling,
}) => {

  const config = useConfiguration();
  const locale = config.localization?.locale || 'nb-NO';
  const selectedLanguageId = locale.startsWith('nb') || locale === 'no' ? 'no' : 'en';

  const handleSelectLanguage = newLocale => {
    const storedLocale = localStorage.getItem('locale');
    // If no locale is stored, treat current as 'no' (Norwegian is default)
    const currentLocale = storedLocale || 'no';
    if (currentLocale !== newLocale) {
      localStorage.setItem('locale', newLocale);
      window.location.reload();
    }
  };

  const classes = classNames(rootClassName || css.root, className);

  return (
    <Modal
      id={id}
      containerClassName={classes}
      contentClassName={css.modalContent}
      isOpen={isOpen}
      onClose={onCloseModal}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <p className={css.modalTitle}>
        <FormattedMessage id="LanguageModal.title" />
      </p>
      <LanguageSelector
        selectedLanguageId={selectedLanguageId}
        onSelectLanguage={handleSelectLanguage}
      />
    </Modal>
  );
};

export default injectIntl(LanguageModal);
