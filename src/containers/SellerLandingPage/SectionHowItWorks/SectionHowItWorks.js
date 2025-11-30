import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './SectionHowItWorks.module.css';

const steps = [
  { number: 1, titleId: 'step1.title', descriptionId: 'step1.description' },
  { number: 2, titleId: 'step2.title', descriptionId: 'step2.description' },
  { number: 3, titleId: 'step3.title', descriptionId: 'step3.description' },
  { number: 4, titleId: 'step4.title', descriptionId: 'step4.description' },
];

const SectionHowItWorks = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <div className={css.container}>
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage id="SellerLandingPage.SectionHowItWorks.title" />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage id="SellerLandingPage.SectionHowItWorks.subtitle" />
          </p>
        </div>
        <div className={css.stepsWrapper}>
          <div className={css.connectingLine} />
          <div className={css.grid}>
            {steps.map((step, index) => (
              <div key={index} className={css.card}>
                <div className={css.numberBadge}>
                  <span className={css.number}>{step.number}</span>
                </div>
                <h3 className={css.cardTitle}>
                  <FormattedMessage id={`SellerLandingPage.SectionHowItWorks.${step.titleId}`} />
                </h3>
                <p className={css.cardDescription}>
                  <FormattedMessage id={`SellerLandingPage.SectionHowItWorks.${step.descriptionId}`} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

SectionHowItWorks.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHowItWorks;
