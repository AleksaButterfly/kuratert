/**
 * This component will show the booking info and calculated total price.
 * I.e. dates and other details related to payment decision in receipt format.
 */
import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import {
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
  DATE_TYPE_TIME,
  LINE_ITEM_CUSTOMER_COMMISSION,
  LINE_ITEM_FIXED,
  LINE_ITEM_HOUR,
  LINE_ITEM_PROVIDER_COMMISSION,
  LISTING_UNIT_TYPES,
  propTypes,
} from '../../util/types';

import { AspectRatioWrapper, ResponsiveImage } from '../index';

import LineItemBookingPeriod from './LineItemBookingPeriod';
import LineItemBasePriceMaybe from './LineItemBasePriceMaybe';
import LineItemSubTotalMaybe from './LineItemSubTotalMaybe';
import LineItemShippingFeeMaybe from './LineItemShippingFeeMaybe';
import LineItemPickupFeeMaybe from './LineItemPickupFeeMaybe';
import LineItemFrameMaybe from './LineItemFrameMaybe';
import LineItemCustomerCommissionMaybe from './LineItemCustomerCommissionMaybe';
import LineItemCustomerCommissionRefundMaybe from './LineItemCustomerCommissionRefundMaybe';
import LineItemProviderCommissionMaybe from './LineItemProviderCommissionMaybe';
import LineItemProviderCommissionRefundMaybe from './LineItemProviderCommissionRefundMaybe';
import LineItemRefundMaybe from './LineItemRefundMaybe';
import LineItemTotalPrice from './LineItemTotalPrice';
import LineItemUnknownItemsMaybe from './LineItemUnknownItemsMaybe';
import { getLineItemTitle, getCartItemFromLineItem, isCartItemLineItem } from '../../util/lineItems';

import css from './OrderBreakdown.module.css';

