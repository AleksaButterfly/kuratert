import React, { useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { richText } from '../../../util/richText';
import { Avatar, NamedLink, Modal } from '../../../components';

import css from './ProfileHero.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

const IconVerified = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.5 8L7.5 9L9.5 7M8 2.5C8 2.5 9.5 1 11 1.5C12.5 2 13 3.5 13 3.5C13 3.5 14.5 4 15 5.5C15.5 7 14 8.5 14 8.5C14 8.5 14.5 10 14 11.5C13.5 13 12 13.5 12 13.5C12 13.5 11.5 15 10 15.5C8.5 16 7 14.5 7 14.5C7 14.5 5.5 16 4 15.5C2.5 15 2 13.5 2 13.5C2 13.5 0.5 13 0 11.5C-0.5 10 1 8.5 1 8.5C1 8.5 -0.5 7 0 5.5C0.5 4 2 3.5 2 3.5C2 3.5 2.5 2 4 1.5C5.5 1 7 2.5 7 2.5L8 2.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const IconLocation = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 8.5C9.10457 8.5 10 7.60457 10 6.5C10 5.39543 9.10457 4.5 8 4.5C6.89543 4.5 6 5.39543 6 6.5C6 7.60457 6.89543 8.5 8 8.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M8 14.5C8 14.5 13 10.5 13 6.5C13 3.73858 10.7614 1.5 8 1.5C5.23858 1.5 3 3.73858 3 6.5C3 10.5 8 14.5 8 14.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5 1.5V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M11 1.5V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1L10.163 5.27865L15 6.02786L11.5 9.32164L12.326 14L8 11.7787L3.674 14L4.5 9.32164L1 6.02786L5.837 5.27865L8 1Z"
      fill="#C9A961"
      stroke="#C9A961"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconShare = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.667 8.667V12.667C12.667 13.02 12.526 13.359 12.276 13.609C12.026 13.859 11.687 14 11.333 14H3.333C2.98 14 2.64 13.859 2.39 13.609C2.14 13.359 2 13.02 2 12.667V4.667C2 4.313 2.14 3.974 2.39 3.724C2.64 3.474 2.98 3.333 3.333 3.333H7.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M6.667 9.333L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconFlag = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 14.5V1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M3 1.5C3 1.5 4 1 6.5 1C9 1 10 2.5 12.5 2.5C13.5 2.5 14 2.25 14 2.25V9.25C14 9.25 13.5 9.5 12.5 9.5C10 9.5 9 8 6.5 8C4 8 3 8.5 3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.5 2.5L13.5 4.5M2 14L2.5 11.5L11 3L13 5L4.5 13.5L2 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M11 5V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.0084 4.92548 17.3425 8.75 17.9V12.3125H6.71875V10H8.75V8.2375C8.75 6.2325 9.94438 5.125 11.7717 5.125C12.6467 5.125 13.5625 5.28125 13.5625 5.28125V7.25H12.5533C11.56 7.25 11.25 7.86667 11.25 8.5V10H13.4688L13.1146 12.3125H11.25V17.9C15.0745 17.3425 18 14.0084 18 10Z" fill="currentColor"/>
  </svg>
);

const IconTwitter = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.2719 3H17.6831L12.4106 9.01244L18.5 17H13.6788L10.0381 12.2018L5.88438 17H3.47188L9.10312 10.5706L3.25 3H8.19375L11.4775 7.37562L15.2719 3ZM14.3869 15.5019H15.6781L7.43 4.32312H6.04563L14.3869 15.5019Z" fill="currentColor"/>
  </svg>
);

const IconLinkedIn = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.78125 17.5H2.8125V7.1875H5.78125V17.5ZM4.29688 5.9375C3.35156 5.9375 2.5 5.11719 2.5 4.14062C2.5 3.16406 3.35156 2.34375 4.29688 2.34375C5.27344 2.34375 6.09375 3.16406 6.09375 4.14062C6.09375 5.11719 5.27344 5.9375 4.29688 5.9375ZM17.5 17.5H14.5625V12.4219C14.5625 11.2266 14.5312 9.71875 12.9375 9.71875C11.3125 9.71875 11.0625 11.0156 11.0625 12.3438V17.5H8.09375V7.1875H10.9375V8.59375H10.9688C11.375 7.78125 12.4062 6.9375 13.9375 6.9375C16.9375 6.9375 17.5 8.9375 17.5 11.5156V17.5Z" fill="currentColor"/>
  </svg>
);

