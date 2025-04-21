import { getPayload } from 'payload'
import config from '@/payload.config'
import '../../styles.css'
import EnergySlot from '@/components/EnergyTracker/EnergySlot'

export default async function HomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const data = await payload.find({
    collection: 'energy_slots',
    where: {
      id: {
        equals: id,
      },
    },
  })

  return (
    <div className="min-h-screen p-2 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] items-center sm:items-start">
        <EnergySlot data={data.docs[0]} />
      </main>
      <a
        className="admin"
        href={payloadConfig.routes.admin}
        rel="noopener noreferrer"
        target="_blank"
      >
        Go to admin panel
      </a>
    </div>
  )
}
