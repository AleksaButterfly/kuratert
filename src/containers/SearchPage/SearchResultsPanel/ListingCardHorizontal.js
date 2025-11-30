import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage } from '../../../util/reactIntl';
import { displayPrice, isPriceVariationsEnabled } from '../../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../../util/uiHelpers';
import { formatMoney } from '../../../util/currency';
import { ensureListing, ensureUser } from '../../../util/data';
import { richText } from '../../../util/richText';
import { createSlug } from '../../../util/urlHelpers';
import { isBookingProcessAlias } from '../../../transactions/transaction';

import { AspectRatioWrapper, NamedLink, ResponsiveImage } from '../../../components';

import css from './ListingCardHorizontal.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

/**
 * ListingCardHorizontal - A horizontal list view card for listings
 */
const ListingCardHorizontal = props => {
  const { className, rootClassName, listing, renderSizes, intl } = props;
  const config = useConfiguration();
  const classes = classNames(rootClassName || css.root, className);

  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price, publicData } = currentListing.attributes;
  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;

  const listingType = publicData?.listingType;
  const listingTypeConfig = config.listing.listingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(listingTypeConfig);

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;
  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);

  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const { aspectWidth = 1, aspectHeight = 1 } = config.layout?.listingImage || {};

  // Description - take first 150 characters
  const description = currentListing.attributes.description || '';
  const shortDescription = description.length > 150
    ? `${description.substring(0, 150)}...`
    : description;

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      <div className={css.imageWrapper}>
        <AspectRatioWrapper width={aspectWidth} height={aspectHeight} className={css.aspectWrapper}>
          <LazyImage
            rootClassName={css.rootForImage}
            alt={title}
            image={firstImage}
            variants={['scaled-small', 'scaled-medium']}
            sizes={renderSizes}
          />
        </AspectRatioWrapper>
      </div>
      <div className={css.content}>
        <div className={css.mainInfo}>
          <h3 className={css.title}>
            {richText(title, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
          </h3>
          {authorName ? (
            <p className={css.authorName}>
              <FormattedMessage id="ListingCardHorizontal.byAuthor" values={{ authorName }} />
            </p>
          ) : null}
          {shortDescription ? (
            <p className={css.description}>{shortDescription}</p>
          ) : null}
        </div>
        {showPrice && formattedPrice ? (
          <div className={css.priceWrapper}>
            <span className={css.price} title={priceTitle}>
              {hasMultiplePriceVariants ? (
                <FormattedMessage
                  id="ListingCard.priceStartingFrom"
                  values={{
                    priceValue: <span className={css.priceValue}>{formattedPrice}</span>,
                    pricePerUnit: isBookable ? (
                      <span className={css.perUnit}>
                        <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
                      </span>
                    ) : ''
                  }}
                />
              ) : (
                <span className={css.priceValue}>{formattedPrice}</span>
              )}
            </span>
          </div>
        ) : null}
      </div>
    </NamedLink>
  );
};

export default ListingCardHorizontal;
