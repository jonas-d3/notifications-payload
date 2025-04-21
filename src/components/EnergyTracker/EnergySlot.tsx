'use client'
import { useState } from 'react'
import styles from './EnergySlot.module.css'
import type { EnergySlot } from '@/payload-types'
import EnergyButton from './EnergyButton'

export default function EnergySlot({ data }: { data: EnergySlot }) {
  const [interactive, setInteractive] = useState(false)

  const classes = {
    '': 'text-white',
    zzz: 'bg-gray-300 text-black',
    low: 'bg-red-300 text-black',
    med: 'bg-yellow-300 text-black',
    hi: 'bg-green-300 text-black',
  }
  return (
    <div className="w-full grid grid-cols-5 items-center">
      <span className="text-white text-center">{data.time}</span>
      {!interactive && (
        <button
          className={classes[data.value] + ' col-span-4 ' + styles.btn}
          onClick={() => setInteractive(true)}
        >
          {data.value || 'zzz, low, med or hi?'}
        </button>
      )}
      {interactive && (
        <>
          <EnergyButton id={data.id} value="zzz" setInteractive={setInteractive} />
          <EnergyButton id={data.id} value="low" setInteractive={setInteractive} />
          <EnergyButton id={data.id} value="med" setInteractive={setInteractive} />
          <EnergyButton id={data.id} value="hi" setInteractive={setInteractive} />
        </>
      )}
    </div>
  )
}
