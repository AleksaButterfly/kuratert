import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';

import css from './SectionEditorial.module.css';

// Placeholder images - replace with actual images
import editorial1 from './images/editorial-1.jpg';
import editorial2 from './images/editorial-2.jpg';
import editorial3 from './images/editorial-3.jpg';

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="6" r="5.5" stroke="currentColor" fill="none" />
    <path d="M6 3V6L8 8" stroke="currentColor" strokeLinecap="round" fill="none" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const ArticleCard = ({ image, category, readTime, title, description, isLarge }) => {
  const cardClasses = classNames(css.articleCard, {
    [css.articleCardLarge]: isLarge,
  });

  return (
    <article className={cardClasses}>
      <div className={css.cardImageWrapper}>
        <img src={image} alt={title} className={css.cardImage} />
        <div className={css.cardOverlay} />
        <div className={css.cardContent}>
          <div className={css.cardMeta}>
            <span className={css.cardCategory}>{category}</span>
            <span className={css.cardDot}>•</span>
            <span className={css.cardReadTime}>
              <IconClock />
              {readTime}
            </span>
          </div>
          <h3 className={css.cardTitle}>{title}</h3>
          <p className={css.cardDescription}>{description}</p>
        </div>
      </div>
    </article>
  );
};

const SectionEditorial = props => {
  const intl = useIntl();
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  const sectionTitle = intl.formatMessage({ id: 'SectionEditorial.title' });
  const sectionSubtitle = intl.formatMessage({ id: 'SectionEditorial.subtitle' });
  const allArticlesText = intl.formatMessage({ id: 'SectionEditorial.allArticles' });

  // Article data - this could come from props or an API in the future
  const articles = [
    {
      id: 1,
      image: editorial1,
      category: intl.formatMessage({ id: 'SectionEditorial.article1.category' }),
      readTime: intl.formatMessage({ id: 'SectionEditorial.article1.readTime' }),
      title: intl.formatMessage({ id: 'SectionEditorial.article1.title' }),
      description: intl.formatMessage({ id: 'SectionEditorial.article1.description' }),
      isLarge: true,
    },
    {
      id: 2,
      image: editorial2,
      category: intl.formatMessage({ id: 'SectionEditorial.article2.category' }),
      readTime: intl.formatMessage({ id: 'SectionEditorial.article2.readTime' }),
      title: intl.formatMessage({ id: 'SectionEditorial.article2.title' }),
      description: intl.formatMessage({ id: 'SectionEditorial.article2.description' }),
      isLarge: false,
    },
    {
      id: 3,
      image: editorial3,
      category: intl.formatMessage({ id: 'SectionEditorial.article3.category' }),
      readTime: intl.formatMessage({ id: 'SectionEditorial.article3.readTime' }),
      title: intl.formatMessage({ id: 'SectionEditorial.article3.title' }),
      description: intl.formatMessage({ id: 'SectionEditorial.article3.description' }),
      isLarge: false,
    },
  ];

  return (
    <section className={classes}>
      <div className={css.sectionContent}>
        <div className={css.sectionHeader}>
          <div className={css.headerText}>
            <h2 className={css.sectionTitle}>{sectionTitle}</h2>
            <p className={css.sectionSubtitle}>{sectionSubtitle}</p>
          </div>
          <a href="/articles" className={css.allArticlesLink}>
            <span>{allArticlesText}</span>
            <IconArrowRight />
          </a>
        </div>

        <div className={css.articlesGrid}>
          <div className={css.mainArticle}>
            <ArticleCard {...articles[0]} />
          </div>
          <div className={css.sideArticles}>
            <ArticleCard {...articles[1]} />
            <ArticleCard {...articles[2]} />
          </div>
        </div>
      </div>
    </section>
  );
};

SectionEditorial.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionEditorial;
