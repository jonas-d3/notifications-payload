import type { CollectionConfig } from 'payload'
export const EnergySlot: CollectionConfig = {
  slug: 'energy_slots',
  fields: [
    {
      name: 'date',
      type: 'date',
    },
    {
      name: 'time',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'value',
      type: 'text',
      defaultValue: '',
    },
  ],
}
