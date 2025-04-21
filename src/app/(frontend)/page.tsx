import config from '@/payload.config'
import './styles.css'

import EnergyDay from '@/components/EnergyTracker/EnergyDay'

import NotificationControls from '@/components/NotificationControls'

export default async function HomePage() {
  const payloadConfig = await config

  return (
    <div className="min-h-screen p-2 pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] items-center sm:items-start">
        <NotificationControls />
        <EnergyDay />
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
