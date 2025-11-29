import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';

import css from './SectionSeller.module.css';

const SectionSeller = props => {
  const intl = useIntl();
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  const title = intl.formatMessage({ id: 'SectionSeller.title' });
  const subtitle = intl.formatMessage({ id: 'SectionSeller.subtitle' });
  const buttonText = intl.formatMessage({ id: 'SectionSeller.buttonText' });

  return (
    <section className={classes}>
      <div className={css.sectionContent}>
        <h2 className={css.title}>{title}</h2>
        <p className={css.subtitle}>{subtitle}</p>
        <NamedLink name="NewListingPage" className={css.button}>
          {buttonText}
        </NamedLink>
      </div>
    </section>
  );
};

SectionSeller.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionSeller;
