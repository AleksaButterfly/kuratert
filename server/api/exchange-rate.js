const https = require('https');

// Simple in-memory cache for exchange rates (refreshed every hour)
let rateCache = {};
let lastFetchTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const fetchRates = () => {
  return new Promise((resolve, reject) => {
    // Using the free exchangerate.host API (no key required)
    const url = 'https://api.exchangerate.host/latest?base=NOK';
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success !== false && parsed.rates) {
            resolve(parsed.rates);
          } else {
            reject(new Error('Failed to fetch exchange rates'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const getRates = async () => {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL && Object.keys(rateCache).length > 0) {
    return rateCache;
  }
  try {
    const rates = await fetchRates();
    rateCache = rates;
    lastFetchTime = now;
    return rates;
  } catch (e) {
    // If fetch fails but we have cached rates, use them
    if (Object.keys(rateCache).length > 0) {
      return rateCache;
    }
    throw e;
  }
};

module.exports = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to query parameter' });
  }

  try {
    const rates = await getRates();

    // rates are based on NOK, so:
    // - If converting TO NOK: rate = 1 / rates[from]
    // - If converting FROM NOK: rate = rates[to]
    // - Otherwise: rate = rates[to] / rates[from]
    let rate;
    if (to === 'NOK') {
      rate = 1 / rates[from];
    } else if (from === 'NOK') {
      rate = rates[to];
    } else {
      rate = rates[to] / rates[from];
    }

    if (!rate || isNaN(rate)) {
      return res.status(400).json({ error: `Unsupported currency pair: ${from} -> ${to}` });
    }

    return res.status(200).json({ from, to, rate });
  } catch (e) {
    console.error('Exchange rate fetch failed:', e);
    return res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
};
