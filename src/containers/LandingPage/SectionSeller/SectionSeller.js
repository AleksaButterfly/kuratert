import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';

import css from './SectionSeller.module.css';

const SectionSeller = props => {
  const intl = useIntl();
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  const sectionTitle = intl.formatMessage({ id: 'SectionSeller.sectionTitle' });
  const subtitle = intl.formatMessage({ id: 'SectionSeller.subtitle' });
  const footerText = intl.formatMessage({ id: 'SectionSeller.footerText' });

  return (
    <section className={classes}>
      <div className={css.sectionContent}>
        <h2 className={css.title}>{sectionTitle}</h2>
        <p className={css.subtitle}>{subtitle}</p>
        <div className={css.logosGrid}>
          {/* Partner logos will be added here */}
        </div>
        <p className={css.footerText}>{footerText}</p>
      </div>
    </section>
  );
};

SectionSeller.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionSeller;