const IconEmail = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M2 5L10 11L18 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const ProfileHero = props => {
  const {
    className,
    rootClassName,
    user,
    bio,
    displayName,
    isCurrentUser,
    listings = [],
    reviews = [],
    onManageDisableScrolling,
    isSeller = true,
    userStats,
  } = props;

  const intl = useIntl();
  const classes = classNames(rootClassName || css.root, className);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicData = user?.attributes?.profile?.publicData || {};
  const metadata = user?.attributes?.metadata || {};
  const createdAt = user?.attributes?.createdAt;
  const isVerified = metadata?.verified === true;
  const userId = user?.id?.uuid;

  // Format member since date
  const memberSince = createdAt
    ? new Date(createdAt).getFullYear()
    : null;

  // Bio with links
  const bioWithLinks = bio
    ? richText(bio, {
        linkify: true,
        longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
        longWordClass: css.longWord,
      })
    : null;

  // Stats - calculated dynamically
  const activeListings = listings.length || 0;
  const totalSales = userStats?.salesCount ?? 0;
  const reviewCount = reviews.length || 0;

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return null;
    const totalRating = reviews.reduce((sum, review) => {
      return sum + (review.attributes?.rating || 0);
    }, 0);
    return (totalRating / reviews.length).toFixed(1);
  };
  const averageRating = calculateAverageRating();

  // Response rate and time from server stats
  const responseRate = userStats?.responseRate != null ? `${userStats.responseRate}%` : null;
  const responseTime = userStats?.responseTime || null;

  // Get the current page URL for sharing
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const shareUrl = getShareUrl();

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Share to social media
  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const text = intl.formatMessage({ id: 'ProfileHero.shareText' }, { name: displayName });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareEmail = () => {
    const subject = intl.formatMessage({ id: 'ProfileHero.shareEmailSubject' }, { name: displayName });
    const body = intl.formatMessage({ id: 'ProfileHero.shareEmailBody' }, { name: displayName, url: shareUrl });
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={classes}>
      <div className={css.container}>
        {/* Avatar */}
        <div className={css.avatarContainer}>
          <Avatar className={css.avatar} initialsClassName={css.avatarInitials} user={user} disableProfileLink />
        </div>

        {/* Content */}
        <div className={css.content}>
          {/* Header row: Name + Verified badge + Action buttons */}
          <div className={css.header}>
            <div className={css.nameRow}>
              <h1 className={css.displayName}>{displayName}</h1>
              {/* Verified badge - only show for sellers */}
              {isSeller && isVerified && (
                <div className={css.verifiedBadge}>
                  <IconVerified />
                  <span><FormattedMessage id="ProfileHero.verified" /></span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className={css.actionButtons}>
              {/* Edit profile button for current user */}
              {isCurrentUser && (
                <NamedLink
                  className={css.actionButton}
                  name="ProfileSettingsPage"
                  title={intl.formatMessage({ id: 'ProfileHero.editProfile' })}
                >
                  <IconEdit />
                </NamedLink>
              )}

              {/* Share button */}
              <button
                className={css.actionButton}
                title={intl.formatMessage({ id: 'ProfileHero.share' })}
                onClick={() => setIsShareModalOpen(true)}
              >
                <IconShare />
              </button>

              {/* Report button - only show for other users */}
              {!isCurrentUser && (
                <a
                  className={css.actionButton}
                  title={intl.formatMessage({ id: 'ProfileHero.report' })}
                  href={`mailto:support@kuratert.com?subject=${encodeURIComponent(
                    intl.formatMessage({ id: 'ProfileHero.reportEmailSubject' }, { userId })
                  )}&body=${encodeURIComponent(
                    intl.formatMessage({ id: 'ProfileHero.reportEmailBody' }, { userId, name: displayName, url: shareUrl })
                  )}`}
                >
                  <IconFlag />
                </a>
              )}
            </div>
          </div>

          {/* Meta info: Location + Member since */}
          <div className={css.metaInfo}>
            {memberSince && (
              <div className={css.metaItem}>
                <IconCalendar />
                <span>
                  <FormattedMessage id="ProfileHero.memberSince" values={{ year: memberSince }} />
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {bioWithLinks && (
            <p className={css.bio}>{bioWithLinks}</p>
          )}

          {/* Stats row - only show for sellers */}
          {isSeller && (
            <div className={css.statsRow}>
              <div className={css.statItem}>
                <span className={css.statValue}>{activeListings}</span>
                <span className={css.statLabel}>
                  <FormattedMessage id="ProfileHero.activeListings" />
                </span>
              </div>

              <div className={css.statItem}>
                <span className={css.statValue}>{totalSales}</span>
                <span className={css.statLabel}>
                  <FormattedMessage id="ProfileHero.sales" />
                </span>
              </div>

              <div className={css.statItem}>
                <div className={css.statValueWithIcon}>
                  <IconStar />
                  <span className={css.statValue}>{averageRating || '0'}</span>
                </div>
                <span className={css.statLabel}>
                  <FormattedMessage id="ProfileHero.reviews" values={{ count: reviewCount }} />
                </span>
              </div>

              <div className={css.statItem}>
                <span className={css.statValue}>{responseRate || '0%'}</span>
                <span className={css.statLabel}>
                  <FormattedMessage id="ProfileHero.responseRate" />
                </span>
              </div>

              <div className={css.statItem}>
                <div className={css.statValueWithIcon}>
                  <IconClock />
                  <span className={css.statValue}>
                    {responseTime || intl.formatMessage({ id: 'ProfileHero.noResponseTime' })}
                  </span>
                </div>
                <span className={css.statLabel}>
                  <FormattedMessage id="ProfileHero.responseTime" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        id="ProfileHero.shareModal"
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <div className={css.modalContent}>
          <h2 className={css.modalTitle}>
            <FormattedMessage id="ProfileHero.shareModalTitle" />
          </h2>

          {/* Copy link section */}
          <div className={css.copyLinkSection}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className={css.copyLinkInput}
            />
            <button
              className={css.copyLinkButton}
              onClick={handleCopyLink}
            >
              {copied ? <IconCheck /> : <IconCopy />}
              <span>{copied ? intl.formatMessage({ id: 'ProfileHero.copied' }) : intl.formatMessage({ id: 'ProfileHero.copyLink' })}</span>
            </button>
          </div>

          {/* Social share buttons */}
          <div className={css.socialShareSection}>
            <p className={css.socialShareLabel}>
              <FormattedMessage id="ProfileHero.shareOn" />
            </p>
            <div className={css.socialButtons}>
              <button className={css.socialButton} onClick={handleShareFacebook} title="Facebook">
                <IconFacebook />
              </button>
              <button className={css.socialButton} onClick={handleShareTwitter} title="X (Twitter)">
                <IconTwitter />
              </button>
              <button className={css.socialButton} onClick={handleShareLinkedIn} title="LinkedIn">
                <IconLinkedIn />
              </button>
              <button className={css.socialButton} onClick={handleShareEmail} title="Email">
                <IconEmail />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileHero;
