# Transaction Event Handler

## Overview

This script handles cart items stock adjustments by listening to transaction events from Sharetribe Integration API.

## How it works

1. **Polls for events**: Continuously queries Integration API for `transaction/transitioned` events
2. **Processes transitions**: When payment is confirmed (`transition/confirm-payment`), reduces cart items stock
3. **Maintains state**: Saves the last processed event sequence ID to resume from correct point on restart
4. **Handles auto-transitions**: Catches automatic transitions like `auto-cancel`, `expire-payment` that happen on Sharetribe servers

## Requirements

Environment variables in `.env`:
```bash
SHARETRIBE_INTEGRATION_API_CLIENT_ID=your_integration_client_id
SHARETRIBE_INTEGRATION_API_CLIENT_SECRET=your_integration_client_secret
```

## Running

### Development (foreground):
```bash
node server/scripts/handle-transaction-events.js
```

### Production with PM2:
```bash
pm2 start server/scripts/handle-transaction-events.js --name "transaction-events"
pm2 save
```

### Heroku Worker Dyno:
Add to `Procfile`:
```
worker: node server/scripts/handle-transaction-events.js
```

### View logs:
```bash
pm2 logs transaction-events
```

### Restart:
```bash
pm2 restart transaction-events
```

### Stop:
```bash
pm2 stop transaction-events
```

## State File

The script saves its progress to `server/scripts/transaction-events.state` file containing the last processed sequence ID. This allows the script to resume from the correct point after restarts.

## What it does

### On `transition/confirm-payment`:
- Reduces stock for all cart items by their quantity
- Removes purchased items from user's cart (including main listing + cart items)

### On cancellations/expirations:
- No action needed - Sharetribe automatically restores stock via `decline-stock-reservation` or `cancel-stock-reservation` actions

## Monitoring

The script logs all actions to console:
- Event processing
- Stock reductions
- Cart updates
- Errors

Monitor with:
```bash
pm2 logs transaction-events --lines 100
```

On Heroku:
```bash
heroku logs --tail --dyno=worker
```
