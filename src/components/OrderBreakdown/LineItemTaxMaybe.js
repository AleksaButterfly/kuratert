import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_TAX, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

/**
 * A component that renders the VAT/tax as a line item.
 * Tax is calculated on the full order (artwork + shipping + frame).
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element|null}
 */
const LineItemTaxMaybe = props => {
  const { lineItems, intl } = props;

  const taxLineItem = lineItems.find(
    item => item.code === LINE_ITEM_TAX && !item.reversal
  );

  return taxLineItem ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.tax" />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, taxLineItem.lineTotal)}</span>
    </div>
  ) : null;
};

export default LineItemTaxMaybe;
