import React from 'react';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { LinkedLogo, ExternalLink, NamedLink } from '../../../components';
import BlockBuilder from '../../PageBuilder/BlockBuilder';
import NewsletterForm from './NewsletterForm';

import css from './Footer.module.css';

// Social media icons - simple SVG components
const IconInstagram = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const IconFacebook = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const IconLinkedIn = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const IconTwitter = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

// Social media links configuration
const SOCIAL_LINKS = [
  { platform: 'instagram', url: 'https://instagram.com', icon: IconInstagram },
  { platform: 'facebook', url: 'https://facebook.com', icon: IconFacebook },
  { platform: 'twitter', url: 'https://twitter.com', icon: IconTwitter },
  { platform: 'linkedin', url: 'https://linkedin.com', icon: IconLinkedIn },
];

// Bottom custom links configuration
const BOTTOM_LINKS = [
  { name: 'PrivacyPolicyPage', labelId: 'Footer.privacyPolicy' },
  { name: 'TermsOfServicePage', labelId: 'Footer.termsOfService' },
];

/**
 * Custom Footer component for Kuratert
 *
 * Layout:
 * - Top: Logo + slogan + social icons (left) | Columns from hosted assets (right)
 * - Bottom: Copyright (left) | Custom links (right)
 */
const Footer = props => {
  const {
    className,
    rootClassName,
    blocks = [],
    slogan,
    copyright,
    numberOfColumns = 1,
    socialMediaLinks = [],
    linkLogoToExternalSite,
    options,
  } = props;

  const intl = useIntl();
  const classes = classNames(rootClassName || css.root, className);

  // Determine grid column class
  const gridColClass = numberOfColumns === 4
    ? css.gridCol4
    : numberOfColumns === 3
      ? css.gridCol3
      : numberOfColumns === 2
        ? css.gridCol2
        : css.gridCol1;

  // Get social links from props or use default
  const socialLinks = socialMediaLinks?.length > 0
    ? socialMediaLinks.map(sml => ({
        platform: sml.link?.platform,
        url: sml.link?.url,
      }))
    : SOCIAL_LINKS;

  const currentYear = new Date().getFullYear();

  return (
    <footer className={classes}>
      <div className={css.container}>
        {/* Top Section */}
        <div className={css.topSection}>
          {/* Left side: Logo, Slogan, Social Icons */}
          <div className={css.brandSection}>
            <LinkedLogo
              rootClassName={css.logoLink}
              logoClassName={css.logo}
              logoImageClassName={css.logoImage}
              linkToExternalSite={linkLogoToExternalSite}
              layout="desktop"
              variant="white"
            />

            {slogan?.content && (
              <p className={css.slogan}>{slogan.content}</p>
            )}

            <div className={css.socialLinks}>
              {socialLinks.map(link => {
                const IconComponent = SOCIAL_LINKS.find(s => s.platform === link.platform)?.icon;
                return (
                  <ExternalLink
                    key={link.platform}
                    href={link.url}
                    className={css.socialLink}
                    aria-label={link.platform}
                  >
                    {IconComponent && <IconComponent className={css.socialIcon} />}
                  </ExternalLink>
                );
              })}
            </div>
          </div>

          {/* Right side: Columns from hosted assets */}
          <div className={classNames(css.columnsSection, gridColClass)}>
            <BlockBuilder blocks={blocks} sectionId="footer" />
          </div>
        </div>

        {/* Newsletter Section */}
        <div className={css.newsletterSection}>
          <div className={css.newsletterContent}>
            <h3 className={css.newsletterTitle}>
              {intl.formatMessage({ id: 'Footer.newsletterTitle' })}
            </h3>
            <p className={css.newsletterText}>
              {intl.formatMessage({ id: 'Footer.newsletterText' })}
            </p>
          </div>
          <NewsletterForm
            className={css.newsletterForm}
            onSubmit={values => {
              console.log('Newsletter subscription:', values);
            }}
          />
        </div>

        {/* Bottom Section */}
        <div className={css.bottomSection}>
          <div className={css.copyright}>
            {copyright?.content || `© ${currentYear} Kuratert. All rights reserved.`}
          </div>

          <div className={css.bottomLinks}>
            {BOTTOM_LINKS.map(link => (
              <NamedLink
                key={link.labelId}
                name={link.name}
                params={link.params}
                className={css.bottomLink}
              >
                {intl.formatMessage({ id: link.labelId })}
              </NamedLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
