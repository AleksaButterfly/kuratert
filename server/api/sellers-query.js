/**
 * This endpoint queries seller users using the Integration API.
 * Returns users with pub_userType: 'seller' including their profile images.
 */

const { handleError, serialize, getIntegrationSdk } = require('../api-util/sdk');

// Sanitize user data to remove sensitive information
const sanitizeUser = user => {
  const { id, type, attributes, profileImage } = user;
  const { profile, createdAt } = attributes || {};
  const { displayName, abbreviatedName, publicData, bio } = profile || {};

  return {
    id,
    type,
    attributes: {
      profile: {
        displayName,
        abbreviatedName,
        publicData,
        bio,
      },
      createdAt,
    },
    profileImage,
  };
};

module.exports = (req, res) => {
  const { perPage = 6 } = req.query;

  const integrationSdk = getIntegrationSdk();

  // Query users with userType "seller"
  integrationSdk.users
    .query({
      pub_userType: 'seller',
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
      perPage: parseInt(perPage, 10),
    })
    .then(response => {
      const users = response.data.data || [];
      const included = response.data.included || [];

      // Map profile images to users
      const usersWithImages = users.map(user => {
        const profileImageRef = user.relationships?.profileImage?.data;
        const profileImage = profileImageRef
          ? included.find(img => img.id.uuid === profileImageRef.id.uuid)
          : null;

        return {
          ...user,
          profileImage,
        };
      });

      // Sanitize results
      const sanitizedUsers = usersWithImages.map(sanitizeUser);

      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({ data: sanitizedUsers, included }))
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
