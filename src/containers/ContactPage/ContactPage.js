import React from 'react';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { useSelector } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ContactPage.module.css';

const ContactPage = () => {
  const intl = useIntl();
  const config = useConfiguration();
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));

  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'ContactPage.schemaTitle' },
    { marketplaceName }
  );
  const schemaDescription = intl.formatMessage(
    { id: 'ContactPage.schemaDescription' },
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
        '@type': 'ContactPage',
        name: schemaTitle,
        description: schemaDescription,
      }}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <section className={css.heroSection}>
            <div className={css.heroContent}>
              <h1 className={css.heroTitle}>
                {intl.formatMessage({ id: 'ContactPage.heroTitle' })}
              </h1>
              <p className={css.heroSubtitle}>
                {intl.formatMessage({ id: 'ContactPage.heroSubtitle' })}
              </p>
              <a href="mailto:kontakt@kuratert.no" className={css.emailLink}>
                kontakt@kuratert.no
              </a>
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default ContactPage;
