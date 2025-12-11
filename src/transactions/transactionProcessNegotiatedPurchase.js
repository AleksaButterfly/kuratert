/**
 * Transaction process graph for negotiated purchases:
 *   - negotiated-purchase
 *
 * This process allows customers to make offers on listings.
 * Customer makes offer → Provider accepts/declines/counters → Payment → Shipping flow
 */

/**
 * Transitions
 *
 * These strings must sync with values defined in Marketplace API,
 * since transaction objects given by API contain info about last transitions.
 */
export const transitions = {
  // ============================================================
  // NEGOTIATION PHASE
  // ============================================================

  // Customer makes initial offer with price
  CUSTOMER_OFFER: 'transition/customer-offer',

  // Provider accepts customer's offer
  ACCEPT_OFFER: 'transition/accept-offer',

  // Provider declines customer's offer
  DECLINE_OFFER: 'transition/decline-offer',

  // Provider makes counter offer
  PROVIDER_COUNTER_OFFER: 'transition/provider-counter-offer',

  // Customer accepts provider's counter offer
  ACCEPT_COUNTER_OFFER: 'transition/accept-counter-offer',

  // Customer declines provider's counter offer
  DECLINE_COUNTER_OFFER: 'transition/decline-counter-offer',

  // Customer makes another counter offer
  CUSTOMER_COUNTER_OFFER: 'transition/customer-counter-offer',

  // Customer withdraws their offer
  WITHDRAW_OFFER: 'transition/withdraw-offer',

  // Provider withdraws their counter offer
  WITHDRAW_COUNTER_OFFER: 'transition/withdraw-counter-offer',

  // Operator declines
  OPERATOR_DECLINE_FROM_OFFER: 'transition/operator-decline-from-offer',
  OPERATOR_DECLINE_FROM_COUNTER: 'transition/operator-decline-from-counter',

  // Auto-expire
  EXPIRE_OFFER: 'transition/expire-offer',
  EXPIRE_COUNTER_OFFER: 'transition/expire-counter-offer',
  EXPIRE_ACCEPTED: 'transition/expire-accepted',

  // ============================================================
  // PAYMENT PHASE
  // ============================================================

  REQUEST_PAYMENT: 'transition/request-payment',
  CONFIRM_PAYMENT: 'transition/confirm-payment',
  EXPIRE_PAYMENT: 'transition/expire-payment',

  // ============================================================
  // FULFILLMENT PHASE (same as default-purchase)
  // ============================================================

  MARK_RECEIVED_FROM_PURCHASED: 'transition/mark-received-from-purchased',
  MARK_DELIVERED: 'transition/mark-delivered',
  OPERATOR_MARK_DELIVERED: 'transition/operator-mark-delivered',
  MARK_RECEIVED: 'transition/mark-received',
  AUTO_MARK_RECEIVED: 'transition/auto-mark-received',
  DISPUTE: 'transition/dispute',
  OPERATOR_DISPUTE: 'transition/operator-dispute',
  MARK_RECEIVED_FROM_DISPUTED: 'transition/mark-received-from-disputed',

  // ============================================================
  // CANCELLATION
  // ============================================================

  CANCEL: 'transition/cancel',
  AUTO_CANCEL: 'transition/auto-cancel',
  CANCEL_FROM_DISPUTED: 'transition/cancel-from-disputed',
  AUTO_CANCEL_FROM_DISPUTED: 'transition/auto-cancel-from-disputed',

  // ============================================================
  // COMPLETION
  // ============================================================

  AUTO_COMPLETE: 'transition/auto-complete',
};

/**
 * States
 */
export const states = {
  INITIAL: 'initial',
  OFFER_PENDING: 'offer-pending',
  COUNTER_PENDING: 'counter-pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  PENDING_PAYMENT: 'pending-payment',
  PAYMENT_EXPIRED: 'payment-expired',
  PURCHASED: 'purchased',
  DELIVERED: 'delivered',
  RECEIVED: 'received',
  DISPUTED: 'disputed',
  CANCELED: 'canceled',
  COMPLETED: 'completed',
};

/**
 * Description of transaction process graph
 */
