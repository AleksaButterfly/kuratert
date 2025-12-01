import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { useIntl } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';

import css from './SectionCategories.module.css';

const getCategoryImage = categoryId => {
  try {
    return require(`./images/${categoryId}.avif`);
  } catch (e) {
    return null;
  }
};

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const CategoryCard = ({ category, intl }) => {
  const { id, name } = category;
  const categoryImage = getCategoryImage(id);

  const piecesCount = intl.formatMessage(
    { id: 'SectionCategories.piecesCount' },
    { count: Math.floor(Math.random() * 2000) + 500 }
  );

  if (!categoryImage) {
    return null;
  }

  return (
    <NamedLink
      name="SearchPage"
      to={{ search: `?pub_categoryLevel1=${id}` }}
      className={css.categoryCard}
    >
      <div className={css.cardImageWrapper}>
        <img src={categoryImage} alt={name} className={css.cardImage} />
        <div className={css.cardOverlay} />
        <div className={css.cardContent}>
          <h3 className={css.cardTitle}>{name}</h3>
          <p className={css.cardPieces}>{piecesCount}</p>
        </div>
      </div>
    </NamedLink>
  );
};

const SectionCategories = props => {
  const intl = useIntl();
  const config = useConfiguration();
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  const categories = config?.categoryConfiguration?.categories || [];
  const topLevelCategories = categories.filter(cat => !cat.parentId).slice(0, 4);

  const sectionTitle = intl.formatMessage({ id: 'SectionCategories.title' });
  const sectionSubtitle = intl.formatMessage({ id: 'SectionCategories.subtitle' });
  const viewAllText = intl.formatMessage({ id: 'SectionCategories.viewAll' });

  if (topLevelCategories.length === 0) {
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
          <NamedLink name="SearchPage" className={css.viewAllLink}>
            <span>{viewAllText}</span>
            <IconArrowRight />
          </NamedLink>
        </div>

        <div className={css.categoriesGrid}>
          {topLevelCategories.map(category => (
            <CategoryCard key={category.id} category={category} intl={intl} />
          ))}
        </div>
      </div>
    </section>
  );
};

SectionCategories.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionCategories;
