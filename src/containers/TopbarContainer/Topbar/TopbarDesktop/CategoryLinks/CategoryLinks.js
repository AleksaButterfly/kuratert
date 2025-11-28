import React from 'react';
import classNames from 'classnames';

import { NamedLink } from '../../../../../components';
import { TOPBAR_CATEGORIES } from '../../../../../util/topbarCategories';

import css from './CategoryLinks.module.css';

const CategoryLinks = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      {TOPBAR_CATEGORIES.map(category => (
        <NamedLink
          key={category.key}
          name="SearchPage"
          to={{ search: `?pub_category=${category.key}` }}
          className={css.categoryLink}
        >
          {category.label}
        </NamedLink>
      ))}
    </div>
  );
};

export default CategoryLinks;
