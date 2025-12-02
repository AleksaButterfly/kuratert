import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../../../../context/configurationContext';
import { NamedLink } from '../../../../../components';

import css from './CategoryLinks.module.css';

const CategoryLinks = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);
  const config = useConfiguration();

  // Get categories from hosted configuration (limit to 6 for desktop topbar)
  const categories = config?.categoryConfiguration?.categories || [];
  const topLevelCategories = categories.filter(cat => !cat.parentId).slice(0, 6);

  if (topLevelCategories.length === 0) {
    return null;
  }

  return (
    <div className={classes}>
      {topLevelCategories.map(category => (
        <NamedLink
          key={category.id}
          name="SearchPage"
          to={{ search: `?pub_categoryLevel1=${category.id}` }}
          className={css.categoryLink}
        >
          {category.name}
        </NamedLink>
      ))}
    </div>
  );
};

export default CategoryLinks;
