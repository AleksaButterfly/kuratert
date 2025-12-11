import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../transactions/transaction';

// Get UI data mapped to specific transaction state & role
export const getStateDataForNegotiatedPurchaseProcess = (txInfo, processInfo) => {
  const { transactionRole } = txInfo;
  const { processName, processState, states } = processInfo;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  return new ConditionalResolver([processState, transactionRole])
    // Negotiation phase
    .cond([states.OFFER_PENDING, PROVIDER], () => {
      return { processName, processState, actionNeeded: true, isSaleNotification: true };
    })
    .cond([states.OFFER_PENDING, CUSTOMER], () => {
      return { processName, processState };
    })
    .cond([states.COUNTER_PENDING, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.COUNTER_PENDING, PROVIDER], () => {
      return { processName, processState };
    })
    .cond([states.DECLINED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.WITHDRAWN, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.EXPIRED, _], () => {
      return { processName, processState, isFinal: true };
    })
    // Payment phase
    .cond([states.ACCEPTED, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.ACCEPTED, PROVIDER], () => {
      return { processName, processState };
    })
    .cond([states.PENDING_PAYMENT, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.PENDING_PAYMENT, PROVIDER], () => {
      return { processName, processState };
    })
    .cond([states.PAYMENT_EXPIRED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .cond([states.CANCELED, _], () => {
      return { processName, processState, isFinal: true };
    })
    // Fulfillment phase
    .cond([states.PURCHASED, PROVIDER], () => {
      return { processName, processState, actionNeeded: true, isSaleNotification: true };
    })
    .cond([states.PURCHASED, CUSTOMER], () => {
      return { processName, processState };
    })
    .cond([states.DELIVERED, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.DELIVERED, PROVIDER], () => {
      return { processName, processState };
    })
    .cond([states.DISPUTED, _], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.RECEIVED, _], () => {
      return { processName, processState };
    })
    .cond([states.COMPLETED, _], () => {
      return { processName, processState, isFinal: true };
    })
    // Review phase
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return { processName, processState, actionNeeded: true };
    })
    .cond([states.REVIEWED, _], () => {
      return { processName, processState, isFinal: true };
    })
    .default(() => {
      // Default values for other states
      return { processName, processState };
    })
    .resolve();
};
