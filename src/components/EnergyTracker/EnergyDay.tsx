import EnergySlot from './EnergySlot'

import { getPayload } from 'payload'
import config from '@payload-config'

export default async function EnergyDay() {
  const payload = await getPayload({ config })
  const slots = await payload.find({
    collection: 'energy_slots',
    limit: 24,
    sort: 'time',
    where: {
      date: {
        like: '2025-04-21%',
      },
    },
  })
  return (
    <div className="w-full flex flex-col">
      {slots.docs.map((d, i) => (
        <EnergySlot key={i} data={d} />
      ))}
    </div>
  )
}
