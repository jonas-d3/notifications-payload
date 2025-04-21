import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = new Date(searchParams.get('date') || '') || new Date()
  const slots = [...Array(24)].map((_, index) => ({
    time: String(index).padStart(2, '0') + ':00',
    value: '',
    date: query.toISOString(),
  }))

  const payload = await getPayload({ config })

  const createdDocsSequential = []
  for (const slotData of slots) {
    try {
      const doc = await payload.create({
        collection: 'energy_slots',
        data: slotData,
      })
      createdDocsSequential.push(doc)
      console.log(`Created slot: ${doc.id}`)
    } catch (error) {
      console.error(`Failed to create slot for time ${slotData.time}:`, error)
      // Decide how to handle errors: continue, stop, collect errors?
    }
  }
  console.log(`Sequentially created ${createdDocsSequential.length} slots.`)
  return NextResponse.json({
    message: `Created energy slots`,
    createdCount: createdDocsSequential.length,
  })
}
