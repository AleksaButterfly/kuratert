import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../transactions/transaction';

/**
 * Get state data against negotiated-purchase process for TransactionPage's UI.
 * I.e. info about showing action buttons, current state etc.
 *
 * @param {*} txInfo details about transaction
 * @param {*} processInfo details about process
 */
export const getStateDataForNegotiatedPurchaseProcess = (txInfo, processInfo) => {
  const {
    transaction,
    transactionRole,
    nextTransitions,
    onCheckoutRedirect,
    onOpenMakeCounterOfferModal,
    intl,
  } = txInfo;

  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  const {
    processName,
    processState,
    states,
    transitions,
    isCustomer,
    actionButtonProps,
  } = processInfo;

  const sharedStateData = {
    processName,
    processState,
  };

  // Check if listing still has stock (for showing "item sold" message)
  const listing = transaction?.listing;
  const currentStock = listing?.currentStock?.attributes?.quantity || 0;
  const isItemSold = currentStock === 0;

  return new ConditionalResolver([processState, transactionRole])
    // ============================================================
    // NEGOTIATION STATES
    // ============================================================

    // Customer made offer - waiting for provider response
    .cond([states.OFFER_PENDING, CUSTOMER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(transitions.WITHDRAW_OFFER, CUSTOMER),
      };
    })
    .cond([states.OFFER_PENDING, PROVIDER], () => {
      const overwritesForCounterOffer = {
        onAction: onOpenMakeCounterOfferModal,
      };

      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.ACCEPT_OFFER, PROVIDER),
        secondaryButtonProps: actionButtonProps(transitions.DECLINE_OFFER, PROVIDER),
        tertiaryButtonProps: actionButtonProps(
          transitions.PROVIDER_COUNTER_OFFER,
          PROVIDER,
          overwritesForCounterOffer
        ),
      };
    })

    // Provider made counter offer - waiting for customer response
    .cond([states.COUNTER_PENDING, CUSTOMER], () => {
      const overwritesForCounterOffer = {
        onAction: onOpenMakeCounterOfferModal,
      };

      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.ACCEPT_COUNTER_OFFER, CUSTOMER),
        secondaryButtonProps: actionButtonProps(transitions.DECLINE_COUNTER_OFFER, CUSTOMER),
        tertiaryButtonProps: actionButtonProps(
          transitions.CUSTOMER_COUNTER_OFFER,
          CUSTOMER,
          overwritesForCounterOffer
        ),
      };
    })
    .cond([states.COUNTER_PENDING, PROVIDER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(transitions.WITHDRAW_COUNTER_OFFER, PROVIDER),
      };
    })

    // Offer accepted - customer can pay
    .cond([states.ACCEPTED, CUSTOMER], () => {
      // If item is sold, don't show payment button
      if (isItemSold) {
        return {
          ...sharedStateData,
          showDetailCardHeadings: true,
          showExtraInfo: true,
          showItemSoldMessage: true,
        };
      }

      const overwritesForPayment = {
        onAction: () => {
          // For negotiated-purchase, we need to pass quantity for the line items calculation
          const initialValuesForCheckout = {
            quantity: 1,
          };
          onCheckoutRedirect(initialValuesForCheckout);
        },
      };

      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(
          transitions.REQUEST_PAYMENT,
          CUSTOMER,
          overwritesForPayment
        ),
      };
    })
    .cond([states.ACCEPTED, PROVIDER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
      };
    })

    // Declined state
    .cond([states.DECLINED, _], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        isFinal: true,
      };
    })

    // Payment expired
    .cond([states.PAYMENT_EXPIRED, _], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        isFinal: true,
      };
    })

    // ============================================================
    // PURCHASE STATES (same as default-purchase)
    // ============================================================

    // Purchased - waiting for shipping
    .cond([states.PURCHASED, CUSTOMER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.MARK_RECEIVED_FROM_PURCHASED, CUSTOMER),
      };
    })
    .cond([states.PURCHASED, PROVIDER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        actionNeeded: true,
        primaryButtonProps: actionButtonProps(transitions.MARK_DELIVERED, PROVIDER),
      };
    })

    // Delivered - waiting for customer to confirm receipt
    .cond([states.DELIVERED, CUSTOMER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        actionNeeded: true,
        primaryButtonProps: actionButtonProps(transitions.MARK_RECEIVED, CUSTOMER),
        secondaryButtonProps: actionButtonProps(transitions.DISPUTE, CUSTOMER),
      };
    })
    .cond([states.DELIVERED, PROVIDER], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
      };
    })

    // Disputed
    .cond([states.DISPUTED, _], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
      };
    })

    // Received
    .cond([states.RECEIVED, _], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        showExtraInfo: true,
      };
    })

    // Completed
    .cond([states.COMPLETED, _], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        isFinal: true,
      };
    })

    // Canceled
    .cond([states.CANCELED, _], () => {
      return {
        ...sharedStateData,
        showDetailCardHeadings: true,
        isFinal: true,
      };
    })

    .default(() => {
      return { ...sharedStateData, showDetailCardHeadings: true };
    })
    .resolve();
};
