/**
 * This endpoint queries users using the Integration API and returns
 * sanitized user data (without private information like emails).
 */

const { handleError, serialize, getIntegrationSdk } = require('../api-util/sdk');

// Sanitize user data to remove sensitive information
const sanitizeUser = user => {
  const { id, type, attributes } = user;
  const { profile, createdAt } = attributes || {};
  const { displayName, abbreviatedName, publicData } = profile || {};

  return {
    id,
    type,
    attributes: {
      profile: {
        displayName,
        abbreviatedName,
        publicData,
      },
      createdAt,
    },
  };
};

module.exports = (req, res) => {
  const { keywords } = req.query;

  if (!keywords || keywords.trim().length === 0) {
    return res.status(200).json({ data: [] });
  }

  const integrationSdk = getIntegrationSdk();

  // Query users with keywords
  // Note: Integration API doesn't support keywords search directly,
  // so we fetch a reasonable number and filter client-side by display name
  // Only fetch users with userType "seller" in their public data
  integrationSdk.users
    .query({
      pub_userType: 'seller',
      perPage: 100,
    })
    .then(response => {
      const users = response.data.data || [];
      const searchTerm = keywords.toLowerCase().trim();

      // Filter users whose display name contains the search term
      const matchingUsers = users.filter(user => {
        const displayName = user.attributes?.profile?.displayName || '';
        return displayName.toLowerCase().includes(searchTerm);
      });

      // Sanitize and limit results
      const sanitizedUsers = matchingUsers.slice(0, 10).map(sanitizeUser);

      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({ data: sanitizedUsers }))
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
