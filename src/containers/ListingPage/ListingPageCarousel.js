import React, { useState, useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

// Contexts
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
// Utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_CLOSED,
  STOCK_MULTIPLE_ITEMS,
  STOCK_INFINITE_MULTIPLE_ITEMS,
  propTypes,
} from '../../util/types';
import {
  displayDeliveryPickup,
  displayDeliveryShipping,
} from '../../util/configHelpers';
import { types as sdkTypes } from '../../util/sdkLoader';
import { formatMoney } from '../../util/currency';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
} from '../../util/urlHelpers';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
} from '../../util/errors.js';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers.js';
import { isFieldForListingType } from '../../util/fieldHelpers';
import {
  isFieldForCategory,
  pickCategoryFields,
} from '../../util/fieldHelpers.js';
import {
  ensureListing,
  ensureOwnListing,
  ensureUser,
  userDisplayNameAsString,
} from '../../util/data';
import { richText } from '../../util/richText';
import {
  OFFER,
  REQUEST,
  isBookingProcess,
  isNegotiationProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../../transactions/transaction';

// Global ducks (for Redux actions and thunks)
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';
import { addListingToFavorites, removeListingFromFavorites, addListingToCart } from '../../ducks/user.duck';
import { getFavoriteListingIds, isListingInCart, getCartListingIds } from '../../util/userHelpers.js';

// Shared components
import {
  Page,
  NamedLink,
  NamedRedirect,
  LayoutSingleColumn,
  Modal,
  Avatar,
  ButtonFavorite,
} from '../../components';

// Related components and modules
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import {
  sendInquiry,
  sendOffer,
  sendDigitalViewingRequest,
  setInitialValues,
  fetchTimeSlots,
  fetchTransactionLineItems,
} from './ListingPage.duck';

import {
  LoadingPage,
  ErrorPage,
  priceData,
  listingImages,
  handleContactUser,
  handleSubmitInquiry,
  handleSubmit,
  priceForSchemaMaybe,
} from './ListingPage.shared';
import ActionBarMaybe from './ActionBarMaybe';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';
import InquiryForm from './InquiryForm/InquiryForm';
import MakeOfferForm from './MakeOfferForm/MakeOfferForm';
import { BookDigitalViewingForm } from './BookDigitalViewingForm';
import ViewInSpaceModal from './ViewInSpaceModal';
import SectionRelatedListings from './SectionRelatedListings/SectionRelatedListings';
import { pathByRouteName } from '../../util/routes';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE = 16;

const { UUID } = sdkTypes;

// Icons
const IconHeart = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 6.875C17.5 4.80393 15.8211 3.125 13.75 3.125C12.2963 3.125 11.0229 3.97909 10.4509 5.20793C10.2996 5.5325 9.7004 5.5325 9.54914 5.20793C8.97707 3.97909 7.70372 3.125 6.25 3.125C4.17893 3.125 2.5 4.80393 2.5 6.875C2.5 12.5 10 16.875 10 16.875C10 16.875 17.5 12.5 17.5 6.875Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconShare = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.833 10.833V15.833C15.833 16.275 15.6578 16.699 15.3452 17.0115C15.0327 17.3241 14.6087 17.4993 14.1667 17.4993H4.16667C3.72464 17.4993 3.30072 17.3241 2.98816 17.0115C2.67559 16.699 2.5 16.275 2.5 15.833V5.83301C2.5 5.39098 2.67559 4.96706 2.98816 4.6545C3.30072 4.34193 3.72464 4.16634 4.16667 4.16634H9.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M12.5 2.5H17.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M8.33333 11.6667L17.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconTruck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="3" width="15" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M16 8H19L22 11V16H16V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const IconBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M3 8L12 13L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconTag = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M7 7H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M11 5V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.0084 4.92548 17.3425 8.75 17.9V12.3125H6.71875V10H8.75V8.2375C8.75 6.2325 9.94438 5.125 11.7717 5.125C12.6467 5.125 13.5625 5.28125 13.5625 5.28125V7.25H12.5533C11.56 7.25 11.25 7.86667 11.25 8.5V10H13.4688L13.1146 12.3125H11.25V17.9C15.0745 17.3425 18 14.0084 18 10Z" fill="currentColor"/>
  </svg>
);

const IconTwitter = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.2719 3H17.6831L12.4106 9.01244L18.5 17H13.6788L10.0381 12.2018L5.88438 17H3.47188L9.10312 10.5706L3.25 3H8.19375L11.4775 7.37562L15.2719 3ZM14.3869 15.5019H15.6781L7.43 4.32312H6.04563L14.3869 15.5019Z" fill="currentColor"/>
  </svg>
);

const IconLinkedIn = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.78125 17.5H2.8125V7.1875H5.78125V17.5ZM4.29688 5.9375C3.35156 5.9375 2.5 5.11719 2.5 4.14062C2.5 3.16406 3.35156 2.34375 4.29688 2.34375C5.27344 2.34375 6.09375 3.16406 6.09375 4.14062C6.09375 5.11719 5.27344 5.9375 4.29688 5.9375ZM17.5 17.5H14.5625V12.4219C14.5625 11.2266 14.5312 9.71875 12.9375 9.71875C11.3125 9.71875 11.0625 11.0156 11.0625 12.3438V17.5H8.09375V7.1875H10.9375V8.59375H10.9688C11.375 7.78125 12.4062 6.9375 13.9375 6.9375C16.9375 6.9375 17.5 8.9375 17.5 11.5156V17.5Z" fill="currentColor"/>
  </svg>
);

