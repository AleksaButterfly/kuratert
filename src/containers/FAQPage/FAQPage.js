import React, { useState } from 'react';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { useSelector } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './FAQPage.module.css';

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconMinus = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// FAQ items - questions and answers are translation keys
const faqItems = [
  {
    questionId: 'FAQPage.question1',
    answerId: 'FAQPage.answer1',
  },
  {
    questionId: 'FAQPage.question2',
    answerId: 'FAQPage.answer2',
  },
  {
    questionId: 'FAQPage.question3',
    answerId: 'FAQPage.answer3',
  },
  {
    questionId: 'FAQPage.question4',
    answerId: 'FAQPage.answer4',
  },
  {
    questionId: 'FAQPage.question5',
    answerId: 'FAQPage.answer5',
  },
  {
    questionId: 'FAQPage.question6',
    answerId: 'FAQPage.answer6',
  },
  {
    questionId: 'FAQPage.question7',
    answerId: 'FAQPage.answer7',
  },
  {
    questionId: 'FAQPage.question8',
    answerId: 'FAQPage.answer8',
  },
];

const FAQItem = ({ questionId, answerId, isOpen, onToggle, intl }) => {
  return (
    <div className={css.faqItem}>
      <button
        className={css.faqQuestion}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={css.questionText}>
          {intl.formatMessage({ id: questionId })}
        </span>
        <span className={css.toggleIcon}>
          {isOpen ? <IconMinus /> : <IconPlus />}
        </span>
      </button>
      {isOpen && (
        <div className={css.faqAnswer}>
          <p className={css.answerText}>
            {intl.formatMessage({ id: answerId })}
          </p>
        </div>
      )}
    </div>
  );
};

const FAQPage = () => {
  const intl = useIntl();
  const config = useConfiguration();
  const scrollingDisabled = useSelector(state => isScrollingDisabled(state));
  const [openIndex, setOpenIndex] = useState(null);

  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'FAQPage.schemaTitle' },
    { marketplaceName }
  );
  const schemaDescription = intl.formatMessage(
    { id: 'FAQPage.schemaDescription' },
    { marketplaceName }
  );

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      description={schemaDescription}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'FAQPage',
        name: schemaTitle,
        description: schemaDescription,
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: intl.formatMessage({ id: item.questionId }),
          acceptedAnswer: {
            '@type': 'Answer',
            text: intl.formatMessage({ id: item.answerId }),
          },
        })),
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
                {intl.formatMessage({ id: 'FAQPage.heroTitle' })}
              </h1>
              <p className={css.heroSubtitle}>
                {intl.formatMessage({ id: 'FAQPage.heroSubtitle' })}
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className={css.faqSection}>
            <div className={css.faqContainer}>
              {faqItems.map((item, index) => (
                <FAQItem
                  key={index}
                  questionId={item.questionId}
                  answerId={item.answerId}
                  isOpen={openIndex === index}
                  onToggle={() => handleToggle(index)}
                  intl={intl}
                />
              ))}
            </div>
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default FAQPage;
