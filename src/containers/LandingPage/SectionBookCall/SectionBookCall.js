import React from 'react';
import { useIntl } from '../../../util/reactIntl';

import css from './SectionBookCall.module.css';

const SectionBookCall = () => {
  const intl = useIntl();

  return (
    <section className={css.root}>
      <div className={css.content}>
        <h2 className={css.title}>
          {intl.formatMessage({ id: 'SectionBookCall.title' })}
        </h2>
        <p className={css.subtitle}>
          {intl.formatMessage({ id: 'SectionBookCall.subtitle' })}
        </p>
        <a
          href="https://calendly.com/cornelia-corneliasvedman"
          target="_blank"
          rel="noopener noreferrer"
          className={css.button}
        >
          {intl.formatMessage({ id: 'SectionBookCall.button' })}
        </a>
      </div>
    </section>
  );
};

export default SectionBookCall;
