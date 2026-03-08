// Hero Slide schema for Sanity
// Add this to your Sanity Studio project

export default {
  name: 'heroSlide',
  title: 'Hero Slide',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title (Optional)',
      type: 'string',
      description: 'Optional title to display on the slide. Leave empty to use default.',
    },
    {
      name: 'subtitle',
      title: 'Subtitle (Optional)',
      type: 'string',
      description: 'Optional subtitle to display on the slide. Leave empty to use default.',
    },
    {
      name: 'image',
      title: 'Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'link',
      title: 'Link (Optional)',
      type: 'url',
      description: 'Optional URL to navigate to when clicking the slide.',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which slides appear (lower numbers first).',
      validation: Rule => Rule.required().integer().min(1),
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Toggle to show/hide this slide.',
      initialValue: true,
    },
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
      media: 'image',
      isActive: 'isActive',
    },
    prepare({ title, order, media, isActive }) {
      return {
        title: title || `Slide ${order}`,
        subtitle: `Order: ${order} ${isActive ? '(Active)' : '(Inactive)'}`,
        media,
      };
    },
  },
};
