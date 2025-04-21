import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.css'

import EnergyDay from '@/components/EnergyTracker/EnergyDay'

import NotificationControls from '@/components/NotificationControls'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

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
