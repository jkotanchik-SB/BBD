import type { CollectionConfig } from 'payload'

export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'section', 'type', 'dateAdded', 'updatedAt'],
  },
  access: {
    read: () => true, // Allow public read access for the website
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'section',
      type: 'relationship',
      relationTo: 'sections',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'PDF Document', value: 'pdf' },
        { label: 'Video', value: 'video' },
        { label: 'External Link', value: 'link' },
      ],
      defaultValue: 'pdf',
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data?.type === 'pdf',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'video' || data?.type === 'link',
      },
    },
    {
      name: 'version',
      type: 'text',
      admin: {
        condition: (data) => data?.type === 'pdf',
      },
    },
    {
      name: 'dateUpdated',
      type: 'text',
      admin: {
        description: 'Display date (e.g., "March 2024")',
      },
    },
    {
      name: 'dateAdded',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
      },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first within a section',
      },
    },
  ],
}

