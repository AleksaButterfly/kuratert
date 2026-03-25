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
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Toggle to show/hide this slide.',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      isActive: 'isActive',
    },
    prepare({ title, media, isActive }) {
      return {
        title: title || 'Slide',
        subtitle: isActive ? '(Active)' : '(Inactive)',
        media,
      };
    },
  },
};
