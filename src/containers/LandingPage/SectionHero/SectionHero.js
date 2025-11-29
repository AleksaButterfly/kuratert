import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useIntl } from '../../../util/reactIntl';
import { createResourceLocatorString } from '../../../util/routes';
import { getSearchPageResourceLocatorStringParams } from '../../SearchPage/SearchPage.shared';

import HeroSearchForm from './HeroSearchForm/HeroSearchForm';

import css from './SectionHero.module.css';

const SectionHero = props => {
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const routeConfiguration = useRouteConfiguration();

  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  const title = intl.formatMessage({ id: 'SectionHero.title' });
  const subtitle = intl.formatMessage({ id: 'SectionHero.subtitle' });

  const handleSearchSubmit = values => {
    const searchParams = { keywords: values?.keywords };
    const { routeName, pathParams } = getSearchPageResourceLocatorStringParams(
      routeConfiguration,
      location
    );

    history.push(
      createResourceLocatorString(routeName, routeConfiguration, pathParams, searchParams)
    );
  };

  return (
    <div className={classes}>
      <div className={css.overlay} />
      <div className={css.heroContent}>
        <h1 className={css.heroTitle}>{title}</h1>
        <p className={css.heroSubtitle}>{subtitle}</p>
        <HeroSearchForm
          className={css.searchForm}
          onSubmit={handleSearchSubmit}
        />
      </div>
      <div className={css.scrollIndicator}>
        <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="38" rx="11" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="4" fill="white" className={css.scrollDot}/>
        </svg>
      </div>
    </div>
  );
};

SectionHero.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHero;
