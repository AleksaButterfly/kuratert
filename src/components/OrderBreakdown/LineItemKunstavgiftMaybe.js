import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_KUNSTAVGIFT, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

/**
 * A component that renders the kunstavgift (art tax) as a line item.
 * Kunstavgift is a 5% art tax applied to art purchases in Norway.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element|null}
 */
const LineItemKunstavgiftMaybe = props => {
  const { lineItems, intl } = props;

  const kunstavgiftLineItem = lineItems.find(
    item => item.code === LINE_ITEM_KUNSTAVGIFT && !item.reversal
  );

  return kunstavgiftLineItem ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.kunstavgift" />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, kunstavgiftLineItem.lineTotal)}</span>
    </div>
  ) : null;
};

export default LineItemKunstavgiftMaybe;
