import React from 'react';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { useSelector } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ContactPage.module.css';

const IconEmail = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path fill="none" d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconPhone = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.09501 3.90347 2.12787 3.62476 2.2165 3.36162C2.30513 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5864 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLocation = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path fill="none" d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const contactInfo = [
  {
    icon: IconEmail,
    titleId: 'ContactPage.emailTitle',
    subtitleId: 'ContactPage.emailSubtitle',
    value: 'kontakt@kuratert.no',
    href: 'mailto:kontakt@kuratert.no',
  },
  {
    icon: IconPhone,
    titleId: 'ContactPage.phoneTitle',
    subtitleId: 'ContactPage.phoneSubtitle',
    value: '+47 123 45 678',
    href: 'tel:+4712345678',
  },
  {
    icon: IconLocation,
    titleId: 'ContactPage.locationTitle',
    subtitleId: 'ContactPage.locationSubtitle',
    value: 'Oslo, Norge',
    href: null,
  },
];

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
          {/* Hero Section */}
          <section className={css.heroSection}>
            <div className={css.heroContent}>
              <h1 className={css.heroTitle}>
                {intl.formatMessage({ id: 'ContactPage.heroTitle' })}
              </h1>
              <p className={css.heroSubtitle}>
                {intl.formatMessage({ id: 'ContactPage.heroSubtitle' })}
              </p>
            </div>
          </section>

          {/* Contact Cards Section */}
          <section className={css.contactSection}>
            <div className={css.contactGrid}>
              {contactInfo.map((item, index) => {
                const IconComponent = item.icon;
                const content = (
                  <>
                    <div className={css.cardIcon}>
                      <IconComponent />
                    </div>
                    <h3 className={css.cardTitle}>
                      {intl.formatMessage({ id: item.titleId })}
                    </h3>
                    <p className={css.cardSubtitle}>
                      {intl.formatMessage({ id: item.subtitleId })}
                    </p>
                    <span className={css.cardValue}>{item.value}</span>
                  </>
                );

                return item.href ? (
                  <a key={index} href={item.href} className={css.contactCard}>
                    {content}
                  </a>
                ) : (
                  <div key={index} className={css.contactCard}>
                    {content}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default ContactPage;
