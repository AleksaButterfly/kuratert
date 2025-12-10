import React, { useState } from 'react';
import { arrayOf, bool, func } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { pickCategoryFields } from '../../util/fieldHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { removeListingFromCart, updateCartItemQuantity } from '../../ducks/user.duck';
import { getCartItems } from '../../util/userHelpers';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import { createSlug } from '../../util/urlHelpers';
import { setInitialValues as setCheckoutInitialValues } from '../CheckoutPage/CheckoutPage.duck';
import { removeListingFromCartOptimistic } from './CartPage.duck';
import {
  getCartDeliveryCompatibility,
  calculateCartShippingFee,
  isDeliveryMethodAvailable,
} from '../../util/cartShipping';

import {
  H3,
  Page,
  LayoutSingleColumn,
  NamedLink,
  PrimaryButton,
  ResponsiveImage,
  AspectRatioWrapper,
  IconArrowHead,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import css from './CartPage.module.css';

const { Money } = sdkTypes;

// Helper to get category label
const getCategoryLabel = (publicData, categoryConfiguration) => {
  if (!publicData) return null;

  // If no category configuration, try to get categoryLevel1 directly from publicData
  if (!categoryConfiguration || !categoryConfiguration.categories?.length) {
    return publicData.categoryLevel1 || null;
  }

  const { key: categoryPrefix, categories: listingCategoriesConfig } = categoryConfiguration;
  const categoriesObj = pickCategoryFields(publicData, categoryPrefix, 1, listingCategoriesConfig);
  const currentCategories = Object.values(categoriesObj);

  if (currentCategories.length > 0) {
    const categoryKey = currentCategories[currentCategories.length - 1];
    const findCategory = (cats, key) => {
      for (const cat of cats) {
        if (cat.id === key) return cat;
        if (cat.subcategories) {
          const found = findCategory(cat.subcategories, key);
          if (found) return found;
        }
      }
      return null;
    };
    const category = findCategory(listingCategoriesConfig, categoryKey);
    return category?.name || categoryKey;
  }

  // Fallback to direct publicData value
  return publicData.categoryLevel1 || null;
};

// Icons
const StoreIcon = () => (
  <svg className={css.sellerIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 10V17C3 17.5523 3.44772 18 4 18H16C16.5523 18 17 17.5523 17 17V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 5L3 2H17L19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 5H19V7C19 8.10457 18.1046 9 17 9H3C1.89543 9 1 8.10457 1 7V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 9V10C7 11.1046 7.89543 12 9 12H11C12.1046 12 13 11.1046 13 10V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg className={css.removeIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MinusIcon = () => (
  <svg className={css.quantityIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg className={css.quantityIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg className={css.checkoutButtonIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CartPageComponent = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();

  const {
    currentUser,
    cartListings,
    cartItems,
    scrollingDisabled,
    queryInProgress,
    queryError,
    onRemoveListingFromCart,
    onRemoveListingFromCartOptimistic,
    onUpdateCartItemQuantity,
    callSetInitialValues,
  } = props;

  // State for delivery method selection per seller
  const [deliveryMethodBySeller, setDeliveryMethodBySeller] = useState({});
  const [deliveryMethodErrors, setDeliveryMethodErrors] = useState({});

  // If user is not authenticated, show not found page
  if (!currentUser?.id) {
    return <NotFoundPage />;
  }

  const hasListings = cartListings && cartListings.length > 0;
  const isLoading = queryInProgress;
  const totalItemCount = cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  const title = intl.formatMessage({ id: 'CartPage.title' });

  const schemaTitle = intl.formatMessage(
    { id: 'CartPage.schemaTitle' },
    { marketplaceName: config.marketplaceName }
  );

  // Group listings by seller
  const listingsBySeller = hasListings
    ? cartListings.reduce((groups, listing) => {
        const authorId = listing?.author?.id?.uuid;
        if (!authorId) return groups;

        if (!groups[authorId]) {
          groups[authorId] = {
            author: listing.author,
            listings: [],
          };
        }
        groups[authorId].listings.push(listing);
        return groups;
      }, {})
    : {};

  const sellerGroups = Object.values(listingsBySeller);

  // Get quantity for a listing from cartItems
  const getQuantityForListing = listingId => {
    const cartItem = cartItems?.find(item => item.listingId === listingId);
    return cartItem?.quantity || 1;
  };

  // Get frame info for a listing from cartItems
  const getFrameInfoForListing = listingId => {
    const cartItem = cartItems?.find(item => item.listingId === listingId);
    if (cartItem?.selectedFrameColor) {
      return {
        selectedFrameColor: cartItem.selectedFrameColor,
        selectedFrameLabel: cartItem.selectedFrameLabel,
        framePriceInSubunits: cartItem.framePriceInSubunits,
      };
    }
    return null;
  };

  // Check if listing allows multiple quantity (based on stock type)
  const allowsMultipleQuantity = listing => {
    const publicData = listing?.attributes?.publicData;
    const stockType = publicData?.stockType;
    // stockType can be 'oneItem' or 'multipleItems'
    // If not set, check if currentStock relationship exists and has quantity > 1
    if (stockType === 'oneItem') return false;
    if (stockType === 'multipleItems') return true;
    // Default: allow multiple if stock > 1
    const currentStock = listing.currentStock?.attributes?.quantity;
    return currentStock > 1;
  };

  // Get max quantity for a listing
  const getMaxQuantity = listing => {
    const currentStock = listing.currentStock?.attributes?.quantity;
    const MAX_QUANTITY = 100;
    return currentStock ? Math.min(currentStock, MAX_QUANTITY) : MAX_QUANTITY;
  };

  const handleRemove = listingId => {
    // Optimistically remove from Redux store immediately for instant UI update
    onRemoveListingFromCartOptimistic({ listingId });
    // Then update on the backend
    onRemoveListingFromCart(listingId);
  };

  const handleQuantityChange = (listingId, newQuantity, maxStock) => {
    const validQuantity = Math.max(1, Math.min(newQuantity, maxStock));
    onUpdateCartItemQuantity(listingId, validQuantity);
  };

  const handleCheckout = (authorId, listings, selectedDeliveryMethod, hasMultipleDeliveryMethods) => {
    if (!listings || listings.length === 0) {
      return;
    }

    // Validate delivery method selection if multiple methods are available
    if (hasMultipleDeliveryMethods && !selectedDeliveryMethod) {
      setDeliveryMethodErrors(prev => ({ ...prev, [authorId]: true }));
      return;
    }

    // Clear any existing error
    setDeliveryMethodErrors(prev => ({ ...prev, [authorId]: false }));

    const firstListing = listings[0];
    const firstListingQuantity = getQuantityForListing(firstListing.id.uuid);
    const firstListingFrameInfo = getFrameInfoForListing(firstListing.id.uuid);

    // Prepare initial values for CheckoutPage
    const initialValues = {
      listing: firstListing,
      orderData: {
        quantity: firstListingQuantity,
        deliveryMethod: selectedDeliveryMethod || 'shipping',
        // Include frame info for the main listing
        ...(firstListingFrameInfo ? { frameInfo: firstListingFrameInfo } : {}),
      },
      confirmPaymentError: null,
    };

    // Add cartItems with their quantities and frame info (if multiple items from same seller)
    if (listings.length > 1) {
      initialValues.cartItems = listings.slice(1).map(listing => {
        const listingId = listing.id.uuid;
        const frameInfo = getFrameInfoForListing(listingId);
        return {
          listing: listing,
          quantity: getQuantityForListing(listingId),
          ...(frameInfo ? { frameInfo } : {}),
        };
      });
    }

    const saveToSessionStorage = !currentUser;

    // Get CheckoutPage setInitialValues function
    const { setInitialValues } = findRouteByRouteName('CheckoutPage', routeConfiguration);

    // Set initial values for checkout
    callSetInitialValues(setInitialValues, initialValues, saveToSessionStorage);

    // Navigate to CheckoutPage
    history.push(
      createResourceLocatorString(
        'CheckoutPage',
        routeConfiguration,
        { id: firstListing.id.uuid, slug: createSlug(firstListing.attributes.title) },
        {}
      )
    );
  };

  return (
    <Page
      className={css.root}
      title={title}
      scrollingDisabled={scrollingDisabled}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        name: schemaTitle,
      }}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.content}>
          <div className={classNames(css.header, { [css.headerEmpty]: !hasListings })}>
            <h1 className={css.title}>
              <FormattedMessage id="CartPage.heading" />
            </h1>
            {hasListings && (
              <p className={css.subtitle}>
                <FormattedMessage
                  id="CartPage.itemCount"
                  values={{ count: totalItemCount }}
                />
              </p>
            )}
          </div>

          {queryError ? (
            <p className={css.error}>
              <FormattedMessage id="CartPage.queryError" />
            </p>
          ) : isLoading ? (
            <p className={css.loading}>
              <FormattedMessage id="CartPage.loading" />
            </p>
          ) : !hasListings ? (
            <div className={css.emptyCart}>
              <p className={css.emptyMessage}>
                <FormattedMessage id="CartPage.emptyCart" />
              </p>
              <NamedLink name="SearchPage" className={css.browseLink}>
                <FormattedMessage id="CartPage.browseListing" />
              </NamedLink>
            </div>
          ) : (
            <>
              {/* Note banner for multiple sellers */}
              {sellerGroups.length > 1 && (
                <div className={css.noteBanner}>
                  <p className={css.noteBannerText}>
                    <strong><FormattedMessage id="CartPage.noteLabel" /></strong>{' '}
                    <FormattedMessage id="CartPage.noteText" />
                  </p>
                </div>
              )}

              <div className={css.sellerGroups}>
                {sellerGroups.map((sellerGroup) => {
                  const authorId = sellerGroup.author?.id?.uuid;
                  const authorName = sellerGroup.author?.attributes?.profile?.displayName;
                  const authorLocation = sellerGroup.author?.attributes?.profile?.publicData?.location?.address;
                  const { listings } = sellerGroup;

                  // Calculate subtotal for items (with quantities and frame prices)
                  const currency = listings[0]?.attributes?.price?.currency || 'USD';
                  const itemsSubtotal = listings.reduce((sum, listing) => {
                    const price = listing?.attributes?.price;
                    const quantity = getQuantityForListing(listing.id.uuid);
                    const frameInfo = getFrameInfoForListing(listing.id.uuid);

                    if (price) {
                      // Add frame price to listing price if frame is selected
                      const basePrice = price.amount;
                      const framePrice = frameInfo?.framePriceInSubunits || 0;
                      const itemPrice = basePrice + framePrice;
                      return new Money(sum.amount + (itemPrice * quantity), sum.currency);
                    }
                    return sum;
                  }, new Money(0, currency));

                  // Check delivery method availability for all items in this seller's group
                  const shippingAvailable = isDeliveryMethodAvailable(listings, 'shipping');
                  const pickupAvailable = isDeliveryMethodAvailable(listings, 'pickup');
                  const hasMultipleDeliveryMethods = shippingAvailable && pickupAvailable;
                  const hasSingleDeliveryMethod = (shippingAvailable || pickupAvailable) && !hasMultipleDeliveryMethods;
                  const noDeliveryMethodAvailable = !shippingAvailable && !pickupAvailable;

                  // Check if items have incompatible delivery methods (some only shipping, some only pickup)
                  const hasIncompatibleDeliveryMethods = listings.length > 1 && noDeliveryMethodAvailable && listings.some(l => {
                    const pd = l?.attributes?.publicData;
                    return pd?.shippingEnabled || pd?.pickupEnabled;
                  });

                  // Check if pickup locations differ across listings
                  const pickupLocations = listings
                    .filter(l => l?.attributes?.publicData?.pickupEnabled)
                    .map(l => l?.attributes?.publicData?.location?.address)
                    .filter(Boolean);
                  const uniquePickupLocations = [...new Set(pickupLocations)];
                  const hasMultiplePickupLocations = uniquePickupLocations.length > 1;

                  // Determine selected delivery method
                  const selectedDeliveryMethod = deliveryMethodBySeller[authorId] ||
                    (shippingAvailable && !pickupAvailable ? 'shipping' :
                     !shippingAvailable && pickupAvailable ? 'pickup' : null);

                  // Calculate shipping fee only if shipping is selected
                  const shippingFee = selectedDeliveryMethod === 'shipping'
                    ? calculateCartShippingFee(listings, getQuantityForListing, currency)
                    : null;

                  // Check if shipping is free (shipping selected and fee is 0)
                  const isFreeShipping = selectedDeliveryMethod === 'shipping' &&
                    shippingAvailable && (!shippingFee || shippingFee.amount === 0);

                  // Calculate total
                  const sellerTotal = shippingFee
                    ? new Money(itemsSubtotal.amount + shippingFee.amount, currency)
                    : itemsSubtotal;

                  const formattedItemsSubtotal = formatMoney(intl, itemsSubtotal);
                  const formattedShippingFee = shippingFee ? formatMoney(intl, shippingFee) : null;
                  const formattedSellerTotal = formatMoney(intl, sellerTotal);

                  // Handler for delivery method change
                  const handleDeliveryMethodChange = (e) => {
                    setDeliveryMethodBySeller(prev => ({
                      ...prev,
                      [authorId]: e.target.value
                    }));
                    // Clear validation error when user selects a method
                    setDeliveryMethodErrors(prev => ({ ...prev, [authorId]: false }));
                  };

                  return (
                    <div key={authorId} className={css.sellerGroup}>
                      {/* Seller header */}
                      <div className={css.sellerHeader}>
                        <StoreIcon />
                        <div className={css.sellerInfo}>
                          <h2 className={css.sellerName}>{authorName || 'Unknown Seller'}</h2>
                          {authorLocation && (
                            <p className={css.sellerLocation}>{authorLocation}</p>
                          )}
                        </div>
                      </div>

                      <div className={css.sellerContent}>
                        {/* Cart items */}
                        <div className={css.cartItemsSection}>
                          <div className={css.cartItems}>
                            {listings.map(listing => {
                              const listingId = listing.id.uuid;
                              const listingTitle = listing?.attributes?.title;
                              const price = listing?.attributes?.price;
                              const publicData = listing?.attributes?.publicData;
                              const categoryLabel = getCategoryLabel(publicData, config.categoryConfiguration);
                              const currentStock = listing.currentStock?.attributes?.quantity;
                              const quantity = getQuantityForListing(listingId);
                              const frameInfo = getFrameInfoForListing(listingId);
                              const canChangeQuantity = allowsMultipleQuantity(listing);
                              const maxQuantity = getMaxQuantity(listing);

                              // Calculate prices for this item
                              const basePriceAmount = price?.amount || 0;
                              const framePriceAmount = frameInfo?.framePriceInSubunits || 0;
                              const itemUnitPrice = basePriceAmount + framePriceAmount;
                              const totalItemPrice = price
                                ? new Money(itemUnitPrice * quantity, price.currency)
                                : null;
                              const formattedTotalPrice = totalItemPrice
                                ? formatMoney(intl, totalItemPrice)
                                : null;
                              const formattedBasePrice = price
                                ? formatMoney(intl, new Money(basePriceAmount, price.currency))
                                : null;
                              const formattedFramePrice = frameInfo && price
                                ? formatMoney(intl, new Money(framePriceAmount, price.currency))
                                : null;

                              const firstImage = listing?.images?.[0];
                              const variantPrefix = config.layout?.listingImage?.variantPrefix || 'listing-card';
                              const variants = firstImage
                                ? Object.keys(firstImage?.attributes?.variants || {}).filter(k =>
                                    k.startsWith(variantPrefix)
                                  )
                                : [];

                              return (
                                <div key={listingId} className={css.cartItem}>
                                  {/* Image */}
                                  <div className={css.imageWrapper}>
                                    <NamedLink
                                      name="ListingPage"
                                      params={{ id: listingId, slug: createSlug(listingTitle) }}
                                      className={css.imageLink}
                                    >
                                      {firstImage && (
                                        <AspectRatioWrapper
                                          className={css.aspectWrapper}
                                          width={1}
                                          height={1}
                                        >
                                          <ResponsiveImage
                                            rootClassName={css.rootForImage}
                                            alt={listingTitle}
                                            image={firstImage}
                                            variants={variants}
                                            sizes="128px"
                                          />
                                        </AspectRatioWrapper>
                                      )}
                                    </NamedLink>
                                  </div>

                                  {/* Item details */}
                                  <div className={css.itemDetails}>
                                    <div className={css.itemHeader}>
                                      <div className={css.itemInfo}>
                                        <NamedLink
                                          name="ListingPage"
                                          params={{ id: listingId, slug: createSlug(listingTitle) }}
                                          className={css.itemTitleLink}
                                        >
                                          <h3 className={css.itemTitle}>{listingTitle}</h3>
                                        </NamedLink>
                                        {categoryLabel && (
                                          <p className={css.itemCategory}>{categoryLabel}</p>
                                        )}
                                      </div>
                                      <button
                                        className={css.removeButton}
                                        onClick={() => handleRemove(listingId)}
                                        type="button"
                                      >
                                        <CloseIcon />
                                      </button>
                                    </div>

                                    <div className={css.itemFooter}>
                                      {canChangeQuantity ? (
                                        <div className={css.quantityControls}>
                                          <button
                                            className={css.quantityButton}
                                            onClick={() => handleQuantityChange(listingId, quantity - 1, maxQuantity)}
                                            disabled={quantity <= 1}
                                            type="button"
                                          >
                                            <MinusIcon />
                                          </button>
                                          <span className={css.quantityValue}>{quantity}</span>
                                          <button
                                            className={css.quantityButton}
                                            onClick={() => handleQuantityChange(listingId, quantity + 1, maxQuantity)}
                                            disabled={quantity >= maxQuantity}
                                            type="button"
                                          >
                                            <PlusIcon />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className={css.singleItemLabel}>
                                          <FormattedMessage id="CartPage.singleItem" />
                                        </span>
                                      )}
                                      <div className={css.itemPriceSection}>
                                        {frameInfo ? (
                                          <>
                                            <div className={css.priceBreakdown}>
                                              <span className={css.priceBreakdownRow}>
                                                <span className={css.priceBreakdownLabel}>
                                                  <FormattedMessage id="CartPage.basePrice" />
                                                </span>
                                                <span className={css.priceBreakdownValue}>{formattedBasePrice}</span>
                                              </span>
                                              <span className={css.priceBreakdownRow}>
                                                <span className={css.priceBreakdownLabel}>
                                                  <FormattedMessage
                                                    id="CartPage.framePriceWithColor"
                                                    values={{ frameColor: frameInfo.selectedFrameLabel }}
                                                  />
                                                </span>
                                                <span className={css.priceBreakdownValue}>{formattedFramePrice}</span>
                                              </span>
                                            </div>
                                            <span className={css.itemTotalPrice}>{formattedTotalPrice}</span>
                                          </>
                                        ) : (
                                          <span className={css.itemPrice}>{formattedTotalPrice}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order summary */}
                        <div className={css.orderSummary}>
                          <h3 className={css.summaryTitle}>
                            <FormattedMessage id="CartPage.orderSummary" />
                          </h3>

                          {/* Incompatible delivery methods warning */}
                          {hasIncompatibleDeliveryMethods && (
                            <div className={css.deliveryWarningBanner}>
                              <p className={css.deliveryWarningText}>
                                <FormattedMessage id="CartPage.incompatibleDeliveryMethods" />
                              </p>
                            </div>
                          )}

                          {/* Delivery method selector */}
                          {(shippingAvailable || pickupAvailable) && (
                            <div className={css.deliveryMethodSection}>
                              <label className={css.deliveryMethodLabel}>
                                <FormattedMessage id="CartPage.deliveryMethodLabel" />
                              </label>
                              {hasMultipleDeliveryMethods ? (
                                <>
                                  <select
                                    className={classNames(css.deliveryMethodSelect, {
                                      [css.deliveryMethodError]: deliveryMethodErrors[authorId]
                                    })}
                                    value={selectedDeliveryMethod || ''}
                                    onChange={handleDeliveryMethodChange}
                                  >
                                    <option value="" disabled>
                                      {intl.formatMessage({ id: 'CartPage.selectDeliveryMethod' })}
                                    </option>
                                    <option value="shipping">
                                      {intl.formatMessage({ id: 'CartPage.deliveryShipping' })}
                                    </option>
                                    <option value="pickup">
                                      {intl.formatMessage({ id: 'CartPage.deliveryPickup' })}
                                    </option>
                                  </select>
                                  {deliveryMethodErrors[authorId] && (
                                    <p className={css.deliveryErrorMessage}>
                                      <FormattedMessage id="CartPage.deliveryMethodRequired" />
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className={css.deliveryMethodSingle}>
                                  {selectedDeliveryMethod === 'shipping'
                                    ? intl.formatMessage({ id: 'CartPage.deliveryShipping' })
                                    : intl.formatMessage({ id: 'CartPage.deliveryPickup' })}
                                </span>
                              )}
                              {/* Multiple pickup locations notice */}
                              {selectedDeliveryMethod === 'pickup' && hasMultiplePickupLocations && (
                                <p className={css.pickupLocationsNotice}>
                                  <FormattedMessage id="CartPage.multiplePickupLocationsNotice" />
                                </p>
                              )}
                            </div>
                          )}

                          <div className={css.summaryRows}>
                            <div className={css.summaryRow}>
                              <span className={css.summaryLabel}>
                                <FormattedMessage id="CartPage.subtotal" />
                              </span>
                              <span className={css.summaryValue}>{formattedItemsSubtotal}</span>
                            </div>
                            {formattedShippingFee && (
                              <div className={css.summaryRow}>
                                <span className={css.summaryLabel}>
                                  <FormattedMessage id="CartPage.shipping" />
                                </span>
                                <span className={css.summaryValue}>{formattedShippingFee}</span>
                              </div>
                            )}
                          </div>

                          <div className={css.totalRow}>
                            <span className={css.totalLabel}>
                              <FormattedMessage id="CartPage.total" />
                            </span>
                            <span className={css.totalValue}>{formattedSellerTotal}</span>
                          </div>

                          <PrimaryButton
                            className={css.checkoutButton}
                            onClick={() => handleCheckout(authorId, listings, selectedDeliveryMethod, hasMultipleDeliveryMethods)}
                          >
                            <FormattedMessage
                              id="CartPage.checkoutWithSeller"
                              values={{ sellerName: authorName?.split(' ')[0] || 'Seller' }}
                            />
                            <ArrowRightIcon />
                          </PrimaryButton>

                          <div className={css.benefitsList}>
                            {isFreeShipping && (
                              <div className={css.benefitItem}>
                                <span className={css.benefitDot} />
                                <span className={css.benefitText}>
                                  <FormattedMessage id="CartPage.benefitShipping" />
                                </span>
                              </div>
                            )}
                            <div className={css.benefitItem}>
                              <span className={css.benefitDot} />
                              <span className={css.benefitText}>
                                <FormattedMessage id="CartPage.benefitPayment" />
                              </span>
                            </div>
                            <div className={css.benefitItem}>
                              <span className={css.benefitDot} />
                              <span className={css.benefitText}>
                                <FormattedMessage id="CartPage.benefitAuthenticity" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continue shopping link */}
              <div className={css.continueShoppingWrapper}>
                <NamedLink name="SearchPage" className={css.continueShoppingLink}>
                  <FormattedMessage id="CartPage.continueShopping" />
                </NamedLink>
              </div>
            </>
          )}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

CartPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  cartListings: arrayOf(propTypes.listing),
  scrollingDisabled: bool.isRequired,
  queryInProgress: bool.isRequired,
  queryError: propTypes.error,
  onRemoveListingFromCart: func.isRequired,
  onRemoveListingFromCartOptimistic: func.isRequired,
  onUpdateCartItemQuantity: func.isRequired,
  callSetInitialValues: func.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { queryInProgress, queryError, cartListingIds } = state.CartPage;

  const cartListings = getListingsById(state, cartListingIds);
  // Get cart items with quantities
  const cartItems = getCartItems(currentUser);

  return {
    currentUser,
    cartListings,
    cartItems,
    scrollingDisabled: isScrollingDisabled(state),
    queryInProgress,
    queryError,
  };
};

const mapDispatchToProps = dispatch => ({
  onRemoveListingFromCart: listingId => dispatch(removeListingFromCart(listingId)),
  onRemoveListingFromCartOptimistic: listingId => dispatch(removeListingFromCartOptimistic(listingId)),
  onUpdateCartItemQuantity: (listingId, quantity) => dispatch(updateCartItemQuantity(listingId, quantity)),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
});

const CartPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(CartPageComponent);

export default CartPage;
