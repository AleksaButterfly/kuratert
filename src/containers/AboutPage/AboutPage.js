import React from 'react';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { useSelector } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './AboutPage.module.css';

// Team member images (only for those we have)
import team1 from './images/team-1.avif';
import team2 from './images/team-2.avif';
import team3 from './images/team-3.avif';

const teamMembers = [
  {
    name: 'Cornelia Svedman',
    role: 'Founder & CEO',
    image: team1,
  },
  {
    name: 'Rep. gallerist',
    role: 'Advisory Board - gallerist',
    image: team2,
  },
  {
    name: 'Rep. auksjon',
    role: 'Advisory Board - auksjon',
    image: team3,
  },
  {
    name: 'Rep. rådgiver',
    role: 'Advisory Board - rådgiver',
    image: null,
  },
  {
    name: 'Rep. Museum',
    role: 'Advisory Board - museum',
    image: null,
  },
  {
    name: 'Rep. Bergen',
    role: 'Advisory Board - Bergen',
    image: null,
  },
  {
    name: 'Rep. Stavanger',
    role: 'Advisory Board - Stavanger',
    image: null,
  },
  {
    name: 'Rep. Trondheim',
    role: 'Advisory Board - Trondheim',
    image: null,
  },
];

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

          {/* Section 2: Who We Are */}
          <section className={css.sectionWhoWeAre}>
            <div className={css.sectionContent}>
              <h2 className={css.whoWeAreTitle}>
                {intl.formatMessage({ id: 'AboutPage.whoWeAreTitle' })}
              </h2>
              <p className={css.whoWeAreSubtitle}>
                {intl.formatMessage({ id: 'AboutPage.whoWeAreSubtitle' })}
              </p>

              {/* Team Grid */}
              <div className={css.teamGrid}>
                {teamMembers.map((member, index) => (
                  <div key={index} className={css.teamMember}>
                    <div className={css.teamImageWrapper}>
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className={css.teamImage}
                        />
                      ) : (
                        <div className={css.teamImagePlaceholder} />
                      )}
                    </div>
                    <h3 className={css.teamName}>{member.name}</h3>
                    <p className={css.teamRole}>{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default AboutPage;
