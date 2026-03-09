import React, { useState, useEffect, useCallback } from 'react';
import { string, array, bool } from 'prop-types';
import classNames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';

import { useConfiguration } from '../../../context/configurationContext';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useIntl } from '../../../util/reactIntl';
import { createResourceLocatorString } from '../../../util/routes';
import { isMainSearchTypeKeywords } from '../../../util/search';
import { getSearchPageResourceLocatorStringParams } from '../../SearchPage/SearchPage.shared';

import HeroSearchForm from './HeroSearchForm/HeroSearchForm';

import css from './SectionHero.module.css';

// Auto-rotation interval in milliseconds
const SLIDE_INTERVAL = 10000;

const SectionHero = props => {
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();

  const { rootClassName, className, slides = [], isLoading = false } = props;
  const classes = classNames(rootClassName || css.root, className);

  // Current slide index
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use slides from Sanity or fall back to single default slide
  const hasSlides = slides.length > 0;
  const slideCount = hasSlides ? slides.length : 1;

  // Get current slide data
  const currentSlideData = hasSlides ? slides[currentSlide] : null;

  // Use slide title/subtitle if available, otherwise use default intl messages
  const title = currentSlideData?.title || intl.formatMessage({ id: 'SectionHero.title' });
  const subtitle = currentSlideData?.subtitle || intl.formatMessage({ id: 'SectionHero.subtitle' });
  const copyright = currentSlideData?.copyright || null;
  const slideLink = currentSlideData?.link || null;

  // Go to next slide
  const goToNextSlide = useCallback(() => {
    if (slideCount <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(prev => (prev + 1) % slideCount);
      setIsTransitioning(false);
    }, 300);
  }, [slideCount]);

  // Go to specific slide
  const goToSlide = useCallback((index) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
  }, [currentSlide]);

  // Auto-rotation effect
  useEffect(() => {
    if (slideCount <= 1) return;

    const interval = setInterval(goToNextSlide, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [slideCount, goToNextSlide]);

  const handleSearchSubmit = values => {
    const isKeywordsSearch = isMainSearchTypeKeywords(config);
    const { routeName, pathParams } = getSearchPageResourceLocatorStringParams(
      routeConfiguration,
      location
    );

    let searchParams = {};
    if (isKeywordsSearch) {
      const keywords = values?.keywords?.trim();
      searchParams = keywords ? { keywords } : {};
    } else {
      const { search, selectedPlace } = values?.location || {};
      const { origin, bounds } = selectedPlace || {};
      searchParams = {
        ...(search ? { address: search } : {}),
        ...(origin ? { origin: `${origin.lat},${origin.lng}` } : {}),
        ...(bounds ? { bounds: `${bounds.ne.lat},${bounds.ne.lng},${bounds.sw.lat},${bounds.sw.lng}` } : {}),
      };
    }

    history.push(
      createResourceLocatorString(routeName, routeConfiguration, pathParams, searchParams)
    );
  };

  // Background style - use slide image or default CSS background
  const backgroundStyle = currentSlideData?.image
    ? { backgroundImage: `url(${currentSlideData.image})` }
    : {};

  const heroClasses = classNames(classes, {
    [css.hasCustomBackground]: !!currentSlideData?.image,
    [css.isTransitioning]: isTransitioning,
  });

  // Handle slide link click
  const handleSlideClick = () => {
    if (slideLink) {
      window.open(slideLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={heroClasses} style={backgroundStyle}>
      <div className={css.overlay} />

      {/* Clickable link overlay - only when slide has a link */}
      {slideLink && (
        <button
          className={css.slideLinkOverlay}
          onClick={handleSlideClick}
          aria-label="Visit link"
        />
      )}

      <div className={css.heroContent}>
        <h1 className={classNames(css.heroTitle, { [css.fadeText]: isTransitioning })}>
          {title}
        </h1>
        <p className={classNames(css.heroSubtitle, { [css.fadeText]: isTransitioning })}>
          {subtitle}
        </p>
        <HeroSearchForm
          className={css.searchForm}
          onSubmit={handleSearchSubmit}
          appConfig={config}
        />
      </div>

      {/* Copyright / Image credit - bottom right */}
      {copyright && (
        <div className={classNames(css.copyright, { [css.fadeText]: isTransitioning })}>
          {copyright}
        </div>
      )}

      {/* Carousel dots - only show if more than one slide */}
      {slideCount > 1 && (
        <div className={css.carouselDots}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={classNames(css.dot, { [css.dotActive]: index === currentSlide })}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className={css.scrollIndicator}>
        <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="38" rx="11" stroke="white" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="4" fill="white" className={css.scrollDot}/>
        </svg>
      </div>
    </div>
  );
};

SectionHero.propTypes = {
  rootClassName: string,
  className: string,
  slides: array,
  isLoading: bool,
};

export default SectionHero;
