#!/usr/bin/env node

/**
 * Transaction Event Handler
 *
 * This script polls for transaction/transitioned events and handles cart items stock adjustments.
 * It runs continuously in the background and processes events in order using sequence IDs.
 *
 * Stock Management:
 * - When payment is confirmed: reduce cart items stock and remove from user's cart
 * - When payment expires/cancelled: stock is automatically restored by Sharetribe's decline action
 *
 * Usage:
 *   node server/scripts/handle-transaction-events.js
 *   or
 *   pm2 start server/scripts/handle-transaction-events.js --name "transaction-events"
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');

// Configuration
const STATE_FILE = path.join(__dirname, 'transaction-events.state');
const POLL_WAIT = 250; // Wait 250ms when processing full pages
const POLL_IDLE_WAIT = 10000; // Wait 10s when idle (no new events)

// Rate limiters for API calls
const queryLimiter = sharetribeIntegrationSdk.util.createRateLimiter(
  sharetribeIntegrationSdk.util.devQueryLimiterConfig
);

const commandLimiter = sharetribeIntegrationSdk.util.createRateLimiter(
  sharetribeIntegrationSdk.util.devCommandLimiterConfig
);

// Initialize Integration SDK
const integrationSdk = sharetribeIntegrationSdk.createInstance({
  clientId: process.env.SHARETRIBE_INTEGRATION_API_CLIENT_ID,
  clientSecret: process.env.SHARETRIBE_INTEGRATION_API_CLIENT_SECRET,
  queryLimiter,
  commandLimiter,
  baseUrl: process.env.SHARETRIBE_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

const { UUID } = sharetribeIntegrationSdk.types;

// Start time for initial query if no state exists
const startTime = new Date();

/**
 * Query transaction events from Integration API
 */
const queryEvents = (args) => {
  const filter = { eventTypes: 'transaction/transitioned' };
  return integrationSdk.events.query({ ...args, ...filter });
};

/**
 * Save the last processed event sequence ID to disk
 */
const saveLastEventSequenceId = (sequenceId) => {
  try {
    fs.writeFileSync(STATE_FILE, sequenceId.toString());
  } catch (err) {
    console.error('Error saving state:', err);
    throw err;
  }
};

/**
 * Load the last processed event sequence ID from disk
 */
const loadLastEventSequenceId = () => {
  try {
    const data = fs.readFileSync(STATE_FILE);
    return parseInt(data, 10);
  } catch (err) {
    return null;
  }
};

/**
 * Reduce cart items stock after successful payment
 */
const reduceCartItemsStock = async (cartItems, transactionId) => {
  if (!cartItems || cartItems.length === 0) return;

  console.log(`[${transactionId}] Reducing stock for ${cartItems.length} cart items...`);

  const stockPromises = cartItems.map(item => {
    const listingId = new UUID(item.id);
    const itemQuantity = item.quantity || 1;
    return integrationSdk.stockAdjustments
      .create({
        listingId,
        quantity: -itemQuantity,
      })
      .then(() => {
        console.log(`[${transactionId}] Stock reduced for listing ${item.id}: ${item.title} (quantity: ${itemQuantity})`);
      })
      .catch(err => {
        console.error(`[${transactionId}] Failed to reduce stock for ${item.id}:`, err);
      });
  });

  await Promise.all(stockPromises);
};

/**
 * Update user's cart to remove purchased items
 */
const updateUserCart = async (transaction, cartItems = []) => {
  try {
    const customerId = transaction.relationships.customer.data.id;
    const mainListingId = transaction.relationships.listing.data.id;

    // Get current user profile
    const userResponse = await integrationSdk.users.show({ id: customerId });
    const currentUser = userResponse.data.data;
    const currentCartItems = currentUser.attributes.profile.privateData?.cartItems || [];

    // Get all purchased listing IDs (main listing + cart items)
    const purchasedListingIds = [
      mainListingId.uuid,
      ...cartItems.map(item => item.id),
    ];

    // Filter out purchased listings from cart
    const updatedCartItems = currentCartItems.filter(item => {
      return !purchasedListingIds.includes(item.listingId);
    });

    // Only update if there's a change
    if (updatedCartItems.length !== currentCartItems.length) {
      await integrationSdk.users.updateProfile({
        id: customerId,
        privateData: {
          cartItems: updatedCartItems,
        },
      });

      const removedCount = currentCartItems.length - updatedCartItems.length;
      console.log(`[${transaction.id.uuid}] Updated user cart: removed ${removedCount} item(s)`);
    }
  } catch (err) {
    console.error(`[${transaction.id.uuid}] Failed to update user cart:`, err);
  }
};

