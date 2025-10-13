'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Save, Trash2, Settings } from 'lucide-react'
import EquipmentEditor, { EquipmentEditorRow } from '@/components/equipment/EquipmentEditor'

interface EquipmentRow {
  id: string
  name?: string
  category?: string
  maintenance_frequency?: string
  is_active?: boolean
  notes?: string
  measurement_config?: any
}

export default function PlantRoomEquipmentPage({ params }: { params: Promise<{ id: string; plantRoomId: string }> }) {
  const { id: propertyId, plantRoomId } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [plantRoomName, setPlantRoomName] = useState('')
  const [equipment, setEquipment] = useState<EquipmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showBatch, setShowBatch] = useState(false)
  const [editing, setEditing] = useState<EquipmentRow | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [{ data: pr }, { data: eq }] = await Promise.all([
          supabase.from('plant_rooms').select('name').eq('id', plantRoomId).single(),
          supabase
            .from('equipment')
            .select('id, name, category, maintenance_frequency, is_active, notes, measurement_config')
            .eq('plant_room_id', plantRoomId)
            .order('name')
        ])
        setPlantRoomName(pr?.name || '')
        setEquipment((eq || []) as EquipmentRow[])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [plantRoomId])

  const handleSave = async (data: Omit<EquipmentRow, 'id'> & { id?: string }) => {
    try {
      setSaving(true)
      setError(null)
      if (data.id) {
        // Derive measurement_type from measurement_config for consistency
        const ft = (data as any).measurement_config?.field_type
        const mt = ft === 'rpm' ? 'rpm'
          : ft === 'hz' ? 'hz'
          : (ft === 'pressure_dual' || ft === 'pressure_single') ? 'pressure'
          : ft === 'percent' ? 'percent'
          : (data.category === 'balance_tank' ? 'litres' : 'none')

        const { error } = await supabase
          .from('equipment')
          .update({
            name: data.name,
            category: data.category,
            maintenance_frequency: data.maintenance_frequency,
            is_active: data.is_active,
            notes: data.notes,
            measurement_config: (data as any).measurement_config || null,
            measurement_type: mt,
          })
          .eq('id', data.id)
        if (error) throw error
        setEquipment(prev => prev.map(e => e.id === data.id ? { ...(e as any), ...data } as EquipmentRow : e))
      } else {
        const ft = (data as any).measurement_config?.field_type
        const mt = ft === 'rpm' ? 'rpm'
          : ft === 'hz' ? 'hz'
          : (ft === 'pressure_dual' || ft === 'pressure_single') ? 'pressure'
          : ft === 'percent' ? 'percent'
          : (data.category === 'balance_tank' ? 'litres' : 'none')

        const { data: inserted, error } = await supabase
          .from('equipment')
          .insert({
            plant_room_id: plantRoomId,
            name: data.name,
            category: data.category,
            maintenance_frequency: data.maintenance_frequency,
            is_active: data.is_active ?? true,
            notes: data.notes,
            measurement_config: (data as any).measurement_config || null,
            measurement_type: mt,
          })
          .select()
          .single()
        if (error) throw error
        setEquipment(prev => [...prev, inserted as any])
      }
      setShowForm(false)
      setEditing(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this equipment?')) return
    try {
      setSaving(true)
      const { error } = await supabase.from('equipment').delete().eq('id', id)
      if (error) throw error
      setEquipment(prev => prev.filter(e => e.id !== id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => router.push(`/properties/${propertyId}/plant-rooms`)} className="text-sm text-gray-600 hover:text-gray-900">← Back to Plant Rooms</button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Equipment • {plantRoomName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowBatch(true) }} className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600">Add Equipment</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 text-red-600 p-3 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow divide-y">
        {loading ? (
          <div className="p-4 text-gray-600">Loading…</div>
        ) : equipment.length === 0 ? (
          <div className="p-4 text-gray-600 text-sm">No equipment yet.</div>
        ) : (
          equipment.map(eq => (
            <div key={eq.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">{eq.name || 'Equipment'}</div>
                <div className="text-xs text-gray-600">{eq.category || 'Uncategorized'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditing(eq); setShowForm(true) }} className="rounded border px-3 py-1 text-sm">Edit</button>
                <button onClick={() => handleDelete(eq.id)} className="rounded border px-3 py-1 text-sm border-red-300 text-red-600">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <EquipmentForm
          initial={editing || undefined}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {showBatch && (
        <EquipmentEditor
          onCancel={() => setShowBatch(false)}
          onSave={async (rows: EquipmentEditorRow[]) => {
            try {
              setSaving(true)
              setError(null)
              const payload = rows.map((r) => {
                const ft = r.measurement_config?.field_type
                const mt = ft === 'rpm' ? 'rpm'
                  : ft === 'hz' ? 'hz'
                  : (ft === 'pressure_dual' || ft === 'pressure_single') ? 'pressure'
                  : ft === 'percent' ? 'percent'
                  : (r.category === 'balance_tank' ? 'litres' : 'none')
                return {
                  property_id: propertyId,
                  plant_room_id: plantRoomId,
                  name: r.name,
                  category: r.category,
                  equipment_type: r.category || 'other',
                  measurement_type: mt,
                  measurement_config: r.measurement_config || null,
                  notes: r.notes || null,
                  is_active: r.is_active,
                }
              })
              const { data, error } = await supabase.from('equipment').insert(payload).select()
              if (error) throw error
              setEquipment(prev => [...prev, ...((data || []) as any)])
              setShowBatch(false)
            } catch (e: any) {
              setError(e.message)
            } finally {
              setSaving(false)
            }
          }}
        />
      )}
    </div>
  )
}

function EquipmentForm({ initial, onCancel, onSave, saving }: { initial?: EquipmentRow; onCancel: () => void; onSave: (data: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    id: initial?.id,
    name: initial?.name || '',
    category: initial?.category || '',
    is_active: initial?.is_active ?? true,
    notes: initial?.notes || '',
    measurement_config: initial?.measurement_config || undefined,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-medium">{form.id ? 'Edit Equipment' : 'Add Equipment'}</div>
          <button onClick={onCancel} className="px-3 py-1 rounded border text-sm">Close</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Display Name</label>
              <input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} className="w-full border rounded px-3 py-2">
                <option value="">Select category</option>
                <option value="pump">Pump</option>
                <option value="filter">Filter</option>
                <option value="chlorinator">Chlorinator</option>
                <option value="heater">Heater</option>
                <option value="balance_tank">Balance Tank</option>
                <option value="other">Other</option>
              </select>
            </div>
            {/* Measurement Config (varies by category) */}
            <div className="md:col-span-2">
              {form.category === 'pump' && (
                <div>
                  <label className="block text-sm mb-1">Pump Measurement</label>
                  <select
                    value={(form as any).measurement_config?.field_type || 'rpm'}
                    onChange={(e) => setForm(prev => ({ ...prev, measurement_config: { field_type: e.target.value } }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="rpm">RPM</option>
                    <option value="hz">Hz</option>
                  </select>
                </div>
              )}
              {form.category === 'filter' && (
                <div>
                  <label className="block text-sm mb-1">Filter Measurement</label>
                  <select
                    value={(form as any).measurement_config?.field_type || 'pressure_dual'}
                    onChange={(e) => setForm(prev => ({ ...prev, measurement_config: { field_type: e.target.value } }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="pressure_dual">Inlet/Outlet (dual)</option>
                    <option value="pressure_single">Overall (single)</option>
                  </select>
                </div>
              )}
              {form.category === 'chlorinator' && (
                <div>
                  <label className="block text-sm mb-1">Chlorinator Measurement</label>
                  <select
                    value={(form as any).measurement_config?.label || 'Setpoint'}
                    onChange={(e) => setForm(prev => ({ ...prev, measurement_config: { field_type: 'percent', label: e.target.value } }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="Setpoint">Setpoint %</option>
                    <option value="Output">Output %</option>
                  </select>
                </div>
              )}
              {form.category === 'heater' && (
                <div>
                  <label className="block text-sm mb-1">Heater Measurement</label>
                  <input disabled value="Temperature (°C)" className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-700" />
                </div>
              )}
              {form.category === 'balance_tank' && (
                <div>
                  <label className="block text-sm mb-1">Balance Tank Measurement</label>
                  <input disabled value="Level (L)" className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-700" />
                </div>
              )}
              {form.category === 'other' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm mb-1">Field Type</label>
                    <select
                      value={(form as any).measurement_config?.field_type || 'number'}
                      onChange={(e) => setForm(prev => ({ ...prev, measurement_config: { ...(prev as any).measurement_config, field_type: e.target.value } }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="number">Number</option>
                      <option value="text">Text</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Label (optional)</label>
                    <input value={(form as any).measurement_config?.label || ''} onChange={(e) => setForm(prev => ({ ...prev, measurement_config: { ...(prev as any).measurement_config, label: e.target.value } }))} className="w-full border rounded px-3 py-2" placeholder="Display label" />
                  </div>
                </div>
              )}
            </div>
            {/* Maintenance frequency removed — governed by plant room schedule */}
            <div className="flex items-center gap-2">
              <input id="active" type="checkbox" checked={!!form.is_active} onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))} />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
          </div>

          {/* Minimal fields aligned with current schema */}

          <div>
            <label className="block text-sm mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full border rounded px-3 py-2" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-primary text-white hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


