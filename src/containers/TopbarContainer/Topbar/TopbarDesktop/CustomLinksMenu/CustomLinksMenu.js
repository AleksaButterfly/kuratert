import React, { useEffect, useRef, useState } from 'react';

import PriorityLinks, { CreateListingMenuLink } from './PriorityLinks';
import LinksMenu from './LinksMenu';

import css from './CustomLinksMenu.module.css';

const draftId = '00000000-0000-0000-0000-000000000000';
const createListingLinkConfigMaybe = (intl, showLink) =>
  showLink
    ? [
        {
          group: 'primary',
          text: intl.formatMessage({ id: 'TopbarDesktop.createListing' }),
          type: 'internal',
          route: {
            name: 'EditListingPage',
            params: { slug: 'draft', id: draftId, type: 'new', tab: 'details' },
          },
          highlight: true,
        },
      ]
    : [];

/**
 * Group links based on available space.
 */
const groupMeasuredLinks = (links, containerWidth, menuMoreWidth) => {
  const isMeasured = !!links?.[0]?.width && menuMoreWidth > 0;
  const hasNoPrimaryLinks = !links.find(l => l.group === 'primary');

  if (!isMeasured || hasNoPrimaryLinks) {
    return { priorityLinks: [], menuLinks: links };
  }

  const groupedLinks = links.reduce(
    (pickedLinks, link, i) => {
      const isPrimary = link.group === 'primary';
      const isLast = i === links.length - 1;
      const hasMenuLinks = pickedLinks.menuLinks?.length > 0;

      const hasSpace =
        isLast && !hasMenuLinks
          ? link.cumulatedWidth <= containerWidth
          : link.cumulatedWidth + menuMoreWidth <= containerWidth;

      return isPrimary && hasSpace
        ? {
            priorityLinks: [...pickedLinks.priorityLinks, link],
            menuLinks: pickedLinks.menuLinks,
          }
        : {
            priorityLinks: pickedLinks.priorityLinks,
            menuLinks: [...pickedLinks.menuLinks, link],
          };
    },
    { priorityLinks: [], menuLinks: [] }
  );
  return groupedLinks;
};

const calculateContainerWidth = (containerRefTarget, parentWidth) => {
  const siblingArray = containerRefTarget?.parentNode?.childNodes
    ? Array.from(containerRefTarget.parentNode.childNodes).filter(n => n !== containerRefTarget)
    : [];
  const siblingWidthsCombined = siblingArray.reduce((acc, node) => acc + node.offsetWidth, 0);

  const parentStyleMap = containerRefTarget?.parentElement?.computedStyleMap
    ? containerRefTarget.parentElement.computedStyleMap()
    : null;
  const gapValue = parentStyleMap?.get('gap')?.value;
  const gap = gapValue != null ? gapValue : 24;

  // Available width = parent width - siblings - gaps between items
  const numberOfGaps = siblingArray.length;
  const availableContainerWidth = parentWidth - siblingWidthsCombined - (numberOfGaps * gap);
  return Math.max(0, availableContainerWidth);
};

/**
 * Smart CustomLinksMenu that measures available space and shows links
 * either as plain links or in a dropdown menu.
 */
const CustomLinksMenu = ({
  currentPage,
  customLinks = [],
  hasClientSideContentReady,
  intl,
  showCreateListingsLink,
}) => {
  const containerRef = useRef(null);
  const observer = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [moreLabelWidth, setMoreLabelWidth] = useState(0);
  const [links, setLinks] = useState([
    ...createListingLinkConfigMaybe(intl, showCreateListingsLink),
    ...customLinks,
  ]);

  const [layoutData, setLayoutData] = useState({
    priorityLinks: links,
    menuLinks: links,
    containerWidth: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let animationFrameId = null;
    const body = document.body;
    const container = containerRef.current;

    if (hasClientSideContentReady && moreLabelWidth > 0) {
      observer.current = new ResizeObserver(entries => {
        const containerRefParentWidth = container?.parentNode?.offsetWidth;
        const bodyOffsetWidth = body.offsetWidth;

        for (const entry of entries) {
          const isBodyTheTarget = entry.target === body;
          const hasWidthOfTopbarDesktopChanged =
            !isBodyTheTarget && containerRefParentWidth !== bodyOffsetWidth;

          if (isBodyTheTarget || hasWidthOfTopbarDesktopChanged) {
            const target = container;
            const availableContainerWidth = calculateContainerWidth(target, containerRefParentWidth || bodyOffsetWidth);

            const groupedLinks = groupMeasuredLinks(links, availableContainerWidth, moreLabelWidth);
            animationFrameId = window.requestAnimationFrame(() => {
              if (container) {
                setLayoutData({ ...groupedLinks, containerWidth: availableContainerWidth });
              }
            });
            break;
          }
        }
      });

      if (container) {
        observer.current.observe(body);
        observer.current.observe(container);
      }
    }
    return () => {
      if (body) {
        observer.current?.unobserve(body);
      }
      if (container) {
        observer.current?.unobserve(container);
      }
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [containerRef, hasClientSideContentReady, moreLabelWidth, links]);

  const { priorityLinks, menuLinks, containerWidth } = layoutData;

  // If there are no custom links, just render createListing link
  if (customLinks?.length === 0 && showCreateListingsLink) {
    return <CreateListingMenuLink customLinksMenuClass={css.createListingLinkOnly} />;
  }

  // If no links at all, return null
  if (customLinks?.length === 0 && !showCreateListingsLink) {
    return null;
  }

  const isMeasured = !!links?.[0]?.width;
  const hasMenuLinks = menuLinks?.length > 0;
  const hasPriorityLinks = isMeasured && priorityLinks.length > 0;

  return (
    <div className={css.customLinksMenu} ref={containerRef}>
      <PriorityLinks links={links} priorityLinks={priorityLinks} setLinks={setLinks} />
      {mounted && hasMenuLinks ? (
        <LinksMenu
          id="linksMenu"
          currentPage={currentPage}
          links={menuLinks}
          showMoreLabel={hasPriorityLinks}
          moreLabelWidth={moreLabelWidth}
          setMoreLabelWidth={setMoreLabelWidth}
          intl={intl}
        />
      ) : null}
    </div>
  );
};

export default CustomLinksMenu;
