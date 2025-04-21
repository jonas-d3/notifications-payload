'use server'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function updateEnergySlot(id: number, value: string) {
  const payload = await getPayload({ config })
  await payload.update({
    collection: 'energy_slots',
    id,
    data: {
      value,
    },
  })
  revalidatePath('/')
}
