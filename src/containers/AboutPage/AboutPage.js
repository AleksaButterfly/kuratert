import React from 'react';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { useSelector } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './AboutPage.module.css';

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
          {/* Section 1: Vision */}
          <section className={css.sectionVision}>
            <div className={css.sectionContent}>
              <h1 className={css.visionTitle}>
                {intl.formatMessage({ id: 'AboutPage.visionTitle' })}
              </h1>
              <p className={css.visionSubtitle}>
                {intl.formatMessage({ id: 'AboutPage.visionSubtitle' })}
              </p>
            </div>
          </section>

          {/* Section 2: Book a Call */}
          <section className={css.sectionBookCall}>
            <div className={css.sectionContent}>
              <h2 className={css.bookCallTitle}>
                {intl.formatMessage({ id: 'AboutPage.bookCallTitle' })}
              </h2>
              <p className={css.bookCallSubtitle}>
                {intl.formatMessage({ id: 'AboutPage.bookCallSubtitle' })}
              </p>
              <a
                href="https://calendly.com/cornelia-corneliasvedman"
                target="_blank"
                rel="noopener noreferrer"
                className={css.bookCallButton}
              >
                {intl.formatMessage({ id: 'AboutPage.bookCallButton' })}
              </a>
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default AboutPage;
