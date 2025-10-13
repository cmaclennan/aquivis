'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function EditPlantRoomPage({ params }: { params: Promise<{ id: string; plantRoomId: string }> }) {
  const { id: propertyId, plantRoomId } = use(params)
  const supabase = createClient()
  const [name, setName] = useState('')
  const [checkFrequency, setCheckFrequency] = useState('daily')
  const [checkTimes, setCheckTimes] = useState<string[]>(['09:00'])
  const [checkDays, setCheckDays] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error: err } = await supabase
          .from('plant_rooms')
          .select('name, check_frequency, check_times, check_days, notes')
          .eq('id', plantRoomId)
          .single()
        if (err) throw err
        setName(data?.name || '')
        setCheckFrequency(data?.check_frequency || 'daily')
        setCheckTimes(data?.check_times || ['09:00'])
        setNotes(data?.notes || '')
        // Normalize check_days to day-name strings in UI state
        const days = data?.check_days || []
        if (Array.isArray(days) && days.length) {
          const intToDay: Record<number, string> = {
            0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday',
          }
          const normalized = typeof days[0] === 'number' ? days.map((n: number) => intToDay[n] ?? '') : days
          setCheckDays(normalized.filter(Boolean))
        } else {
          setCheckDays([])
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [plantRoomId])

  const updateTime = (i: number, v: string) => setCheckTimes((t) => t.map((val, idx) => (idx === i ? v : val)))
  const addTime = () => setCheckTimes((t) => [...t, '15:00'])
  const removeTime = (i: number) => setCheckTimes((t) => t.filter((_, idx) => idx !== i))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const dayNameToInt: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      }
      // Only persist check_days when using specific_days
      const checkDaysToSave = checkFrequency === 'specific_days'
        ? (checkDays.length ? checkDays.map(d => dayNameToInt[d] ?? null).filter((v) => v !== null) : null)
        : null
      const { error: err } = await supabase
        .from('plant_rooms')
        .update({ name, check_frequency: checkFrequency, check_times: checkTimes, check_days: checkDaysToSave, notes: notes || null })
        .eq('id', plantRoomId)
      if (err) throw err
      window.location.href = `/properties/${propertyId}/plant-rooms`
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8"><div className="text-gray-600">Loading…</div></div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/properties/${propertyId}/plant-rooms`} className="text-sm text-gray-600 hover:text-gray-900">← Back to Plant Rooms</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Plant Room</h1>
      </div>
      {error && <div className="mb-4 rounded bg-red-50 text-red-600 p-3 text-sm">{error}</div>}
      <form onSubmit={save} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check Frequency</label>
            <select value={checkFrequency} onChange={(e) => setCheckFrequency(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="daily">Daily</option>
              <option value="2x_daily">2x Daily</option>
              <option value="3x_daily">3x Daily</option>
              <option value="every_other_day">Every Other Day</option>
              <option value="weekly">Weekly</option>
              <option value="specific_days">Specific Days</option>
            </select>
          </div>
          {checkFrequency === 'specific_days' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Days</label>
              <div className="grid grid-cols-2 gap-2">
                {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(d => (
                  <label key={d} className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={checkDays.includes(d)} onChange={(e) => {
                      setCheckDays(prev => e.target.checked ? [...prev, d] : prev.filter(x => x !== d))
                    }} />
                    <span className="text-sm capitalize">{d}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check Times</label>
            <div className="space-y-2">
              {checkTimes.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="time" value={t} onChange={(e) => updateTime(i, e.target.value)} className="px-2 py-1 border rounded" />
                  {checkTimes.length > 1 && (
                    <button type="button" onClick={() => removeTime(i)} className="px-2 py-1 border rounded">Remove</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addTime} className="px-2 py-1 border rounded">Add Time</button>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Link href={`/properties/${propertyId}/plant-rooms`} className="px-4 py-2 border rounded">Cancel</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}






