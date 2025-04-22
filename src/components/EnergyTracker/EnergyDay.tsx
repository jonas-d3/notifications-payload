import EnergySlot from './EnergySlot'

import { getPayload } from 'payload'
import config from '@payload-config'
function formatDateInTimeZone(date: Date, timeZone = 'Europe/Copenhagen') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}
export default async function EnergyDay() {
  const payload = await getPayload({ config })
  const slots = await payload.find({
    collection: 'energy_slots',
    limit: 24,
    sort: 'time',
    where: {
      date: {
        equals: formatDateInTimeZone(new Date()),
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
