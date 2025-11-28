import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import FallbackPage from './FallbackPage';
import FallbackLandingPage from './FallbackLandingPage';
import { ASSET_NAME } from './LandingPage.duck';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

// Check if we should use hosted landing page (from environment variable)
const useHostedLandingPage = process.env.REACT_APP_USE_HOSTED_LANDING_PAGE === 'true';

export const LandingPageComponent = props => {
  const { pageAssetsData, inProgress, error, scrollingDisabled } = props;

  // If env variable is set to false (or not set), always render the local fallback landing page
  if (!useHostedLandingPage) {
    return <FallbackLandingPage scrollingDisabled={scrollingDisabled} />;
  }

  // Otherwise, use PageBuilder pattern (hosted assets with fallback for errors)
  return (
    <PageBuilder
      pageAssetsData={pageAssetsData?.[camelize(ASSET_NAME)]?.data}
      inProgress={inProgress}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
    />
  );
};

LandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
  scrollingDisabled: bool.isRequired,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return {
    pageAssetsData,
    inProgress,
    error,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const LandingPage = compose(connect(mapStateToProps))(LandingPageComponent);

export default LandingPage;