export const OrderBreakdownComponent = props => {
  const config = useConfiguration();
  const {
    rootClassName,
    className,
    userRole,
    transaction,
    booking,
    timeZone,
    currency,
    marketplaceName,
    intl,
    cartItems,
    listing,
    listingQuantity,
    mainListingFrameInfo,
  } = props;

  const isCustomer = userRole === 'customer';
  const isProvider = userRole === 'provider';
  const allLineItems = transaction.attributes.lineItems || [];
  // We'll show only line-items that are specific for the current userRole (customer vs provider)
  const lineItems = allLineItems.filter(lineItem => lineItem.includeFor.includes(userRole));
  const unitLineItem = lineItems.find(
    item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
  );
  // Line-item code that matches with base unit: day, night, hour, fixed, item
  const lineItemUnitType = unitLineItem?.code;
  const dateType = [LINE_ITEM_HOUR, LINE_ITEM_FIXED].includes(lineItemUnitType)
    ? DATE_TYPE_DATETIME
    : DATE_TYPE_DATE;

  const hasCommissionLineItem = lineItems.find(item => {
    const hasCustomerCommission = isCustomer && item.code === LINE_ITEM_CUSTOMER_COMMISSION;
    const hasProviderCommission = isProvider && item.code === LINE_ITEM_PROVIDER_COMMISSION;
    return (hasCustomerCommission || hasProviderCommission) && !item.reversal;
  });

  const classes = classNames(rootClassName || css.root, className);

  // Check if we have cart items (stored in protectedData)
  const protectedCartItems = transaction?.attributes?.protectedData?.cartItems || [];
  const hasCartItems = cartItems && cartItems.length > 0;

  // Filter line items to get only order items (not commission, shipping, etc.)
  const orderLineItems = lineItems.filter(item => {
    const isOrderItem = LISTING_UNIT_TYPES.includes(item.code) || item.code.startsWith('line-item/');
    const isNotCommissionOrFee =
      !item.code.includes('commission') &&
      !item.code.includes('shipping') &&
      !item.code.includes('pickup');
    return isOrderItem && isNotCommissionOrFee && !item.reversal;
  });

  /**
   * OrderBreakdown contains different line items:
   *
   * LineItemBookingPeriod: prints booking start and booking end types. Prop dateType
   * determines if the date and time or only the date is shown
   *
   * LineItemShippingFeeMaybe: prints the shipping fee (combining additional fee of
   * additional items into it).
   *
   * LineItemShippingFeeRefundMaybe: prints the amount of refunded shipping fee
   *
   * LineItemBasePriceMaybe: prints the base price calculation for the listing, e.g.
   * "$150.00 * 2 nights $300"
   *
   * LineItemUnknownItemsMaybe: prints the line items that are unknown. In ideal case there
   * should not be unknown line items. If you are using custom pricing, you should create
   * new custom line items if you need them.
   *
   * LineItemSubTotalMaybe: prints subtotal of line items before possible
   * commission or refunds
   *
   * LineItemRefundMaybe: prints the amount of refund
   *
   * LineItemCustomerCommissionMaybe: prints the amount of customer commission
   * The default transaction process used by this template doesn't include the customer commission.
   *
   * LineItemCustomerCommissionRefundMaybe: prints the amount of refunded customer commission
   *
   * LineItemProviderCommissionMaybe: prints the amount of provider commission
   *
   * LineItemProviderCommissionRefundMaybe: prints the amount of refunded provider commission
   *
   * LineItemTotalPrice: prints total price of the transaction
   *
   */

  return (
    <div className={classes}>
      <LineItemBookingPeriod
        booking={booking}
        code={lineItemUnitType}
        dateType={dateType}
        timeZone={timeZone}
      />

      {hasCartItems || protectedCartItems.length > 0 ? (
        <>
          {orderLineItems.map((item, index) => {
            const itemQuantity = item.quantity || 1;

            // Get title using helper function (handles both main listing and cart items)
            const itemTitle = getLineItemTitle(item.code, protectedCartItems, listing);

            // Sharetribe calculates lineTotal automatically (unitPrice × quantity)
            const lineTotal = item.lineTotal;
            const formattedPrice = lineTotal ? formatMoney(intl, lineTotal) : '';

            // Show quantity in label if > 1
            const displayLabel = itemQuantity > 1
              ? `${itemTitle} x ${itemQuantity}`
              : itemTitle;

            // Get image data
            // For cart items: get imageUrl from protectedData
            // For main listing: use listing images
            const isMainListing = LISTING_UNIT_TYPES.includes(item.code);
            const cartItem = isCartItemLineItem(item.code)
              ? getCartItemFromLineItem(item.code, protectedCartItems)
              : null;

            const imageUrl = cartItem?.imageUrl;
            const firstImage = isMainListing ? listing?.images?.[0] : null;
            const variantPrefix = config.layout?.listingImage?.variantPrefix || 'listing-card';
            const variants = firstImage
              ? Object.keys(firstImage?.attributes?.variants || {}).filter(k =>
                  k.startsWith(variantPrefix)
                )
              : [];

            // Get frame info for display
            // For cart items: get from cartItem, for main listing: get from mainListingFrameInfo prop
            const frameLabel = isMainListing
              ? mainListingFrameInfo?.selectedFrameLabel
              : cartItem?.selectedFrameLabel;

            return (
              <div key={`${item.code}-${index}`} className={css.lineItemWrapper}>
                <div className={css.lineItem}>
                  {(firstImage || imageUrl) && (
                    <div className={css.itemImageWrapper}>
                      {firstImage ? (
                        <AspectRatioWrapper
                          className={css.itemAspectWrapper}
                          width={1}
                          height={1}
                        >
                          <ResponsiveImage
                            rootClassName={css.itemImage}
                            alt={itemTitle}
                            image={firstImage}
                            variants={variants}
                            sizes="40px"
                          />
                        </AspectRatioWrapper>
                      ) : imageUrl ? (
                        <AspectRatioWrapper
                          className={css.itemAspectWrapper}
                          width={1}
                          height={1}
                        >
                          <img
                            src={imageUrl}
                            alt={itemTitle}
                            className={css.itemImage}
                          />
                        </AspectRatioWrapper>
                      ) : null}
                    </div>
                  )}
                  <div className={css.itemContent}>
                    <span className={css.itemLabel}>{displayLabel}</span>
                    {frameLabel && (
                      <span className={css.itemFrameInfo}>
                        <FormattedMessage
                          id="OrderBreakdown.frameOption"
                          values={{ frameLabel }}
                        />
                      </span>
                    )}
                  </div>
                  {formattedPrice && <span className={css.itemValue}>{formattedPrice}</span>}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <LineItemBasePriceMaybe lineItems={lineItems} code={lineItemUnitType} intl={intl} />
      )}

      <LineItemShippingFeeMaybe lineItems={lineItems} intl={intl} />
      <LineItemPickupFeeMaybe lineItems={lineItems} intl={intl} />
      <LineItemFrameMaybe lineItems={lineItems} intl={intl} />
      {!hasCartItems && !protectedCartItems.length && (
        <LineItemUnknownItemsMaybe lineItems={lineItems} isProvider={isProvider} intl={intl} />
      )}

      <LineItemSubTotalMaybe
        lineItems={lineItems}
        code={lineItemUnitType}
        userRole={userRole}
        intl={intl}
        marketplaceCurrency={currency}
      />
      <LineItemRefundMaybe lineItems={lineItems} intl={intl} marketplaceCurrency={currency} />

      <LineItemCustomerCommissionMaybe
        lineItems={lineItems}
        isCustomer={isCustomer}
        marketplaceName={marketplaceName}
        intl={intl}
      />
      <LineItemCustomerCommissionRefundMaybe
        lineItems={lineItems}
        isCustomer={isCustomer}
        marketplaceName={marketplaceName}
        intl={intl}
      />

      <LineItemProviderCommissionMaybe
        lineItems={lineItems}
        isProvider={isProvider}
        marketplaceName={marketplaceName}
        intl={intl}
      />
      <LineItemProviderCommissionRefundMaybe
        lineItems={lineItems}
        isProvider={isProvider}
        marketplaceName={marketplaceName}
        intl={intl}
      />

      <LineItemTotalPrice transaction={transaction} isProvider={isProvider} intl={intl} />

      {hasCommissionLineItem ? (
        <span className={css.feeInfo}>
          <FormattedMessage id="OrderBreakdown.commissionFeeNote" />
        </span>
      ) : null}
    </div>
  );
};

/**
 * Order breakdown aka receipt
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string} props.marketplaceName
 * @param {string} props.timeZone IANA time zone name
 * @param {string} props.currency E.g. 'USD'
 * @param {'customer' | 'provider'} props.userRole
 * @param {propTypes.transaction} props.transaction
 * @param {propTypes.booking?} props.booking
 * @param {DATE_TYPE_DATE | DATE_TYPE_TIME | DATE_TYPE_DATETIME} props.dateType
 * @returns {JSX.Element} the order breakdown component
 */
const OrderBreakdown = props => {
  const intl = useIntl();
  return <OrderBreakdownComponent intl={intl} {...props} />;
};

export default OrderBreakdown;
