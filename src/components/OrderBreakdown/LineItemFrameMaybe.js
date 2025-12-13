import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_FRAME, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

/**
 * A component that renders the frame fee as a line item.
 *
 * @component
 * @param {Object} props
 * @param {Array<propTypes.lineItem>} props.lineItems - The line items to render
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const LineItemFrameMaybe = props => {
  const { lineItems, intl } = props;

  const frameLineItem = lineItems.find(
    item => item.code === LINE_ITEM_FRAME && !item.reversal
  );

  return frameLineItem ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.frame" />
      </span>
      <span className={css.itemValue}>{formatMoney(intl, frameLineItem.lineTotal)}</span>
    </div>
  ) : null;
};

export default LineItemFrameMaybe;