const IconEmail = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M2 5L10 11L18 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// Helper to get category label
const getCategoryLabel = (publicData, categoryConfiguration) => {
  if (!publicData || !categoryConfiguration) return null;

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
  return null;
};

// Dimension keys to combine
const DIMENSION_KEYS = ['dimension_height', 'dimension_width', 'dimension_depth'];

// Helper to get listing specifications
const getSpecifications = (publicData, metadata, listingFieldConfigs, categoryConfiguration, intl) => {
  if (!publicData || !listingFieldConfigs) return [];

  const { key: categoryPrefix, categories: listingCategoriesConfig } = categoryConfiguration || {};
  const categoriesObj = pickCategoryFields(publicData, categoryPrefix, 1, listingCategoriesConfig);
  const currentCategories = Object.values(categoriesObj);

  const isFieldForSelectedCategories = fieldConfig => {
    return isFieldForCategory(currentCategories, fieldConfig);
  };

  // Track if we've already added dimensions
  let dimensionsAdded = false;

  const pickListingFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, showConfig = {} } = config;
    const listingType = publicData.listingType;
    const isTargetListingType = isFieldForListingType(listingType, config);
    const isTargetCategory = isFieldForSelectedCategories(config);

    const { isDetail, label } = showConfig;
    const publicDataValue = publicData[key];
    const metadataValue = metadata?.[key];
    const value = publicDataValue != null ? publicDataValue : metadataValue;

    // Handle dimension fields - combine them into one entry
    if (DIMENSION_KEYS.includes(key) && !dimensionsAdded) {
      dimensionsAdded = true;

      const height = publicData.dimension_height;
      const width = publicData.dimension_width;
      const depth = publicData.dimension_depth;

      // Build dimensions string based on available values
      const dimensionValues = [height, width, depth].filter(v => v != null && v !== '');

      if (dimensionValues.length > 0) {
        const dimensionsValue = dimensionValues.join(' x ');
        return filteredConfigs.concat({
          key: 'dimensions',
          value: dimensionsValue,
          label: intl.formatMessage({ id: 'ListingPage.dimensionsCm' })
        });
      }
      return filteredConfigs;
    }

    // Skip individual dimension fields since we've combined them
    if (DIMENSION_KEYS.includes(key)) {
      return filteredConfigs;
    }

    if (isDetail && isTargetListingType && isTargetCategory && typeof value !== 'undefined') {
      const findSelectedOption = enumValue => enumOptions?.find(o => enumValue === `${o.option}`);
      const getBooleanMessage = value =>
        value
          ? intl.formatMessage({ id: 'SearchPage.detailYes' })
          : intl.formatMessage({ id: 'SearchPage.detailNo' });
      const optionConfig = findSelectedOption(value);

      // Handle multi-enum - value is an array, convert to comma-separated labels
      const getMultiEnumLabels = (values) => {
        if (!Array.isArray(values)) return values;
        return values
          .map(v => {
            const option = enumOptions?.find(o => v === `${o.option}`);
            return option?.label || v;
          })
          .join(', ');
      };

      return schemaType === 'enum'
        ? filteredConfigs.concat({ key, value: optionConfig?.label || value, label })
        : schemaType === 'multi-enum'
        ? filteredConfigs.concat({ key, value: getMultiEnumLabels(value), label })
        : schemaType === 'boolean'
        ? filteredConfigs.concat({ key, value: getBooleanMessage(value), label })
        : schemaType === 'long'
        ? filteredConfigs.concat({ key, value, label })
        : filteredConfigs;
    }
    return filteredConfigs;
  };

  return listingFieldConfigs.reduce(pickListingFields, []);
};

