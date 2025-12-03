import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, LayoutSingleColumn, NamedLink, PaginationLinks } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ArticlesPage.module.css';

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="6" r="5.5" stroke="currentColor" fill="none" />
    <path d="M6 3V6L8 8" stroke="currentColor" strokeLinecap="round" fill="none" />
  </svg>
);

const ArticleCard = ({ article, intl }) => {
  const { title, slug, excerpt, image, category, readTime } = article;

  return (
    <NamedLink name="ArticlePage" params={{ slug }} className={css.articleCard}>
      <div className={css.cardImageWrapper}>
        {image ? (
          <img src={image} alt={title} className={css.cardImage} />
        ) : (
          <div className={css.cardImagePlaceholder} />
        )}
      </div>
      <div className={css.cardContent}>
        <div className={css.cardMeta}>
          <span className={css.cardCategory}>{category}</span>
          <span className={css.cardDot}>•</span>
          <span className={css.cardReadTime}>
            <IconClock />
            {intl.formatMessage({ id: 'ArticlesPage.readTime' }, { minutes: readTime })}
          </span>
        </div>
        <h3 className={css.cardTitle}>{title}</h3>
        <p className={css.cardExcerpt}>{excerpt}</p>
      </div>
    </NamedLink>
  );
};

export const ArticlesPageComponent = props => {
  const {
    scrollingDisabled,
    articles,
    categories,
    pagination,
    fetchInProgress,
    fetchError,
    location,
    history,
  } = props;

  const intl = useIntl();
  const config = useConfiguration();
  const marketplaceName = config.marketplaceName;

  const searchParams = new URLSearchParams(location.search);
  const activeCategory = searchParams.get('category') || '';

  const handleCategoryChange = categorySlug => {
    const params = new URLSearchParams();
    if (categorySlug) {
      params.set('category', categorySlug);
    }
    history.push({ pathname: location.pathname, search: params.toString() });
  };

  const schemaTitle = intl.formatMessage(
    { id: 'ArticlesPage.schemaTitle' },
    { marketplaceName }
  );
  const schemaDescription = intl.formatMessage(
    { id: 'ArticlesPage.schemaDescription' },
    { marketplaceName }
  );

  const paginationLinks =
    pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="ArticlesPage"
        pageSearchParams={activeCategory ? { category: activeCategory } : {}}
        pagination={pagination}
      />
    ) : null;

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      description={schemaDescription}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'CollectionPage',
        name: schemaTitle,
        description: schemaDescription,
      }}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          {/* Header */}
          <header className={css.header}>
            <h1 className={css.title}>
              {intl.formatMessage({ id: 'ArticlesPage.title' })}
            </h1>
            <p className={css.subtitle}>
              {intl.formatMessage({ id: 'ArticlesPage.subtitle' })}
            </p>
          </header>

          {/* Category filters */}
          {categories.length > 0 && (
            <div className={css.categoryFilters}>
              <button
                className={classNames(css.categoryButton, {
                  [css.categoryButtonActive]: !activeCategory,
                })}
                onClick={() => handleCategoryChange('')}
              >
                {intl.formatMessage({ id: 'ArticlesPage.allCategories' })}
              </button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  className={classNames(css.categoryButton, {
                    [css.categoryButtonActive]: activeCategory === cat.slug,
                  })}
                  onClick={() => handleCategoryChange(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {fetchInProgress && (
            <div className={css.loading}>
              <p>{intl.formatMessage({ id: 'ArticlesPage.loading' })}</p>
            </div>
          )}

          {/* Error state */}
          {fetchError && !fetchInProgress && (
            <div className={css.error}>
              <p>{intl.formatMessage({ id: 'ArticlesPage.error' })}</p>
            </div>
          )}

          {/* Articles grid */}
          {!fetchInProgress && !fetchError && (
            <>
              {articles.length > 0 ? (
                <div className={css.articlesGrid}>
                  {articles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      intl={intl}
                    />
                  ))}
                </div>
              ) : (
                <div className={css.noArticles}>
                  <p>{intl.formatMessage({ id: 'ArticlesPage.noArticles' })}</p>
                </div>
              )}

              {paginationLinks}
            </>
          )}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { articles, categories, pagination, fetchInProgress, fetchError } = state.ArticlesPage;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    articles,
    categories,
    pagination,
    fetchInProgress,
    fetchError,
  };
};

const ArticlesPage = compose(
  withRouter,
  connect(mapStateToProps)
)(ArticlesPageComponent);

export default ArticlesPage;
