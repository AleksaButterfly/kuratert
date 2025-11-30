import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';

import css from './SectionSellers.module.css';

const sellers = [
  { name: 'ARTEMIS', type: 'Gallery' },
  { name: 'MODERN', type: 'Collective' },
  { name: 'VAULT', type: 'Arts' },
  { name: 'ATELIER', type: 'Studio' },
  { name: 'LUMIÈRE', type: 'Gallery' },
  { name: 'APEX', type: 'Design' },
];

const SectionSellers = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <div className={css.container}>
        <div className={css.header}>
          <p className={css.label}>
            <FormattedMessage id="SellerLandingPage.SectionSellers.label" />
          </p>
          <h2 className={css.title}>
            <FormattedMessage id="SellerLandingPage.SectionSellers.title" />
          </h2>
        </div>
        <div className={css.grid}>
          {sellers.map((seller, index) => (
            <div key={index} className={css.card}>
              <div className={css.imagePlaceholder} />
              <div className={css.cardContent}>
                <h3 className={css.sellerName}>{seller.name}</h3>
                <p className={css.sellerType}>{seller.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

SectionSellers.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionSellers;
