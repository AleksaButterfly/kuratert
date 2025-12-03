const { createClient } = require('@sanity/client');

// Initialize Sanity client
const getSanityClient = () => {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || 'production';
  const apiVersion = process.env.SANITY_API_VERSION || '2024-01-01';

  if (!projectId) {
    throw new Error('SANITY_PROJECT_ID environment variable is required');
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true, // Use CDN for faster responses
  });
};

// Convert Sanity Portable Text to HTML
const portableTextToHtml = (blocks) => {
  if (!blocks || !Array.isArray(blocks)) return '';

  return blocks.map(block => {
    if (block._type === 'block') {
      const text = block.children
        ?.map(child => {
          let text = child.text || '';
          if (child.marks?.includes('strong')) text = `<strong>${text}</strong>`;
          if (child.marks?.includes('em')) text = `<em>${text}</em>`;
          if (child.marks?.includes('underline')) text = `<u>${text}</u>`;
          // Handle links
          const linkMark = child.marks?.find(m => typeof m === 'string' && block.markDefs?.find(d => d._key === m && d._type === 'link'));
          if (linkMark) {
            const linkDef = block.markDefs.find(d => d._key === linkMark);
            if (linkDef) {
              text = `<a href="${linkDef.href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            }
          }
          return text;
        })
        .join('') || '';

      switch (block.style) {
        case 'h2':
          return `<h2>${text}</h2>`;
        case 'h3':
          return `<h3>${text}</h3>`;
        case 'h4':
          return `<h4>${text}</h4>`;
        case 'blockquote':
          return `<blockquote>${text}</blockquote>`;
        default:
          return `<p>${text}</p>`;
      }
    }

    if (block._type === 'image' && block.asset) {
      const imageUrl = `https://cdn.sanity.io/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET || 'production'}/${block.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}`;
      return `<figure><img src="${imageUrl}" alt="${block.alt || ''}" /></figure>`;
    }

    return '';
  }).join('\n');
};

// Build image URL from Sanity image reference
const buildImageUrl = (image, width = 800) => {
  if (!image?.asset?._ref) return null;

  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || 'production';
  const ref = image.asset._ref;

  // Parse the reference: image-{id}-{dimensions}-{format}
  const [, id, dimensions, format] = ref.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/) || [];

  if (!id) return null;

  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}?w=${width}&auto=format`;
};

// Get featured articles for landing page
const getFeaturedArticles = async (req, res) => {
  try {
    const client = getSanityClient();

    const query = `*[_type == "article" && isFeatured == true] | order(featuredPosition asc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      readTime,
      featuredPosition,
      publishedAt,
      image,
      "category": category->{
        name,
        "slug": slug.current
      }
    }[0...3]`;

    const articles = await client.fetch(query);

    const formattedArticles = articles.map(article => ({
      id: article._id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      readTime: article.readTime,
      featuredPosition: article.featuredPosition,
      publishedAt: article.publishedAt,
      image: buildImageUrl(article.image, 800),
      category: article.category?.name || 'Uncategorized',
      categorySlug: article.category?.slug,
    }));

    res.status(200).json({ data: formattedArticles });
  } catch (error) {
    console.error('Error fetching featured articles:', error);
    res.status(500).json({ error: 'Failed to fetch featured articles' });
  }
};

// Get all articles (with optional category filter)
const getAllArticles = async (req, res) => {
  try {
    const client = getSanityClient();
    const { category, page = 1, perPage = 12 } = req.query;
    const start = (parseInt(page) - 1) * parseInt(perPage);
    const end = start + parseInt(perPage);

    let categoryFilter = '';
    if (category) {
      categoryFilter = ` && category->slug.current == "${category}"`;
    }

    const query = `{
      "articles": *[_type == "article"${categoryFilter}] | order(publishedAt desc) [${start}...${end}] {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        readTime,
        publishedAt,
        image,
        "category": category->{
          name,
          "slug": slug.current
        }
      },
      "total": count(*[_type == "article"${categoryFilter}]),
      "categories": *[_type == "category"] | order(name asc) {
        _id,
        name,
        "slug": slug.current
      }
    }`;

    const result = await client.fetch(query);

    const formattedArticles = result.articles.map(article => ({
      id: article._id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      readTime: article.readTime,
      publishedAt: article.publishedAt,
      image: buildImageUrl(article.image, 600),
      category: article.category?.name || 'Uncategorized',
      categorySlug: article.category?.slug,
    }));

    res.status(200).json({
      data: {
        articles: formattedArticles,
        total: result.total,
        page: parseInt(page),
        perPage: parseInt(perPage),
        totalPages: Math.ceil(result.total / parseInt(perPage)),
        categories: result.categories,
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

// Get single article by slug
const getArticleBySlug = async (req, res) => {
  try {
    const client = getSanityClient();
    const { slug } = req.params;

    const query = `*[_type == "article" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      content,
      readTime,
      publishedAt,
      image,
      "category": category->{
        name,
        "slug": slug.current
      }
    }`;

    const article = await client.fetch(query, { slug });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const formattedArticle = {
      id: article._id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: portableTextToHtml(article.content),
      readTime: article.readTime,
      publishedAt: article.publishedAt,
      image: buildImageUrl(article.image, 1200),
      category: article.category?.name || 'Uncategorized',
      categorySlug: article.category?.slug,
    };

    res.status(200).json({ data: formattedArticle });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

module.exports = {
  getFeaturedArticles,
  getAllArticles,
  getArticleBySlug,
};
