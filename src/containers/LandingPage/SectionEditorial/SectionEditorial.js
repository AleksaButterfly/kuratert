import React from 'react';
import { string, array, bool } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';

import css from './SectionEditorial.module.css';

// Fallback images for when no articles from CMS
import editorial1 from './images/editorial-1.avif';
import editorial2 from './images/editorial-2.avif';
import editorial3 from './images/editorial-3.avif';

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

const ArticleCard = ({ image, category, readTime, title, description, isLarge, slug, intl }) => {
  const cardClasses = classNames(css.articleCard, {
    [css.articleCardLarge]: isLarge,
  });

  const readTimeText = typeof readTime === 'number'
    ? intl.formatMessage({ id: 'SectionEditorial.readTime' }, { minutes: readTime })
    : readTime;

  const CardWrapper = slug ? NamedLink : 'div';
  const cardProps = slug ? { name: 'ArticlePage', params: { slug }, className: cardClasses } : { className: cardClasses };

  return (
    <CardWrapper {...cardProps}>
      <article className={slug ? undefined : cardClasses}>
        <div className={css.cardImageWrapper}>
          <img src={image} alt={title} className={css.cardImage} />
          <div className={css.cardOverlay} />
          <div className={css.cardContent}>
            <div className={css.cardMeta}>
              <span className={css.cardCategory}>{category}</span>
              <span className={css.cardDot}>•</span>
              <span className={css.cardReadTime}>
                <IconClock />
                {readTimeText}
              </span>
            </div>
            <h3 className={css.cardTitle}>{title}</h3>
            <p className={css.cardDescription}>{description}</p>
          </div>
        </div>
      </article>
    </CardWrapper>
  );
};

const SectionEditorial = props => {
  const intl = useIntl();
  const { rootClassName, className, articles: apiArticles = [], isLoading = false } = props;
  const classes = classNames(rootClassName || css.root, className);

  const sectionTitle = intl.formatMessage({ id: 'SectionEditorial.title' });
  const sectionSubtitle = intl.formatMessage({ id: 'SectionEditorial.subtitle' });
  const allArticlesText = intl.formatMessage({ id: 'SectionEditorial.allArticles' });

  // Fallback article data when no articles from CMS
  const fallbackArticles = [
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

  // Use API articles if available, otherwise use fallback
  // Map API articles to the format expected by ArticleCard
  const articles = apiArticles.length > 0
    ? apiArticles.map((article, index) => ({
        id: article.id,
        image: article.image,
        category: article.category,
        readTime: article.readTime,
        title: article.title,
        description: article.excerpt,
        slug: article.slug,
        isLarge: article.featuredPosition === 1 || index === 0,
      }))
    : fallbackArticles;

  // Get articles for display (main + 2 side)
  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 3);

  // Don't render if loading or no articles
  if (isLoading) {
    return null;
  }

  return (
    <section className={classes}>
      <div className={css.sectionContent}>
        <div className={css.sectionHeader}>
          <div className={css.headerText}>
            <h2 className={css.sectionTitle}>{sectionTitle}</h2>
            <p className={css.sectionSubtitle}>{sectionSubtitle}</p>
          </div>
          <NamedLink name="ArticlesPage" className={css.allArticlesLink}>
            <span>{allArticlesText}</span>
            <IconArrowRight />
          </NamedLink>
        </div>

        <div className={css.articlesGrid}>
          {mainArticle && (
            <div className={css.mainArticle}>
              <ArticleCard {...mainArticle} intl={intl} />
            </div>
          )}
          {sideArticles.length > 0 && (
            <div className={css.sideArticles}>
              {sideArticles.map(article => (
                <ArticleCard key={article.id} {...article} intl={intl} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

SectionEditorial.propTypes = {
  rootClassName: string,
  className: string,
  articles: array,
  isLoading: bool,
};

export default SectionEditorial;
