'use client'

import { use } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewPlantRoomEquipmentPage({ params }: { params: Promise<{ id: string; plantRoomId: string }> }) {
  const { id: propertyId, plantRoomId } = use(params)
  const supabase = createClient()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [maintenanceFrequency, setMaintenanceFrequency] = useState('weekly')
  const [maintenanceTimes, setMaintenanceTimes] = useState<string[]>(['09:00'])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTime = () => setMaintenanceTimes((t) => [...t, '15:00'])
  const removeTime = (i: number) => setMaintenanceTimes((t) => t.filter((_, idx) => idx !== i))
  const updateTime = (i: number, v: string) => setMaintenanceTimes((t) => t.map((val, idx) => (idx === i ? v : val)))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const { error } = await supabase.from('equipment').insert({
        property_id: propertyId,
        plant_room_id: plantRoomId,
        name,
        category: category || null,
        maintenance_frequency: maintenanceFrequency,
        maintenance_times: maintenanceTimes,
        notes: notes || null,
        is_active: true,
      })
      if (error) throw error
      window.location.href = `/properties/${propertyId}/plant-rooms/${plantRoomId}/equipment`
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/properties/${propertyId}/plant-rooms/${plantRoomId}/equipment`} className="text-sm text-gray-600 hover:text-gray-900">← Back to Equipment</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add Equipment</h1>
      </div>
      {error && <div className="mb-4 rounded bg-red-50 text-red-600 p-3 text-sm">{error}</div>}
      <form onSubmit={save} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Pump, Filter, Chlorinator…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Frequency</label>
            <select value={maintenanceFrequency} onChange={(e) => setMaintenanceFrequency(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Times</label>
          <div className="space-y-2">
            {maintenanceTimes.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="time" value={t} onChange={(e) => updateTime(i, e.target.value)} className="px-2 py-1 border rounded" />
                {maintenanceTimes.length > 1 && (
                  <button type="button" onClick={() => removeTime(i)} className="px-2 py-1 border rounded">Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addTime} className="px-2 py-1 border rounded">Add Time</button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Link href={`/properties/${propertyId}/plant-rooms/${plantRoomId}/equipment`} className="px-4 py-2 border rounded">Cancel</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}






