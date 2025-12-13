/**
 * Supported languages for the marketplace
 */
export const supportedLanguages = [
  { code: 'no', language: 'Norsk', country: 'Norge' },
  { code: 'en', language: 'English', country: 'United States' },
];

/**
 * Get the full locale code from a short language code
 * @param {string} code - Short language code (e.g., 'no', 'en')
 * @returns {string} Full locale code (e.g., 'nb-NO', 'en')
 */
export const getLocaleFromCode = code => {
  return code === 'no' ? 'nb-NO' : 'en';
};

/**
 * Get the short language code from a full locale
 * @param {string} locale - Full locale code (e.g., 'nb-NO', 'en')
 * @returns {string} Short language code (e.g., 'no', 'en')
 */
export const getCodeFromLocale = locale => {
  return locale.startsWith('nb') || locale === 'no' ? 'no' : 'en';
};
