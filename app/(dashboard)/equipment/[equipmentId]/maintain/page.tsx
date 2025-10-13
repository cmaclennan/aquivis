'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function EquipmentMaintainPage({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = use(params)
  const supabase = createClient()
  const [equipment, setEquipment] = useState<any>(null)
  const [actions, setActions] = useState<any>({})
  const [notes, setNotes] = useState('')
  const [time, setTime] = useState('11:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await supabase
          .from('equipment')
          .select('id, name, property_id, unit_id, plant_room_id')
          .eq('id', equipmentId)
          .single()
        setEquipment(data)
      } catch (e: any) {
        setError(e.message)
      }
    })()
  }, [equipmentId])

  const save = async () => {
    try {
      setSaving(true)
      const { error } = await supabase.from('equipment_maintenance_logs').insert({
        equipment_id: equipmentId,
        maintenance_date: new Date().toISOString().slice(0,10),
        maintenance_time: time,
        actions,
        notes: notes || null,
      })
      if (error) throw error
      window.history.back()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/schedule" className="text-sm text-gray-600 hover:text-gray-900">← Back to Schedule</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Log Equipment Maintenance</h1>
        <p className="text-gray-600">{equipment?.name}</p>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 text-red-600 p-3 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Actions</h3>
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" onChange={(e) => setActions((a: any) => ({ ...a, inspected: e.target.checked }))} />
              Inspected
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" onChange={(e) => setActions((a: any) => ({ ...a, cleaned: e.target.checked }))} />
              Cleaned
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" onChange={(e) => setActions((a: any) => ({ ...a, replaced_parts: e.target.checked }))} />
              Replaced parts
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Link href="/schedule" className="px-4 py-2 border rounded">Cancel</Link>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50">{saving ? 'Saving…' : 'Save Log'}</button>
        </div>
      </div>
    </div>
  )
}






