// Sanity schema for Article
// Copy this to your Sanity Studio project's schemas folder

export default {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: Rule => Rule.required(),
    },
    {
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short description shown on article cards',
      validation: Rule => Rule.required().max(200),
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
    },
    {
      name: 'readTime',
      title: 'Read Time (minutes)',
      type: 'number',
      description: 'Estimated reading time in minutes',
      validation: Rule => Rule.required().min(1),
    },
    {
      name: 'isFeatured',
      title: 'Featured on Landing Page',
      type: 'boolean',
      description: 'Show this article in the editorial section on the landing page',
      initialValue: false,
    },
    {
      name: 'featuredPosition',
      title: 'Featured Position',
      type: 'number',
      description: '1 = Large left article, 2 = Top right, 3 = Bottom right',
      options: {
        list: [
          { title: 'Main (Large Left)', value: 1 },
          { title: 'Side Top (Right)', value: 2 },
          { title: 'Side Bottom (Right)', value: 3 },
        ],
      },
      hidden: ({ document }) => !document?.isFeatured,
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: Rule => Rule.required(),
    },
  ],
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Featured Position',
      name: 'featuredPositionAsc',
      by: [{ field: 'featuredPosition', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category.name',
      media: 'image',
      isFeatured: 'isFeatured',
    },
    prepare({ title, category, media, isFeatured }) {
      return {
        title: isFeatured ? `⭐ ${title}` : title,
        subtitle: category,
        media,
      };
    },
  },
};
