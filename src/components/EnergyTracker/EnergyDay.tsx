'use client'
import EnergySlot from './EnergySlot'
import { EnergyDataPoint } from '@/types/Energy'

export default function EnergyDay() {
  const data: EnergyDataPoint[] = [
    {
      time: '00:00',
      value: 'hi',
    },
    {
      time: '01:00',
      value: 'low',
    },
    {
      time: '02:00',
      value: '',
    },
    {
      time: '03:00',
      value: 'med',
    },
    {
      time: '04:00',
      value: 'med',
    },
    {
      time: '05:00',
      value: '',
    },
    {
      time: '06:00',
      value: 'med',
    },
    {
      time: '07:00',
      value: 'zzz',
    },
    {
      time: '08:00',
      value: 'zzz',
    },
    {
      time: '09:00',
      value: '',
    },
    {
      time: '10:00',
      value: 'low',
    },
    {
      time: '11:00',
      value: 'zzz',
    },
    {
      time: '12:00',
      value: '',
    },
    {
      time: '13:00',
      value: 'low',
    },
    {
      time: '14:00',
      value: 'low',
    },
    {
      time: '15:00',
      value: 'zzz',
    },
    {
      time: '16:00',
      value: 'zzz',
    },
    {
      time: '17:00',
      value: 'zzz',
    },
    {
      time: '18:00',
      value: 'zzz',
    },
    {
      time: '19:00',
      value: '',
    },
    {
      time: '20:00',
      value: 'zzz',
    },
    {
      time: '21:00',
      value: '',
    },
    {
      time: '22:00',
      value: 'hi',
    },
    {
      time: '23:00',
      value: 'hi',
    },
  ]
  return (
    <div className="w-full flex flex-col">
      {data.map((d, i) => (
        <EnergySlot key={i} data={d} />
      ))}
    </div>
  )
}