/**
 * Analyze and handle transaction events
 */
const analyzeEvent = async (event) => {
  const { resource: transaction, eventType } = event.attributes;
  const transactionId = transaction.id.uuid;
  const lastTransition = transaction.attributes.lastTransition;
  const protectedData = transaction.attributes.protectedData || {};
  const cartItems = protectedData.cartItems || [];
  const hasCartItems = cartItems.length > 0;

  // Only process confirm-payment for all purchases (to clear cart)
  // and other transitions only if there are cart items
  if (lastTransition !== 'transition/confirm-payment' && !hasCartItems) {
    return;
  }

  console.log(`\n[${transactionId}] Event: ${eventType}, Transition: ${lastTransition}`);

  switch (lastTransition) {
    case 'transition/confirm-payment':
      // Payment confirmed - reduce cart items stock (if any) and update user's cart
      console.log(`[${transactionId}] Payment confirmed - processing purchase`);
      if (hasCartItems) {
        await reduceCartItemsStock(cartItems, transactionId);
      }
      // Always remove purchased items from cart (main listing + cart items)
      await updateUserCart(transaction, cartItems);
      break;

    case 'transition/expire-payment':
      // Payment expired - Sharetribe automatically declines stock reservation
      // No manual action needed for cart items since we haven't reduced stock yet
      console.log(`[${transactionId}] Payment expired - stock automatically restored by Sharetribe`);
      break;

    case 'transition/cancel':
    case 'transition/auto-cancel':
    case 'transition/cancel-from-disputed':
    case 'transition/auto-cancel-from-disputed':
      // Transaction cancelled - Sharetribe automatically cancels stock reservation
      console.log(`[${transactionId}] Transaction cancelled - stock automatically restored by Sharetribe`);
      break;

    default:
      // Other transitions - no action needed
      break;
  }
};

/**
 * Main polling loop
 */
const pollLoop = async (sequenceId) => {
  try {
    const params = sequenceId
      ? { startAfterSequenceId: sequenceId }
      : { createdAtStart: startTime };

    const res = await queryEvents(params);
    const events = res.data.data;
    const lastEvent = events[events.length - 1];
    const fullPage = events.length === res.data.meta.perPage;
    const delay = fullPage ? POLL_WAIT : POLL_IDLE_WAIT;
    const lastSequenceId = lastEvent ? lastEvent.attributes.sequenceId : sequenceId;

    // Process events sequentially
    for (const event of events) {
      await analyzeEvent(event);
    }

    // Save progress
    if (lastEvent) {
      saveLastEventSequenceId(lastEvent.attributes.sequenceId);
    }

    // Schedule next poll
    setTimeout(() => {
      pollLoop(lastSequenceId);
    }, delay);
  } catch (err) {
    console.error('Error in poll loop:', err);
    // Retry after 5 seconds on error
    setTimeout(() => {
      pollLoop(sequenceId);
    }, 5000);
  }
};

/**
 * Start the event handler
 */
const start = () => {
  const lastSequenceId = loadLastEventSequenceId();

  console.log('===========================================');
  console.log('Transaction Event Handler Started');
  console.log('===========================================');
  console.log('Press <CTRL>+C to quit.\n');

  if (lastSequenceId) {
    console.log(`Resuming from sequence ID: ${lastSequenceId}`);
  } else {
    console.log('No previous state found.');
    console.log(`Starting from: ${startTime.toISOString()}`);
  }

  console.log('\nWatching for transaction events...\n');

  // Start polling
  pollLoop(lastSequenceId);
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});

// Start the handler
start();
