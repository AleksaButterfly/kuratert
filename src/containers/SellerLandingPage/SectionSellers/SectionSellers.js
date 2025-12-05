import React from 'react';
import { array, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { Avatar, NamedLink } from '../../../components';

import css from './SectionSellers.module.css';

const SectionSellers = props => {
  const { rootClassName, className, sellers } = props;
  const classes = classNames(rootClassName || css.root, className);

  if (!sellers || sellers.length === 0) {
    return null;
  }

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
          {sellers.map((seller, index) => {
            const { id, attributes, profileImage } = seller;
            const { profile } = attributes || {};
            const { displayName, publicData } = profile || {};
            const { userType } = publicData || {};

            // Create a user-like object for Avatar component
            const userForAvatar = {
              id,
              type: 'user',
              attributes: {
                profile: {
                  displayName,
                  abbreviatedName: displayName?.charAt(0) || '?',
                },
              },
              profileImage,
            };

            return (
              <NamedLink
                key={id?.uuid || index}
                name="ProfilePage"
                params={{ id: id?.uuid }}
                className={css.card}
              >
                <Avatar
                  className={css.avatar}
                  user={userForAvatar}
                  disableProfileLink
                />
                <div className={css.cardContent}>
                  <h3 className={css.sellerName}>{displayName || 'Seller'}</h3>
                  <p className={css.sellerType}>Gallery</p>
                </div>
              </NamedLink>
            );
          })}
        </div>
      </div>
    </section>
  );
};

SectionSellers.propTypes = {
  rootClassName: string,
  className: string,
  sellers: array,
};

export default SectionSellers;
