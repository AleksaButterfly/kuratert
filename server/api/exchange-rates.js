const { getRates } = require('../api-util/exchangeRate');

// Returns all exchange rates with NOK as the base currency.
// rates[X] = how many X equals 1 NOK.
module.exports = async (_req, res) => {
  try {
    const rates = await getRates();
    return res.status(200).json({ base: 'NOK', rates });
  } catch (e) {
    console.error('Exchange rates fetch failed:', e);
    return res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
};
