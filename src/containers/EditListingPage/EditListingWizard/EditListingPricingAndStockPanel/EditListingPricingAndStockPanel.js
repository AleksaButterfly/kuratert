import React, { useState } from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT, STOCK_INFINITE_ITEMS, propTypes } from '../../../../util/types';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { isValidCurrencyForTransactionProcess } from '../../../../util/fieldHelpers';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';
import css from './EditListingPricingAndStockPanel.module.css';

const { Money } = sdkTypes;
const BILLIARD = 1000000000000000;

// Frame color options available for sellers
export const FRAME_COLOR_OPTIONS = [
  { key: 'black', label: 'Black' },
  { key: 'white', label: 'White' },
  { key: 'natural', label: 'Natural Wood' },
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'walnut', label: 'Walnut' },
];

const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
};

const getInitialValues = (props, marketplaceCurrency) => {
  const { listing, listingTypes } = props;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const price = listing?.attributes?.price;
  const currentStock = listing?.currentStock;

  const publicData = listing?.attributes?.publicData;
  const { acceptingOffers, isAuction, auctionEstimateLow, auctionEstimateHigh, auctionLink, isReserved } = publicData || {};
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingTypeConfig?.stockType);

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  // Note: infinite stock is refilled to billiard using "stockUpdateMaybe"
  const currentStockQuantity = currentStock?.attributes?.quantity;
  const stock =
    currentStockQuantity != null
      ? currentStockQuantity
      : isPublished
      ? 0
      : hasInfiniteStock
      ? BILLIARD
      : 1;
  const stockTypeInfinity = [];

  // Frame options - convert from publicData format to form format
  const frameOptions = publicData?.frameOptions;
  const frameEnabled = frameOptions?.enabled || false;
  const currency = marketplaceCurrency || price?.currency || 'EUR';

  // Find recommended frame (has isRecommended: true flag)
  const recommendedFrame = frameOptions?.variants?.find(v => v.isRecommended);
  const recommendedFrameLabel = recommendedFrame?.label || '';
  const recommendedFramePrice = recommendedFrame?.priceInSubunits
    ? new Money(recommendedFrame.priceInSubunits, currency)
    : null;

  // Get non-recommended frame variants
  const frameVariants = frameOptions?.variants
    ?.filter(v => !v.isRecommended)
    ?.map(v => ({
      color: v.color,
      price: new Money(v.priceInSubunits, currency),
    })) || [];

  // Convert boolean to array format for FieldCheckbox (checked = ['true'], unchecked = [])
  const acceptingOffersMaybe = acceptingOffers ? ['true'] : [];
  const isAuctionMaybe = isAuction ? ['true'] : [];
  const isReservedMaybe = isReserved ? ['true'] : [];

  // Convert auction estimate values from subunits to Money objects
  const auctionEstimateLowMoney = auctionEstimateLow ? new Money(auctionEstimateLow, currency) : null;
  const auctionEstimateHighMoney = auctionEstimateHigh ? new Money(auctionEstimateHigh, currency) : null;

  return {
    price,
    stock,
    stockTypeInfinity,
    frameEnabled,
    frameVariants,
    recommendedFrameLabel,
    recommendedFramePrice,
    acceptingOffers: acceptingOffersMaybe,
    isAuction: isAuctionMaybe,
    auctionEstimateLow: auctionEstimateLowMoney,
    auctionEstimateHigh: auctionEstimateHighMoney,
    auctionLink: auctionLink || '',
    isReserved: isReservedMaybe,
  };
};

/**
 * The EditListingPricingAndStockPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {string} props.marketplaceCurrency - The marketplace currency (e.g. 'USD')
 * @param {number} props.listingMinimumPriceSubUnits - The listing minimum price sub units
 * @param {Array<propTypes.listingType>} props.listingTypes - The listing types
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.submitButtonText - The submit button text
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Object} props.errors - The errors object
 * @returns {JSX.Element}
 */
const EditListingPricingAndStockPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    marketplaceCurrency,
    listingMinimumPriceSubUnits,
    listingTypes,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    updatePageTitle: UpdatePageTitle,
    intl,
  } = props;

  // State is needed since re-rendering would overwrite the values during XHR call.
  const [state, setState] = useState({ initialValues: getInitialValues(props, marketplaceCurrency) });

  const classes = classNames(rootClassName || css.root, className);
  const initialValues = state.initialValues;

  // Form needs to know data from listingType
  const publicData = listing?.attributes?.publicData;
  const unitType = publicData.unitType;
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  const transactionProcessAlias = listingTypeConfig.transactionType.alias;

  const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingTypeConfig?.stockType);

  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  // Don't render the form if the assigned currency is different from the marketplace currency
  // or if transaction process is incompatible with selected currency
  const isStripeCompatibleCurrency = isValidCurrencyForTransactionProcess(
    transactionProcessAlias,
    marketplaceCurrency,
    'stripe'
  );
  const priceCurrencyValid = !isStripeCompatibleCurrency
    ? false
    : marketplaceCurrency && initialValues.price instanceof Money
    ? initialValues.price?.currency === marketplaceCurrency
    : !!marketplaceCurrency;

  const panelHeadingProps = isPublished
    ? {
        id: 'EditListingPricingAndStockPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: 'EditListingPricingAndStockPanel.createListingTitle',
        values: { lineBreak: <br /> },
        messageProps: {},
      };

  return (
    <main className={classes}>
      <UpdatePageTitle
        panelHeading={intl.formatMessage(
          { id: panelHeadingProps.id },
          { ...panelHeadingProps.messageProps }
        )}
      />
      <H3 as="h1">
        <FormattedMessage id={panelHeadingProps.id} values={{ ...panelHeadingProps.values }} />
      </H3>
      {priceCurrencyValid ? (
        <EditListingPricingAndStockForm
          className={css.form}
          initialValues={initialValues}
          onSubmit={values => {
            const {
              price,
              stock,
              stockTypeInfinity,
              frameEnabled,
              frameVariants,
              recommendedFrameLabel,
              recommendedFramePrice,
              acceptingOffers,
              isAuction,
              auctionEstimateLow,
              auctionEstimateHigh,
              auctionLink,
              isReserved,
            } = values;

            // Convert checkbox arrays to booleans (checked = ['true'] -> true, unchecked = [] -> false)
            const isAcceptingOffers = Array.isArray(acceptingOffers) && acceptingOffers.includes('true');
            const isAuctionListing = Array.isArray(isAuction) && isAuction.includes('true');
            const isListingReserved = Array.isArray(isReserved) && isReserved.includes('true');

            // Extract auction estimate values (convert Money to subunits)
            const auctionEstimateLowSubunits = auctionEstimateLow?.amount || null;
            const auctionEstimateHighSubunits = auctionEstimateHigh?.amount || null;

            // Update stock only if the value has changed, or stock is infinity in stockType,
            // but not current stock is a small number (might happen with old listings)
            // NOTE: this is going to be used on a separate call to API
            // in EditListingPage.duck.js: sdk.stock.compareAndSet();

            const hasStockTypeInfinityChecked = stockTypeInfinity?.[0] === 'infinity';
            const hasNoCurrentStock = listing?.currentStock?.attributes?.quantity == null;
            const hasStockQuantityChanged = stock && stock !== initialValues.stock;
            // currentStockQuantity is null or undefined, return null - otherwise use the value
            const oldTotal = hasNoCurrentStock ? null : initialValues.stock;
            const stockUpdateMaybe =
              hasInfiniteStock && (hasNoCurrentStock || hasStockTypeInfinityChecked)
                ? {
                    stockUpdate: {
                      oldTotal,
                      newTotal: BILLIARD,
                    },
                  }
                : hasNoCurrentStock || hasStockQuantityChanged
                ? {
                    stockUpdate: {
                      oldTotal,
                      newTotal: stock,
                    },
                  }
                : {};

            // Frame options - convert from form format to publicData format
            // Money objects can't be stored in publicData, so we save priceInSubunits
            const allVariants = [];

            // Add recommended frame first if it has all required fields
            const hasRecommendedFrame = recommendedFrameLabel && recommendedFramePrice?.amount;
            if (hasRecommendedFrame) {
              // Generate ID from label: lowercase, replace spaces with dashes
              const recommendedId = `recommended-${recommendedFrameLabel.toLowerCase().replace(/\s+/g, '-')}`;
              allVariants.push({
                id: recommendedId,
                label: recommendedFrameLabel,
                priceInSubunits: recommendedFramePrice.amount,
                isRecommended: true,
              });
            }

            // Add additional frame variants
            if (frameVariants?.length > 0) {
              frameVariants.forEach(v => {
                if (v.color && v.price?.amount) {
                  allVariants.push({
                    id: v.color,
                    color: v.color,
                    label: FRAME_COLOR_OPTIONS.find(o => o.key === v.color)?.label || v.color,
                    priceInSubunits: v.price.amount,
                    isRecommended: false,
                  });
                }
              });
            }

            const frameOptionsData = frameEnabled && allVariants.length > 0
              ? {
                  frameOptions: {
                    enabled: true,
                    variants: allVariants,
                  },
                }
              : { frameOptions: { enabled: false, variants: [] } };

            // For auction listings, we still need a price for the API, use low estimate as placeholder
            const listingPrice = isAuctionListing ? auctionEstimateLow : price;

            // New values for listing attributes
            const updateValues = {
              price: listingPrice,
              ...stockUpdateMaybe,
              publicData: {
                ...frameOptionsData,
                acceptingOffers: isAuctionListing ? false : isAcceptingOffers,
                isAuction: isAuctionListing,
                auctionEstimateLow: isAuctionListing ? auctionEstimateLowSubunits : null,
                auctionEstimateHigh: isAuctionListing ? auctionEstimateHighSubunits : null,
                auctionLink: isAuctionListing ? (auctionLink || null) : null,
                isReserved: isListingReserved,
              },
            };
            // Save the initialValues to state
            // Otherwise, re-rendering would overwrite the values during XHR call.
            setState({
              initialValues: {
                price: listingPrice,
                stock: stockUpdateMaybe?.stockUpdate?.newTotal || stock,
                stockTypeInfinity,
                frameEnabled,
                frameVariants,
                recommendedFrameLabel,
                recommendedFramePrice,
                acceptingOffers,
                isAuction,
                auctionEstimateLow,
                auctionEstimateHigh,
                auctionLink,
                isReserved,
              },
            });
            onSubmit(updateValues);
          }}
          listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
          marketplaceCurrency={marketplaceCurrency}
          listingType={listingTypeConfig}
          unitType={unitType}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
        />
      ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage
            id="EditListingPricingAndStockPanel.listingPriceCurrencyInvalid"
            values={{ marketplaceCurrency }}
          />
        </div>
      )}
    </main>
  );
};

export default EditListingPricingAndStockPanel;
