import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, LayoutSingleColumn, NamedLink } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import css from './ArticlePage.module.css';

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const ArticlePageComponent = props => {
  const {
    scrollingDisabled,
    article,
    fetchInProgress,
    fetchError,
  } = props;

  const intl = useIntl();
  const config = useConfiguration();
  const marketplaceName = config.marketplaceName;

  // Handle loading state
  if (fetchInProgress) {
    return (
      <Page
        scrollingDisabled={scrollingDisabled}
        title={intl.formatMessage({ id: 'ArticlePage.loadingTitle' })}
      >
        <LayoutSingleColumn
          topbar={<TopbarContainer />}
          footer={<FooterContainer />}
        >
          <div className={css.loading}>
            <p>{intl.formatMessage({ id: 'ArticlePage.loading' })}</p>
          </div>
        </LayoutSingleColumn>
      </Page>
    );
  }

  // Handle error/not found
  if (fetchError || !article) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  const {
    title,
    excerpt,
    content,
    image,
    category,
    categorySlug,
    readTime,
    publishedAt,
  } = article;

  // Format date
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const schemaTitle = intl.formatMessage(
    { id: 'ArticlePage.schemaTitle' },
    { title, marketplaceName }
  );

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      description={excerpt}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'Article',
        name: title,
        description: excerpt,
        image: image,
        datePublished: publishedAt,
      }}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <article className={css.article}>
          {/* Back link */}
          <div className={css.backLink}>
            <NamedLink name="ArticlesPage">
              <IconArrowLeft />
              <span>{intl.formatMessage({ id: 'ArticlePage.backToArticles' })}</span>
            </NamedLink>
          </div>

          {/* Article header */}
          <header className={css.header}>
            <div className={css.meta}>
              <NamedLink
                name="ArticlesPage"
                to={{ search: `?category=${categorySlug}` }}
                className={css.category}
              >
                {category}
              </NamedLink>
              <span className={css.dot}>•</span>
              <span className={css.readTime}>
                <IconClock />
                {intl.formatMessage({ id: 'ArticlePage.readTime' }, { minutes: readTime })}
              </span>
              {formattedDate && (
                <>
                  <span className={css.dot}>•</span>
                  <span className={css.date}>{formattedDate}</span>
                </>
              )}
            </div>
            <h1 className={css.title}>{title}</h1>
            {excerpt && <p className={css.excerpt}>{excerpt}</p>}
          </header>

          {/* Featured image */}
          {image && (
            <div className={css.imageWrapper}>
              <img src={image} alt={title} className={css.image} />
            </div>
          )}

          {/* Article content */}
          <div
            className={css.content}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { article, fetchInProgress, fetchError } = state.ArticlePage;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    article,
    fetchInProgress,
    fetchError,
  };
};

const ArticlePage = compose(
  withRouter,
  connect(mapStateToProps)
)(ArticlePageComponent);

export default ArticlePage;
