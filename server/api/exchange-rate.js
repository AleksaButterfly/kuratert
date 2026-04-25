const { getRate } = require('../api-util/exchangeRate');

module.exports = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to query parameter' });
  }

  try {
    const rate = await getRate(from, to);
    return res.status(200).json({ from, to, rate });
  } catch (e) {
    console.error('Exchange rate fetch failed:', e);
    if (e.message && e.message.startsWith('Unsupported currency pair')) {
      return res.status(400).json({ error: e.message });
    }
    return res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
};
