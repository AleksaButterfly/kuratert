const https = require('https');

// In-memory cache. Refreshed every hour.
let rateCache = {};
let lastFetchTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const fetchRates = () => {
  return new Promise((resolve, reject) => {
    const url = 'https://open.er-api.com/v6/latest/NOK';
    https
      .get(url, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.result === 'success' && parsed.rates) {
              resolve(parsed.rates);
            } else {
              reject(new Error('Failed to fetch exchange rates'));
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
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
    if (Object.keys(rateCache).length > 0) {
      return rateCache;
    }
    throw e;
  }
};

// Rates are based on NOK.
// from -> to:
//   to NOK:    rate = 1 / rates[from]
//   from NOK:  rate = rates[to]
//   other:     rate = rates[to] / rates[from]
const getRate = async (from, to) => {
  if (from === to) return 1;
  const rates = await getRates();
  let rate;
  if (to === 'NOK') {
    rate = 1 / rates[from];
  } else if (from === 'NOK') {
    rate = rates[to];
  } else {
    rate = rates[to] / rates[from];
  }
  if (!rate || isNaN(rate)) {
    throw new Error(`Unsupported currency pair: ${from} -> ${to}`);
  }
  return rate;
};

module.exports = { getRates, getRate };
