import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { LibsqlError } from '@libsql/client'

function formatDateInTimeZone(date: Date, timeZone = 'Europe/Copenhagen') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query: string = searchParams.get('date') || ''
  let date = new Date()
  if (query) {
    date = new Date(query)
  }
  const formatted = formatDateInTimeZone(date)

  const slots = [...Array(24)].map((_, index) => ({
    time: String(index).padStart(2, '0') + ':00',
    value: '',
    date: formatted,
  }))
  console.log(slots[0].date)

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
      //@ts-expect-error TODO:
      if (error?.rawCode === 2067) {
        console.log('duplicate entry detected, skipping')
      } else {
        console.error(`Failed to create slot for time ${slotData.time}:`, error)
      }
      //console.error(`Failed to create slot for time ${slotData.time}:`, error)
      //Uniqueue index probably hit
      // Decide how to handle errors: continue, stop, collect errors?
    }
  }
  console.log(`Sequentially created ${createdDocsSequential.length} slots.`)
  return NextResponse.json({
    message: `Created energy slots`,
    createdCount: createdDocsSequential.length,
  })
}
