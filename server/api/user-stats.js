/**
 * This endpoint fetches user statistics using the Integration API:
 * - Total sales count (completed transactions where user is provider)
 * - Response rate (percentage of inquiries responded to)
 * - Response time (average time to first response)
 */

const { handleError, serialize, getIntegrationSdk } = require('../api-util/sdk');

// Helper to calculate average response time from transactions with messages
const calculateResponseStats = (transactions, providerId) => {
  let totalResponses = 0;
  let totalResponseTime = 0;
  let inquiriesReceived = 0;

  transactions.forEach(transaction => {
    const messages = transaction.relationships?.messages?.data || [];
    if (messages.length === 0) return;

    // Get the included messages for this transaction
    const transactionMessages = messages
      .map(msgRef => transaction.includedMessages?.find(m => m.id.uuid === msgRef.id.uuid))
      .filter(Boolean)
      .sort((a, b) => new Date(a.attributes.createdAt) - new Date(b.attributes.createdAt));

    if (transactionMessages.length === 0) return;

    // Find first customer message (inquiry)
    const firstCustomerMessage = transactionMessages.find(
      msg => msg.relationships?.sender?.data?.id?.uuid !== providerId
    );

    if (!firstCustomerMessage) return;

    inquiriesReceived++;

    // Find first provider response after customer message
    const customerMessageTime = new Date(firstCustomerMessage.attributes.createdAt);
    const firstProviderResponse = transactionMessages.find(msg => {
      const isFromProvider = msg.relationships?.sender?.data?.id?.uuid === providerId;
      const isAfterCustomer = new Date(msg.attributes.createdAt) > customerMessageTime;
      return isFromProvider && isAfterCustomer;
    });

    if (firstProviderResponse) {
      totalResponses++;
      const responseTime = new Date(firstProviderResponse.attributes.createdAt) - customerMessageTime;
      totalResponseTime += responseTime;
    }
  });

  const responseRate = inquiriesReceived > 0 ? Math.round((totalResponses / inquiriesReceived) * 100) : 0;
  const avgResponseTimeMs = totalResponses > 0 ? totalResponseTime / totalResponses : 0;

  // Convert to hours
  const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);

  return {
    responseRate,
    avgResponseTimeHours,
    inquiriesReceived,
    totalResponses,
  };
};

// Format response time to human readable string
const formatResponseTime = (hours) => {
  if (hours === 0) return null;
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  }
  if (hours < 24) {
    const roundedHours = Math.round(hours);
    return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
};

module.exports = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const integrationSdk = getIntegrationSdk();

  try {
    // Fetch all transactions where user is the provider
    // We need to fetch transactions with messages to calculate response stats
    const transactionsResponse = await integrationSdk.transactions.query({
      providerId: userId,
      include: ['messages', 'messages.sender'],
      perPage: 100,
    });

    const transactions = transactionsResponse.data.data || [];
    const included = transactionsResponse.data.included || [];

    // Attach included messages to transactions for easier processing
    const messagesById = {};
    included.forEach(item => {
      if (item.type === 'message') {
        messagesById[item.id.uuid] = item;
      }
    });

    const transactionsWithMessages = transactions.map(tx => ({
      ...tx,
      includedMessages: (tx.relationships?.messages?.data || [])
        .map(ref => messagesById[ref.id.uuid])
        .filter(Boolean),
    }));

    // Count completed sales (transactions that reached a "delivered" or "completed" state)
    // Common completed states: delivered, reviewed, completed
    const completedStates = [
      'delivered',
      'reviewed',
      'completed',
      'reviewed-by-provider',
      'reviewed-by-customer',
    ];

    const salesCount = transactions.filter(tx => {
      const lastTransition = tx.attributes.lastTransition || '';
      const state = tx.attributes.state || '';
      // Check if transaction is in a completed state
      return (
        completedStates.some(s => state.includes(s)) ||
        lastTransition.includes('complete') ||
        lastTransition.includes('deliver') ||
        lastTransition.includes('review')
      );
    }).length;

    // Calculate response stats
    const responseStats = calculateResponseStats(transactionsWithMessages, userId);

    const stats = {
      salesCount,
      responseRate: responseStats.responseRate,
      responseTime: formatResponseTime(responseStats.avgResponseTimeHours),
      responseTimeHours: responseStats.avgResponseTimeHours,
    };

    res
      .status(200)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({ data: stats }))
      .end();
  } catch (e) {
    console.error('Error fetching user stats:', e);
    handleError(res, e);
  }
};