export const graph = {
  id: 'negotiated-purchase/release-1',

  initial: states.INITIAL,

  states: {
    [states.INITIAL]: {
      on: {
        [transitions.CUSTOMER_OFFER]: states.OFFER_PENDING,
      },
    },
    [states.OFFER_PENDING]: {
      on: {
        [transitions.ACCEPT_OFFER]: states.ACCEPTED,
        [transitions.DECLINE_OFFER]: states.DECLINED,
        [transitions.PROVIDER_COUNTER_OFFER]: states.COUNTER_PENDING,
        [transitions.WITHDRAW_OFFER]: states.DECLINED,
        [transitions.OPERATOR_DECLINE_FROM_OFFER]: states.DECLINED,
        [transitions.EXPIRE_OFFER]: states.DECLINED,
      },
    },
    [states.COUNTER_PENDING]: {
      on: {
        [transitions.ACCEPT_COUNTER_OFFER]: states.ACCEPTED,
        [transitions.DECLINE_COUNTER_OFFER]: states.DECLINED,
        [transitions.CUSTOMER_COUNTER_OFFER]: states.OFFER_PENDING,
        [transitions.WITHDRAW_COUNTER_OFFER]: states.DECLINED,
        [transitions.OPERATOR_DECLINE_FROM_COUNTER]: states.DECLINED,
        [transitions.EXPIRE_COUNTER_OFFER]: states.DECLINED,
      },
    },
    [states.ACCEPTED]: {
      on: {
        [transitions.REQUEST_PAYMENT]: states.PENDING_PAYMENT,
        [transitions.EXPIRE_ACCEPTED]: states.DECLINED,
      },
    },
    [states.PENDING_PAYMENT]: {
      on: {
        [transitions.CONFIRM_PAYMENT]: states.PURCHASED,
        [transitions.EXPIRE_PAYMENT]: states.PAYMENT_EXPIRED,
      },
    },
    [states.PAYMENT_EXPIRED]: { type: 'final' },
    [states.PURCHASED]: {
      on: {
        [transitions.MARK_RECEIVED_FROM_PURCHASED]: states.RECEIVED,
        [transitions.MARK_DELIVERED]: states.DELIVERED,
        [transitions.OPERATOR_MARK_DELIVERED]: states.DELIVERED,
        [transitions.CANCEL]: states.CANCELED,
        [transitions.AUTO_CANCEL]: states.CANCELED,
      },
    },
    [states.DELIVERED]: {
      on: {
        [transitions.MARK_RECEIVED]: states.RECEIVED,
        [transitions.AUTO_MARK_RECEIVED]: states.RECEIVED,
        [transitions.DISPUTE]: states.DISPUTED,
        [transitions.OPERATOR_DISPUTE]: states.DISPUTED,
      },
    },
    [states.DISPUTED]: {
      on: {
        [transitions.MARK_RECEIVED_FROM_DISPUTED]: states.RECEIVED,
        [transitions.CANCEL_FROM_DISPUTED]: states.CANCELED,
        [transitions.AUTO_CANCEL_FROM_DISPUTED]: states.CANCELED,
      },
    },
    [states.RECEIVED]: {
      on: {
        [transitions.AUTO_COMPLETE]: states.COMPLETED,
      },
    },
    [states.DECLINED]: { type: 'final' },
    [states.CANCELED]: { type: 'final' },
    [states.COMPLETED]: { type: 'final' },
  },
};

// Transitions that involve offers/counter-offers (affect pricing)
const offerTransitions = [
  transitions.CUSTOMER_OFFER,
  transitions.PROVIDER_COUNTER_OFFER,
  transitions.CUSTOMER_COUNTER_OFFER,
];

/**
 * Check if the state is a negotiation state where price can change.
 */
export const isNegotiationState = state => {
  if (state == null) {
    return false;
  }
  const unprefixedState = state.indexOf('/') === -1 ? state : state.split('/')[1];
  return [states.OFFER_PENDING, states.COUNTER_PENDING].includes(unprefixedState);
};

/**
 * Check if a transition is relevant for showing in activity feed
 */
