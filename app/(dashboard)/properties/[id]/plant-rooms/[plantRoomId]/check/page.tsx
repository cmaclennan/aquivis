'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type EquipmentCategory = 'pump' | 'filter' | 'chlorinator' | 'heater' | 'other'

export default function PlantRoomCheckPage({ params }: { params: Promise<{ id: string; plantRoomId: string }> }) {
  const { id: propertyId, plantRoomId } = use(params)
  const [plantRoom, setPlantRoom] = useState<any>(null)
  const [propertyName, setPropertyName] = useState('')
  const [time, setTime] = useState<string>('09:00')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  type EquipmentCheckState = {
    // Pump fields
    rpm?: number
    hz?: number
    // Filter fields  
    inlet_pressure?: number
    outlet_pressure?: number
    overall_pressure?: number
    // Chlorinator fields
    setpoint?: number
    output?: number
    // Heater fields
    temperature?: number
    // General
    notes?: string
    status: 'normal' | 'warning' | 'fault'
  }

  const [equipmentChecks, setEquipmentChecks] = useState<Record<string, EquipmentCheckState>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/plant-rooms/${plantRoomId}`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load plant room')
        const room = json.plant_room
        setPlantRoom(room)
        setPropertyName(room?.properties?.name || '')
        const defaultTime = (room?.check_times && room.check_times[0]) || '09:00'
        setTime(defaultTime)
        const initialChecks: Record<string, EquipmentCheckState> = {}
        ;(room?.equipment || []).forEach((eq: any) => {
          initialChecks[eq.id] = { status: 'normal' }
        })
        setEquipmentChecks(initialChecks)
      } catch (e: any) {
        setError(e.message)
      }
    })()
  }, [plantRoomId, propertyId])

  const setField = (eqId: string, patch: Partial<EquipmentCheckState>) => {
    setEquipmentChecks(prev => ({ ...prev, [eqId]: { ...(prev[eqId] || { status: 'normal' }), ...patch } }))
  }

  // Determine which fields to show based on equipment category
  const getFieldsForCategory = (category: string) => {
    const cat = (category || '').toLowerCase()
    if (cat.includes('pump')) return 'pump'
    if (cat.includes('filter')) return 'filter'
    if (cat.includes('chlorinator') || cat.includes('chlorine')) return 'chlorinator'
    if (cat.includes('heater')) return 'heater'
    if (cat.includes('balance') || cat.includes('tank')) return 'balance_tank'
    return 'other'
  }

  const save = async () => {
    try {
      setSaving(true)
      const equipmentPayload = (plantRoom?.equipment || []).map((eq: any) => {
        const st = equipmentChecks[eq.id] || { status: 'normal' }
        const readings: any = {}
        if (st.rpm != null) readings.rpm = st.rpm
        if (st.hz != null) readings.hz = st.hz
        if (st.inlet_pressure != null) readings.inlet_pressure = st.inlet_pressure
        if (st.outlet_pressure != null) readings.outlet_pressure = st.outlet_pressure
        if (st.overall_pressure != null) readings.overall_pressure = st.overall_pressure
        if (st.setpoint != null) readings.setpoint = st.setpoint
        if (st.output != null) readings.output = st.output
        if (st.temperature != null) readings.temperature = st.temperature
        if (st.notes) readings.notes = st.notes
        return { equipment_id: eq.id, status: st.status, readings, notes: st.notes || null }
      })
      const res = await fetch(`/api/plant-rooms/${plantRoomId}/checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_time: time,
          notes: notes || null,
          equipment: equipmentPayload,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to save plant room check')
      window.location.href = `/properties/${propertyId}/plant-rooms`
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/properties/${propertyId}/plant-rooms`} className="text-sm text-gray-600 hover:text-gray-900">← Back to Plant Rooms</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Plant Room Check</h1>
        <p className="text-gray-600">{plantRoom?.name} • {propertyName}</p>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 text-red-600 p-3 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {(plantRoom?.equipment || []).map((eq: any) => {
            const st = equipmentChecks[eq.id] || { status: 'normal' }
            const fieldType = getFieldsForCategory(eq.category)
            const mc = eq.measurement_config || {}
            const color = st.status === 'fault' ? 'border-red-200 bg-red-50' : st.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'
            return (
              <div key={eq.id} className={`border ${color} rounded p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{eq.name || 'Equipment'}</div>
                    <div className="text-xs text-gray-600">{eq.category || 'Uncategorized'}</div>
                  </div>
                  <select value={st.status} onChange={(e) => setField(eq.id, { status: e.target.value as any })} className="px-3 py-1 border rounded text-sm min-w-[100px]">
                    <option value="normal">Normal</option>
                    <option value="warning">Warning</option>
                    <option value="fault">Fault</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fieldType === 'pump' && (
                    mc.field_type === 'hz' ? (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Hz</label>
                        <input type="number" value={st.hz ?? ''} step="0.1" onChange={(e) => setField(eq.id, { hz: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="e.g., 50" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">RPM</label>
                        <input type="number" value={st.rpm ?? ''} onChange={(e) => setField(eq.id, { rpm: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="e.g., 2850" />
                      </div>
                    )
                  )}
                  {fieldType === 'filter' && (
                    mc.field_type === 'pressure_single' ? (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Overall Pressure (psi)</label>
                        <input type="number" value={st.overall_pressure ?? ''} onChange={(e) => setField(eq.id, { overall_pressure: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="For single gauge" />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Inlet Pressure (psi)</label>
                          <input type="number" value={st.inlet_pressure ?? ''} onChange={(e) => setField(eq.id, { inlet_pressure: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="e.g., 15" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Outlet Pressure (psi)</label>
                          <input type="number" value={st.outlet_pressure ?? ''} onChange={(e) => setField(eq.id, { outlet_pressure: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="e.g., 12" />
                        </div>
                      </>
                    )
                  )}
                  {fieldType === 'chlorinator' && (
                    mc.label === 'Output' ? (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Output (%)</label>
                        <input type="number" value={st.output ?? ''} step="0.1" onChange={(e) => setField(eq.id, { output: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="Actual output" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Setpoint (%)</label>
                        <input type="number" value={st.setpoint ?? ''} step="0.1" onChange={(e) => setField(eq.id, { setpoint: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="e.g., 50" />
                      </div>
                    )
                  )}
                  {fieldType === 'heater' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Temperature (°C)</label>
                      <input type="number" value={st.temperature ?? ''} step="0.1" onChange={(e) => setField(eq.id, { temperature: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="e.g., 28" />
                    </div>
                  )}
                  {fieldType === 'balance_tank' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Level (L)</label>
                      <input type="number" value={st.output ?? ''} onChange={(e) => setField(eq.id, { output: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="Tank level" />
                    </div>
                  )}
                  {fieldType === 'other' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Reading</label>
                      <input type="number" value={st.output ?? ''} step="0.1" onChange={(e) => setField(eq.id, { output: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded px-3 py-2" placeholder="Enter value" />
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <input value={st.notes ?? ''} onChange={(e) => setField(eq.id, { notes: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Optional notes for this equipment" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Link href={`/properties/${propertyId}/plant-rooms`} className="px-4 py-2 border rounded">Cancel</Link>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50">{saving ? 'Saving…' : 'Save Check'}</button>
        </div>
      </div>
    </div>
  )
}

