# Kuratert

A curated marketplace for art, design, and antiques built on [Sharetribe](https://www.sharetribe.com/).

## About

Kuratert connects art collectors, design enthusiasts, and sellers of exceptional pieces. The platform
is built on the Sharetribe Web Template with extensive customizations for the art and design market.

## Custom Features

### Design System

- Custom landing page with hero section, categories grid, and featured listings
- Redesigned profile pages with seller stats, tabs for listings/reviews, and share functionality
- Custom search experience with keyword predictions for categories, listings, and sellers
- Responsive design optimized for showcasing visual content

### Editorial Content (Sanity CMS)

The editorial section on the landing page is powered by [Sanity](https://www.sanity.io/), a headless CMS
that allows content editors to manage articles without code changes.

**Sanity Studio:** [kuratert.sanity.studio](https://kuratert.sanity.studio)

**Features:**
- Article management with rich text content
- Category organization
- Featured articles with customizable positions on the landing page
- Image optimization via Sanity CDN

**Related routes:**
- `/articles` - Browse all articles
- `/articles/:slug` - Individual article page

### Integration API Extensions

- User statistics (sales count, response rate, response time)
- Keyword search predictions across categories, listings, and sellers

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)

### Setup

```sh
git clone git@github.com:AleksaButterfly/kuratert.git
cd kuratert/
yarn install
yarn run config    # configure environment variables
yarn run dev       # start dev server at localhost:3000
```

### Environment Variables

In addition to standard Sharetribe variables, the following are required:

```sh
# Sanity CMS
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=your_api_token

# Integration API (for user stats and search)
SHARETRIBE_INTEGRATION_API_CLIENT_ID=your_client_id
SHARETRIBE_INTEGRATION_API_CLIENT_SECRET=your_client_secret
```

See [Environment configuration variables](https://www.sharetribe.com/docs/template/template-env/)
for the complete list of Sharetribe environment variables.

## Project Structure

```
kuratert/
├── server/
│   └── api/
│       ├── articles.js       # Sanity CMS endpoints
│       ├── user-stats.js     # User statistics endpoint
│       └── users-query.js    # User search endpoint
├── src/
│   ├── containers/
│   │   ├── ArticlePage/      # Single article view
│   │   ├── ArticlesPage/     # Articles listing
│   │   ├── LandingPage/      # Custom landing page
│   │   └── ProfilePage/      # Redesigned profile
│   └── translations/
│       └── no.json           # English translations
└── sanity-schemas/           # Reference schemas for Sanity Studio
```

## Related Repositories

- **Sanity Studio:** [github.com/AleksaButterfly/studio-kuratert](https://github.com/AleksaButterfly/studio-kuratert)

## Deployment

The application can be deployed to Heroku or any Node.js hosting platform.

See [How to deploy this template to production](https://www.sharetribe.com/docs/template/how-to-deploy-template-to-production/)
for deployment instructions.

## Documentation

- [Sharetribe Developer Docs](https://www.sharetribe.com/docs/)
- [Sanity Documentation](https://www.sanity.io/docs)

## License

This project is licensed under the terms of the Apache-2.0 license.

See [LICENSE](LICENSE)