export const isRelevantPastTransition = transition => {
  return [
    transitions.CUSTOMER_OFFER,
    transitions.ACCEPT_OFFER,
    transitions.DECLINE_OFFER,
    transitions.PROVIDER_COUNTER_OFFER,
    transitions.ACCEPT_COUNTER_OFFER,
    transitions.DECLINE_COUNTER_OFFER,
    transitions.CUSTOMER_COUNTER_OFFER,
    transitions.WITHDRAW_OFFER,
    transitions.WITHDRAW_COUNTER_OFFER,
    transitions.EXPIRE_OFFER,
    transitions.EXPIRE_COUNTER_OFFER,
    transitions.EXPIRE_ACCEPTED,
    transitions.CONFIRM_PAYMENT,
    transitions.EXPIRE_PAYMENT,
    transitions.MARK_DELIVERED,
    transitions.OPERATOR_MARK_DELIVERED,
    transitions.MARK_RECEIVED,
    transitions.MARK_RECEIVED_FROM_PURCHASED,
    transitions.AUTO_MARK_RECEIVED,
    transitions.DISPUTE,
    transitions.OPERATOR_DISPUTE,
    transitions.MARK_RECEIVED_FROM_DISPUTED,
    transitions.CANCEL,
    transitions.AUTO_CANCEL,
    transitions.CANCEL_FROM_DISPUTED,
    transitions.AUTO_CANCEL_FROM_DISPUTED,
  ].includes(transition);
};

/**
 * Check if the given transition is privileged (needs server-side handling)
 */
export const isPrivileged = transition => {
  return [
    transitions.CUSTOMER_OFFER,
    transitions.PROVIDER_COUNTER_OFFER,
    transitions.CUSTOMER_COUNTER_OFFER,
    transitions.REQUEST_PAYMENT,
  ].includes(transition);
};

/**
 * Check when transaction is completed
 */
export const isCompleted = transition => {
  return [transitions.AUTO_COMPLETE].includes(transition);
};

/**
 * Check when transaction is refunded
 */
export const isRefunded = transition => {
  return [
    transitions.EXPIRE_PAYMENT,
    transitions.CANCEL,
    transitions.AUTO_CANCEL,
    transitions.CANCEL_FROM_DISPUTED,
    transitions.AUTO_CANCEL_FROM_DISPUTED,
  ].includes(transition);
};

// No reviews in this process
export const isCustomerReview = transition => false;
export const isProviderReview = transition => false;

// States that need provider's attention
export const statesNeedingProviderAttention = [
  states.OFFER_PENDING,
  states.PURCHASED,
];

// States that need customer's attention
export const statesNeedingCustomerAttention = [
  states.COUNTER_PENDING,
  states.ACCEPTED,
  states.DELIVERED,
];

/**
 * Get the current offer amount from transaction's protected data
 */
export const getCurrentOfferAmount = transaction => {
  const protectedData = transaction?.attributes?.protectedData || {};
  return protectedData.currentOfferAmount || null;
};

/**
 * Get offer history from transaction's protected data
 */
export const getOfferHistory = transaction => {
  const protectedData = transaction?.attributes?.protectedData || {};
  return protectedData.offerHistory || [];
};

/**
 * Helper to check if an offers array is valid for negotiation process.
 * This validates that transitions and offers arrays are in sync.
 */
const isValidNegotiationOffersArray = (transitions, offers) => {
  const relevantTransitions = transitions.filter(t => offerTransitions.includes(t.transition));
  const isOffersAnArray = !!offers && Array.isArray(offers);

  if (!isOffersAnArray || offers.length !== relevantTransitions.length) {
    return false;
  }

  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const transition = relevantTransitions[i];
    if (offer.transition !== transition.transition || offer.by !== transition.by) {
      return false;
    }
  }

  return true;
};

/**
 * Add offerInSubunits to transitions that match offers in metadata.
 * This allows the ActivityFeed to display offer amounts.
 *
 * @param {Array} transitions - array of transition records
 * @param {Array} offers - array of offer records from metadata
 * @returns {Array} transitions with offerInSubunits added where applicable
 */
export const getTransitionsWithMatchingOffers = (transitions, offers) => {
  const isValidOffersArray = isValidNegotiationOffersArray(transitions, offers);
  if (isValidOffersArray) {
    const transitionsWithOffers = [];
    let offerIndex = 0;
    for (let i = 0; i < transitions.length; i++) {
      let transition = { ...transitions[i] };

      if (offerTransitions.includes(transition.transition)) {
        transition.offerInSubunits = offers[offerIndex]?.offerInSubunits;
        transitionsWithOffers.push(transition);
        offerIndex++;
      } else {
        transitionsWithOffers.push(transition);
      }
    }
    return transitionsWithOffers;
  }

  return transitions;
};
