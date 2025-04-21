'use client'
import styles from './EnergySlot.module.css'
import { updateEnergySlot } from '@/app/(frontend)/actions/energySlots'
export default function EnergyButton({
  setInteractive,
  value,
  id,
}: {
  setInteractive: (val: boolean) => void
  value: string
  id: number
}) {
  return (
    <button
      className={styles.btn}
      onClick={() => {
        updateEnergySlot(id, value)
        setInteractive(false)
      }}
    >
      {value}
    </button>
  )
}
