import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

export const ASSET_NAME = 'landing-page';

// Check if we should use hosted landing page (from environment variable)
const useHostedLandingPage = process.env.REACT_APP_USE_HOSTED_LANDING_PAGE === 'true';

export const loadData = (params, search, config) => dispatch => {
  // If using hosted landing page, fetch the page assets
  if (useHostedLandingPage) {
    const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };
    return dispatch(fetchPageAssets(pageAsset, true));
  }

  // Otherwise, no need to fetch hosted assets for the fallback page
  // You can add other data fetching here (e.g., featured listings) when needed
  return Promise.resolve();
};