export const ListingPageComponent = props => {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(
    props.inquiryModalOpenForListingId === props.params.id
  );
  const [makeOfferModalOpen, setMakeOfferModalOpen] = useState(false);
  const [digitalViewingModalOpen, setDigitalViewingModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isViewInSpaceModalOpen, setIsViewInSpaceModalOpen] = useState(false);
  const [selectedImageForSpace, setSelectedImageForSpace] = useState(null);
  const [copied, setCopied] = useState(false);
  // Cart related state
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedFrameId, setSelectedFrameId] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    intl,
    onManageDisableScrolling,
    params: rawParams,
    location,
    scrollingDisabled,
    showListingError,
    reviews = [],
    fetchReviewsError,
    sendInquiryInProgress,
    sendInquiryError,
    sendOfferInProgress,
    sendOfferError,
    sendDigitalViewingInProgress,
    sendDigitalViewingError,
    history,
    callSetInitialValues,
    onSendInquiry,
    onSendOffer,
    onSendDigitalViewingRequest,
    onInitializeCardPaymentData,
    config,
    routeConfiguration,
    showOwnListingsOnly,
    // Favorites
    addListingToFavoritesInProgress,
    removeListingFromFavoritesInProgress,
    currentFavoriteListingId,
    onAddListingToFavorites,
    onRemoveListingFromFavorites,
    // Cart
    addListingToCartInProgress,
    onAddListingToCart,
    // Related listings
    relatedListings,
    ...restOfProps
  } = props;

  const listingConfig = config.listing;
  const listingId = new UUID(rawParams.id);
  const isVariant = rawParams.variant != null;
  const isPendingApprovalVariant = rawParams.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
  const isDraftVariant = rawParams.variant === LISTING_PAGE_DRAFT_VARIANT;
  const currentListing =
    isPendingApprovalVariant || isDraftVariant || showOwnListingsOnly
      ? ensureOwnListing(getOwnListing(listingId))
      : ensureListing(getListing(listingId));

  const listingSlug = rawParams.slug || createSlug(currentListing.attributes.title || '');
  const params = { slug: listingSlug, ...rawParams };

  const listingPathParamType = isDraftVariant
    ? LISTING_PAGE_PARAM_TYPE_DRAFT
    : LISTING_PAGE_PARAM_TYPE_EDIT;
  const listingTab = isDraftVariant ? 'photos' : 'details';

  const isApproved =
    currentListing.id && currentListing.attributes.state !== LISTING_STATE_PENDING_APPROVAL;

  const pendingIsApproved = isPendingApprovalVariant && isApproved;

  const pendingOtherUsersListing =
    (isPendingApprovalVariant || isDraftVariant) &&
    showListingError &&
    showListingError.status === 403;
  const shouldShowPublicListingPage = pendingIsApproved || pendingOtherUsersListing;

  if (shouldShowPublicListingPage) {
    return <NamedRedirect name="ListingPage" params={params} search={location.search} />;
  }

  const topbar = <TopbarContainer />;

  if (showListingError && showListingError.status === 404) {
    return <NotFoundPage staticContext={props.staticContext} />;
  } else if (showListingError) {
    return <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} />;
  } else if (!currentListing.id) {
    return <LoadingPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} />;
  }

  const {
    description = '',
    geolocation = null,
    price = null,
    title = '',
    publicData = {},
    metadata = {},
  } = currentListing.attributes;

  const richTitle = (
    <span>
      {richText(title, {
        longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE,
        longWordClass: css.longWord,
      })}
    </span>
  );

  const authorAvailable = currentListing && currentListing.author;
  const userAndListingAuthorAvailable = !!(currentUser && authorAvailable);
  const isOwnListing =
    userAndListingAuthorAvailable && currentListing.author.id.uuid === currentUser.id.uuid;

  const { listingType, transactionProcessAlias, unitType, frameOptions, shippingEnabled, pickupEnabled, quoteEnabled, shippingPriceInSubunitsOneItem, acceptingOffers, isAuction, auctionEstimateLow, auctionEstimateHigh, auctionLink, isReserved, isContactForQuote } = publicData;
  if (!(listingType && transactionProcessAlias && unitType)) {
    return (
      <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} invalidListing />
    );
  }

  // Frame options
  const hasFrameOptions = frameOptions?.enabled && frameOptions?.variants?.length > 0;
  const frameVariants = frameOptions?.variants || [];

  const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
  const isBooking = isBookingProcess(processName);
  const isPurchase = isPurchaseProcess(processName);
  const isNegotiation = isNegotiationProcess(processName);

  // Get listing type configuration for stock type and delivery options
  const validListingTypes = config.listing.listingTypes || [];
  const listingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const stockType = listingTypeConfig?.stockType;
  const allowOrdersOfMultipleItems = [STOCK_MULTIPLE_ITEMS, STOCK_INFINITE_MULTIPLE_ITEMS].includes(
    stockType
  );

  // Delivery method is now selected in CartPage, not here

  // Stock and quantity
  const currentStock = currentListing.currentStock?.attributes?.quantity;
  const hasStock = currentStock != null && currentStock > 0;
  const maxQuantity = Math.min(currentStock || 1, 100);

  const currentAuthor = authorAvailable ? currentListing.author : null;
  const ensuredAuthor = ensureUser(currentAuthor);
  const authorDisplayName = userDisplayNameAsString(ensuredAuthor, '');

  const { formattedPrice } = priceData(price, config.currency, intl);

  // Format auction estimates if this is an auction listing
  const formattedAuctionEstimateLow = isAuction && auctionEstimateLow
    ? formatMoney(intl, new sdkTypes.Money(auctionEstimateLow, price?.currency || config.currency))
    : null;
  const formattedAuctionEstimateHigh = isAuction && auctionEstimateHigh
    ? formatMoney(intl, new sdkTypes.Money(auctionEstimateHigh, price?.currency || config.currency))
    : null;

  // Calculate Kunstavgift (5% Art Tax)
  const kunstavgiftAmount = price?.amount ? Math.round(price.amount * 0.05) : 0;
  const formattedKunstavgift = kunstavgiftAmount > 0
    ? intl.formatNumber(kunstavgiftAmount / 100, {
        style: 'currency',
        currency: price?.currency || 'NOK',
      })
    : null;

  // Get category label
  const categoryLabel = getCategoryLabel(publicData, config.categoryConfiguration);

  // Get specifications
  const specifications = getSpecifications(
    publicData,
    metadata,
    listingConfig.listingFields,
    config.categoryConfiguration,
    intl
  );

  // Get images
  const images = currentListing.images || [];
  const variantPrefix = config.layout.listingImage.variantPrefix;
  const imageVariants = ['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge'];
  // Use scaled variants for thumbnails too (non-cropped)
  const thumbnailVariants = ['scaled-small', 'scaled-medium'];

  // Share functionality
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const shareUrl = getShareUrl();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const text = intl.formatMessage({ id: 'ListingPage.shareText' }, { title });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareEmail = () => {
    const subject = intl.formatMessage({ id: 'ListingPage.shareEmailSubject' }, { title });
    const body = intl.formatMessage({ id: 'ListingPage.shareEmailBody' }, { title, url: shareUrl });
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Favorites logic
  const listingIdString = listingId.uuid;
  const favoriteListingIds = getFavoriteListingIds(currentUser);
  const isFavorite = favoriteListingIds.includes(listingIdString);

  const handleToggleFavorite = (listingIdToToggle, isFavoriteNow) => {
    if (isFavoriteNow) {
      onRemoveListingFromFavorites(listingIdToToggle);
    } else {
      onAddListingToFavorites(listingIdToToggle);
    }
  };

  // Check if this specific listing is being favorited/unfavorited
  const isThisListingInProgress = currentFavoriteListingId === listingIdString;
  const addInProgressForThisListing = isThisListingInProgress && addListingToFavoritesInProgress;
  const removeInProgressForThisListing = isThisListingInProgress && removeListingFromFavoritesInProgress;

  // Contact user handler
  const commonParams = { params, history, routes: routeConfiguration };
  const onContactUser = handleContactUser({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    location,
    setInitialValues,
    setInquiryModalOpen,
  });

  const onSubmitInquiry = handleSubmitInquiry({
    ...commonParams,
    getListing,
    onSendInquiry,
    setInquiryModalOpen,
  });

  const onSubmit = handleSubmit({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    getListing,
    onInitializeCardPaymentData,
  });

  const handleOrderSubmit = values => {
    const isCurrentlyClosed = currentListing.attributes.state === LISTING_STATE_CLOSED;
    if (isOwnListing || isCurrentlyClosed) {
      window.scrollTo(0, 0);
    } else {
      onSubmit(values);
    }
  };

  // Cart logic
  const cartListingIds = getCartListingIds(currentUser);
  const isInCart = cartListingIds.includes(listingId.uuid);

  const handleAddToCart = () => {
    if (onAddListingToCart) {
      // Delivery method is selected in CartPage, not here
      // Pass frame info if selected
      const selectedFrame = selectedFrameId
        ? frameVariants.find(v => (v.id || v.color) === selectedFrameId)
        : null;
      const frameInfo = selectedFrame
        ? {
            selectedFrameId: selectedFrame.id || selectedFrame.color,
            selectedFrameColor: selectedFrame.color || null,
            selectedFrameLabel: selectedFrame.label,
            framePriceInSubunits: selectedFrame.priceInSubunits,
            // Money object for email template formatting
            framePriceMoney: {
              amount: selectedFrame.priceInSubunits / 100,
              currency: price?.currency || 'NOK',
            },
          }
        : null;
      onAddListingToCart(listingId.uuid, selectedQuantity, frameInfo);
    }
  };

  // Quantity options for selector
  const quantityOptions = [];
  for (let i = 1; i <= maxQuantity; i++) {
    quantityOptions.push(i);
  }

  // Author info
  const authorBio = ensuredAuthor.attributes?.profile?.bio || '';
  const authorInitials = authorDisplayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return null;
    const totalRating = reviews.reduce((sum, review) => {
      return sum + (review.attributes?.rating || 0);
    }, 0);
    return (totalRating / reviews.length).toFixed(1);
  };
  const averageRating = calculateAverageRating();
  const reviewCount = reviews.length;

  // Schema
  const facebookImages = listingImages(currentListing, 'facebook');
  const twitterImages = listingImages(currentListing, 'twitter');
  const schemaImages = listingImages(
    currentListing,
    `${variantPrefix}-2x`
  ).map(img => img.url);
  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'ListingPage.schemaTitle' },
    { title, price: formattedPrice, marketplaceName }
  );
  const productURL = `${config.marketplaceRootURL}${location.pathname}${location.search}${location.hash}`;
  const schemaStock = currentListing.currentStock?.attributes?.quantity || 0;
  const schemaAvailability = !currentListing.currentStock
    ? null
    : schemaStock > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const availabilityMaybe = schemaAvailability ? { availability: schemaAvailability } : {};
  const noIndexMaybe =
    currentListing.attributes.state === LISTING_STATE_CLOSED ? { noIndex: true } : {};

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      author={authorDisplayName}
      description={description}
      facebookImages={facebookImages}
      twitterImages={twitterImages}
      {...noIndexMaybe}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'Product',
        description: description,
        name: schemaTitle,
        image: schemaImages,
        offers: {
          '@type': 'Offer',
          url: productURL,
          ...priceForSchemaMaybe(price),
          ...availabilityMaybe,
        },
      }}
    >
      <LayoutSingleColumn className={css.pageRoot} topbar={topbar} footer={<FooterContainer />}>
        {/* Action bar for own listing */}
        {mounted && currentListing.id && isOwnListing ? (
          <div className={css.actionBarWrapper}>
            <ActionBarMaybe
              className={css.actionBarForProductLayout}
              isOwnListing={isOwnListing}
              listing={currentListing}
              currentUser={currentUser}
              editParams={{
                id: listingId.uuid,
                slug: listingSlug,
                type: listingPathParamType,
                tab: listingTab,
              }}
            />
          </div>
        ) : null}

        {/* Main grid layout */}
        <div className={css.listingPageGrid}>
          {/* Left column - Gallery */}
          <div className={css.galleryColumn}>
            <ListingImageGallery
              images={images}
              imageVariants={imageVariants}
              thumbnailVariants={thumbnailVariants}
              onViewInSpace={(imageUrl) => {
                setSelectedImageForSpace(imageUrl);
                setIsViewInSpaceModalOpen(true);
              }}
            />
          </div>

          {/* Right column - Content */}
          <div className={css.contentColumn}>
            {/* Header: Category, Title, Author, Actions */}
            <div className={css.listingHeader}>
              <div className={css.listingHeaderInfo}>
                {categoryLabel && (
                  <p className={css.listingCategory}>{categoryLabel}</p>
                )}
                <h1 className={css.listingTitle}>{richTitle}</h1>
                <p className={css.listingAuthor}>
                  <FormattedMessage id="ListingPage.soldBy" />{' '}
                  <NamedLink
                    className={css.listingAuthorLink}
                    name="ProfilePage"
                    params={{ id: ensuredAuthor.id?.uuid }}
                  >
                    {authorDisplayName}
                  </NamedLink>
                </p>
              </div>
              <div className={css.headerActions}>
                <ButtonFavorite
                  className={css.actionIconButton}
                  listingId={listingIdString}
                  isFavorite={isFavorite}
                  isAuthenticated={isAuthenticated}
                  onToggleFavorite={handleToggleFavorite}
                  addInProgress={addInProgressForThisListing}
                  removeInProgress={removeInProgressForThisListing}
                />
                <button
                  className={css.actionIconButton}
                  title={intl.formatMessage({ id: 'ListingPage.share' })}
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <IconShare />
                </button>
              </div>
            </div>

            {/* Price or Auction Estimate or Reserved Status or Contact for Quote */}
            <div className={css.priceSection}>
              {isReserved ? (
                <>
                  <p className={css.reservedStatus}>
                    <FormattedMessage id="ListingPage.reservedStatus" />
                  </p>
                  <p className={css.reservedMessage}>
                    <FormattedMessage id="ListingPage.reservedMessage" />
                  </p>
                </>
              ) : isContactForQuote ? (
                <p className={css.contactForQuoteMessage}>
                  <FormattedMessage id="ListingPage.contactForQuoteMessage" />
                </p>
              ) : isAuction && formattedAuctionEstimateLow && formattedAuctionEstimateHigh ? (
                <p className={css.auctionEstimate}>
                  <FormattedMessage
                    id="ListingPage.auctionEstimate"
                    values={{
                      lowEstimate: formattedAuctionEstimateLow,
                      highEstimate: formattedAuctionEstimateHigh
                    }}
                  />
                </p>
              ) : (
                <>
                  <p className={css.currentPrice}>{formattedPrice}</p>
                  {formattedKunstavgift && (
                    <p className={css.kunstavgiftNote}>
                      <FormattedMessage
                        id="ListingPage.kunstavgiftNote"
                        values={{ amount: formattedKunstavgift }}
                      />
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Description */}
            {description && (
              <div className={css.descriptionSection}>
                <p className={css.descriptionText}>{description}</p>
              </div>
            )}

            {/* Specifications */}
            {specifications.length > 0 && (
              <div className={css.specificationsSection}>
                <h3 className={css.sectionTitle}>
                  <FormattedMessage id="ListingPage.specifications" />
                </h3>
                <div className={css.specificationsGrid}>
                  {specifications.map(spec => (
                    <div key={spec.key} className={css.specItem}>
                      <span className={css.specLabel}>{spec.label}</span>
                      <span className={css.specValue}>
                        {spec.key === 'selger' ? (
                          <NamedLink
                            className={css.sellerLink}
                            name="SellerListingsPage"
                            params={{ sellerName: encodeURIComponent(spec.value) }}
                          >
                            {spec.value}
                          </NamedLink>
                        ) : (
                          spec.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className={css.trustBadgesSection}>
              <div className={css.trustBadgesGrid}>
                <div className={css.trustBadge}>
                  <div className={css.trustBadgeIcon}>
                    <IconShield />
                  </div>
                  <span className={css.trustBadgeText}>
                    <FormattedMessage id="ListingPage.authenticityGuarantee" />
                  </span>
                </div>
                <div className={css.trustBadge}>
                  <div className={css.trustBadgeIcon}>
                    <IconTruck />
                  </div>
                  <span className={css.trustBadgeText}>
                    <FormattedMessage id="ListingPage.whiteGloveDelivery" />
                  </span>
                </div>
                <div className={css.trustBadge}>
                  <div className={css.trustBadgeIcon}>
                    <IconBox />
                  </div>
                  <span className={css.trustBadgeText}>
                    <FormattedMessage id="ListingPage.professionalPackaging" />
                  </span>
                </div>
                <div className={css.trustBadge}>
                  <div className={css.trustBadgeIcon}>
                    <IconTag />
                  </div>
                  <span className={css.trustBadgeText}>
                    <FormattedMessage id="ListingPage.freeReturns" />
                  </span>
                </div>
              </div>
            </div>

            {/* Frame options selector */}
            {isPurchase && hasStock && !isInCart && hasFrameOptions && (
              <div className={css.purchaseOptionsSection}>
                <div className={css.frameSelectorWrapper}>
                  <label className={css.selectorLabel}>
                    <FormattedMessage id="ListingPage.frameOptionLabel" />
                  </label>
                  <select
                    className={css.frameSelect}
                    value={selectedFrameId || ''}
                    onChange={e => setSelectedFrameId(e.target.value || null)}
                    disabled={isOwnListing}
                  >
                    <option value="">
                      {intl.formatMessage({ id: 'ListingPage.noFrame' })}
                    </option>
                    {/* Sort recommended frame first, then others */}
                    {[...frameVariants]
                      .sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0))
                      .map(variant => (
                        <option key={variant.id || variant.color} value={variant.id || variant.color}>
                          {variant.isRecommended ? '⭐ ' : ''}{variant.label} (+{intl.formatNumber(variant.priceInSubunits / 100, {
                            style: 'currency',
                            currency: price?.currency || 'EUR',
                          })})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Quantity selector - only show if multiple items allowed */}
            {isPurchase && hasStock && !isInCart && allowOrdersOfMultipleItems && maxQuantity > 1 && (
              <div className={css.purchaseOptionsSection}>
                <div className={css.quantitySelectorWrapper}>
                  <label className={css.selectorLabel}>
                    <FormattedMessage id="ListingPage.quantityLabel" />
                  </label>
                  <select
                    className={css.quantitySelect}
                    value={selectedQuantity}
                    onChange={e => setSelectedQuantity(Number(e.target.value))}
                    disabled={isOwnListing}
                  >
                    {quantityOptions.map(qty => (
                      <option key={qty} value={qty}>
                        {qty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className={css.actionsSection}>
              {/* Auction listing - show View at Auction button */}
              {isAuction && auctionLink ? (
                <a
                  href={auctionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.viewAtAuctionButton}
                >
                  <FormattedMessage id="ListingPage.viewAtAuction" />
                </a>
              ) : isReserved ? (
                /* Reserved listing - only show contact seller */
                null
              ) : isContactForQuote ? (
                /* Contact for quote listing - show contact for quote button */
                <button
                  className={css.contactForQuoteButton}
                  onClick={() => {
                    if (isAuthenticated) {
                      setInquiryModalOpen(true);
                    } else {
                      const state = { from: `${location.pathname}${location.search}${location.hash}` };
                      history.push(pathByRouteName('SignupPage', routeConfiguration, {}), state);
                    }
                  }}
                  disabled={isOwnListing}
                >
                  <FormattedMessage id="ListingPage.contactForQuoteButton" />
                </button>
              ) : (
                /* Regular listing - show purchase buttons */
                <>
                  {isPurchase && (
                    <button
                      className={isInCart ? css.addedToCartButton : css.addToCartButton}
                      onClick={() => {
                        if (!isAuthenticated) {
                          const state = { from: `${location.pathname}${location.search}${location.hash}` };
                          history.push(pathByRouteName('SignupPage', routeConfiguration, {}), state);
                        } else {
                          handleAddToCart();
                        }
                      }}
                      disabled={isOwnListing || addListingToCartInProgress || !hasStock || isInCart}
                    >
                      {addListingToCartInProgress ? (
                        <FormattedMessage id="ListingPage.addingToCart" />
                      ) : isInCart ? (
                        <FormattedMessage id="ListingPage.addedToCart" />
                      ) : !hasStock ? (
                        <FormattedMessage id="ListingPage.outOfStock" />
                      ) : (
                        <FormattedMessage id="ListingPage.addToCart" />
                      )}
                    </button>
                  )}
                  {acceptingOffers !== false && (
                    <button
                      className={css.makeOfferButton}
                      onClick={() => {
                        if (isAuthenticated) {
                          setMakeOfferModalOpen(true);
                        } else {
                          const state = { from: `${location.pathname}${location.search}${location.hash}` };
                          history.push(pathByRouteName('SignupPage', routeConfiguration, {}), state);
                        }
                      }}
                      disabled={isOwnListing || !hasStock}
                    >
                      <FormattedMessage id="ListingPage.makeAnOffer" />
                    </button>
                  )}
                </>
              )}
              {/* Show digital viewing and contact buttons for all listing types except reserved */}
              {!isReserved && (
                <button
                  className={css.bookDigitalViewingButton}
                  onClick={() => {
                    if (isAuthenticated) {
                      setDigitalViewingModalOpen(true);
                    } else {
                      const state = { from: `${location.pathname}${location.search}${location.hash}` };
                      history.push(pathByRouteName('SignupPage', routeConfiguration, {}), state);
                    }
                  }}
                  disabled={isOwnListing}
                >
                  <FormattedMessage id="ListingPage.bookDigitalViewing" />
                </button>
              )}
              <button
                className={css.contactSellerButton}
                onClick={onContactUser}
                disabled={isOwnListing}
              >
                <FormattedMessage id="ListingPage.contactSeller" />
              </button>
            </div>

            {/* Author card */}
            <div className={css.authorCardSection}>
              <div className={css.authorCardHeader}>
                <Avatar
                  className={css.authorAvatar}
                  user={ensuredAuthor}
                  disableProfileLink
                />
                <div className={css.authorCardInfo}>
                  <h4 className={css.authorCardName}>
                    <NamedLink
                      className={css.authorCardNameLink}
                      name="ProfilePage"
                      params={{ id: ensuredAuthor.id?.uuid }}
                    >
                      {authorDisplayName}
                    </NamedLink>
                  </h4>
                </div>
              </div>
              {authorBio && (
                <p className={css.authorCardBio}>{authorBio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Related Listings Section */}
        <div className={css.relatedListingsWrapper}>
          <SectionRelatedListings listings={relatedListings} />
        </div>
      </LayoutSingleColumn>

      {/* Share Modal */}
      <Modal
        id="ListingPage.shareModal"
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <div className={css.shareModalContent}>
          <h2 className={css.shareModalTitle}>
            <FormattedMessage id="ListingPage.shareModalTitle" />
          </h2>

          <div className={css.copyLinkSection}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className={css.copyLinkInput}
            />
            <button
              className={css.copyLinkButton}
              onClick={handleCopyLink}
            >
              {copied ? <IconCheck /> : <IconCopy />}
              <span>{copied ? intl.formatMessage({ id: 'ListingPage.copied' }) : intl.formatMessage({ id: 'ListingPage.copyLink' })}</span>
            </button>
          </div>

          <div className={css.socialShareSection}>
            <p className={css.socialShareLabel}>
              <FormattedMessage id="ListingPage.shareOn" />
            </p>
            <div className={css.socialButtons}>
              <button className={css.socialButton} onClick={handleShareFacebook} title="Facebook">
                <IconFacebook />
              </button>
              <button className={css.socialButton} onClick={handleShareTwitter} title="X (Twitter)">
                <IconTwitter />
              </button>
              <button className={css.socialButton} onClick={handleShareLinkedIn} title="LinkedIn">
                <IconLinkedIn />
              </button>
              <button className={css.socialButton} onClick={handleShareEmail} title="Email">
                <IconEmail />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Inquiry Modal */}
      <Modal
        id="ListingPage.inquiry"
        contentClassName={css.inquiryModalContent}
        isOpen={isAuthenticated && inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <InquiryForm
          className={css.inquiryForm}
          submitButtonWrapperClassName={css.inquirySubmitButtonWrapper}
          listingTitle={title}
          authorDisplayName={authorDisplayName}
          sendInquiryError={sendInquiryError}
          onSubmit={onSubmitInquiry}
          inProgress={sendInquiryInProgress}
        />
      </Modal>

      {/* Make Offer Modal */}
      <Modal
        id="ListingPage.makeOffer"
        contentClassName={css.inquiryModalContent}
        isOpen={isAuthenticated && makeOfferModalOpen}
        onClose={() => setMakeOfferModalOpen(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <MakeOfferForm
          className={css.inquiryForm}
          listingTitle={title}
          listingPrice={price}
          authorDisplayName={authorDisplayName}
          submitError={sendOfferError}
          marketplaceCurrency={config.currency}
          inProgress={sendOfferInProgress}
          shippingEnabled={shippingEnabled}
          pickupEnabled={pickupEnabled}
          quoteEnabled={quoteEnabled}
          shippingPriceInSubunits={shippingPriceInSubunitsOneItem}
          hasFrameOptions={hasFrameOptions}
          frameVariants={frameVariants}
          onSubmit={values => {
            const { offerPrice, message, deliveryMethod, selectedFrameId } = values;

            // Build frameInfo if a frame is selected
            const selectedFrame = selectedFrameId
              ? frameVariants.find(v => (v.id || v.color) === selectedFrameId)
              : null;
            const frameInfo = selectedFrame
              ? {
                  selectedFrameId: selectedFrame.id || selectedFrame.color,
                  selectedFrameColor: selectedFrame.color || null,
                  selectedFrameLabel: selectedFrame.label,
                  framePriceInSubunits: selectedFrame.priceInSubunits,
                  // Money object for email template formatting
                  framePriceMoney: {
                    amount: selectedFrame.priceInSubunits / 100,
                    currency: price?.currency || 'NOK',
                  },
                }
              : null;

            onSendOffer(currentListing, offerPrice, message, deliveryMethod, frameInfo).then(transactionId => {
              if (transactionId) {
                setMakeOfferModalOpen(false);
                const orderDetailsPath = pathByRouteName('OrderDetailsPage', routeConfiguration, {
                  id: transactionId?.uuid,
                });
                history.push(orderDetailsPath);
              }
            });
          }}
        />
      </Modal>

      {/* Book Digital Viewing Modal */}
      <Modal
        id="ListingPage.digitalViewing"
        contentClassName={css.inquiryModalContent}
        isOpen={isAuthenticated && digitalViewingModalOpen}
        onClose={() => setDigitalViewingModalOpen(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <BookDigitalViewingForm
          className={css.inquiryForm}
          submitButtonWrapperClassName={css.inquirySubmitButtonWrapper}
          listingTitle={title}
          authorDisplayName={authorDisplayName}
          sendDigitalViewingError={sendDigitalViewingError}
          inProgress={sendDigitalViewingInProgress}
          onSubmit={values => {
            const { viewingDate, viewingTime, message } = values;

            // Format the date for display
            const formattedDate = viewingDate?.date
              ? intl.formatDate(viewingDate.date, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '';

            // Create the auto-message using translations
            const autoMessage = intl.formatMessage(
              { id: 'BookDigitalViewingForm.autoMessage' },
              { date: formattedDate, time: viewingTime }
            );

            onSendDigitalViewingRequest(currentListing, autoMessage, message).then(
              transactionId => {
                if (transactionId) {
                  setDigitalViewingModalOpen(false);
                  const orderDetailsPath = pathByRouteName('OrderDetailsPage', routeConfiguration, {
                    id: transactionId?.uuid,
                  });
                  history.push(orderDetailsPath);
                }
              }
            );
          }}
        />
      </Modal>

      {/* View in Your Space Modal */}
      <ViewInSpaceModal
        isOpen={isViewInSpaceModalOpen}
        onClose={() => {
          setIsViewInSpaceModalOpen(false);
          setSelectedImageForSpace(null);
        }}
        onManageDisableScrolling={onManageDisableScrolling}
        productImage={selectedImageForSpace}
        productTitle={title}
      />
    </Page>
  );
};

const EnhancedListingPage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  const showListingError = props.showListingError;
  const isVariant = props.params?.variant != null;
  const currentUser = props.currentUser;
  if (isForbiddenError(showListingError) && !isVariant && !currentUser) {
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);
  const hasUserPendingApprovalError = isErrorUserPendingApproval(showListingError);

  if ((isPrivateMarketplace && isUnauthorizedUser) || hasUserPendingApprovalError) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (
    (hasNoViewingRights && isForbiddenError(showListingError)) ||
    isErrorNoViewingPermission(showListingError)
  ) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  }

  return (
    <ListingPageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      location={location}
      showOwnListingsOnly={hasNoViewingRights}
      {...props}
    />
  );
};

const mapStateToProps = state => {
  const { isAuthenticated } = state.auth;
  const {
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    timeSlotsForDate,
    sendInquiryInProgress,
    sendInquiryError,
    sendOfferInProgress,
    sendOfferError,
    sendDigitalViewingInProgress,
    sendDigitalViewingError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    inquiryModalOpenForListingId,
    relatedListingRefs,
  } = state.ListingPage;
  const {
    currentUser,
    addListingToFavoritesInProgress,
    removeListingFromFavoritesInProgress,
    currentFavoriteListingId,
    addListingToCartInProgress,
  } = state.user;

  const getListing = id => {
    const ref = { id, type: 'listing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const getOwnListing = id => {
    const ref = { id, type: 'ownListing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  // Get related listings from refs
  const relatedListings = relatedListingRefs?.length > 0
    ? getMarketplaceEntities(state, relatedListingRefs)
    : [];

  return {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    scrollingDisabled: isScrollingDisabled(state),
    inquiryModalOpenForListingId,
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    timeSlotsForDate,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    sendInquiryInProgress,
    sendInquiryError,
    sendOfferInProgress,
    sendOfferError,
    sendDigitalViewingInProgress,
    sendDigitalViewingError,
    // Favorites
    addListingToFavoritesInProgress,
    removeListingFromFavoritesInProgress,
    currentFavoriteListingId,
    // Cart
    addListingToCartInProgress,
    // Related listings
    relatedListings,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
  onFetchTransactionLineItems: params => dispatch(fetchTransactionLineItems(params)),
  onSendInquiry: (listing, message) => dispatch(sendInquiry(listing, message)),
  onSendOffer: (listing, offerPrice, message, deliveryMethod, frameInfo) => dispatch(sendOffer(listing, offerPrice, message, deliveryMethod, frameInfo)),
  onSendDigitalViewingRequest: (listing, autoMessage, message) =>
    dispatch(sendDigitalViewingRequest(listing, autoMessage, message)),
  onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
  onFetchTimeSlots: (listingId, start, end, timeZone, options) =>
    dispatch(fetchTimeSlots(listingId, start, end, timeZone, options)),
  // Favorites
  onAddListingToFavorites: listingId => dispatch(addListingToFavorites(listingId)),
  onRemoveListingFromFavorites: listingId => dispatch(removeListingFromFavorites(listingId)),
  // Cart
  onAddListingToCart: (listingId, quantity, frameInfo) => dispatch(addListingToCart(listingId, quantity, frameInfo)),
});

const ListingPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EnhancedListingPage);

export default ListingPage;
