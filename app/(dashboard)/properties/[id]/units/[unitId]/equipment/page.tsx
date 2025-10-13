'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UnitEquipmentPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id: propertyId, unitId } = use(params)
  const supabase = createClient()
  const [equipment, setEquipment] = useState<any[]>([])
  const [unitName, setUnitName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [{ data: unit }, { data: eq }] = await Promise.all([
          supabase.from('units').select('name').eq('id', unitId).single(),
          supabase.from('equipment').select('id, name, category, maintenance_frequency, is_active').eq('unit_id', unitId).order('name')
        ])
        setUnitName(unit?.name || '')
        setEquipment(eq || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [unitId])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/properties/${propertyId}/units/${unitId}`} className="text-sm text-gray-600 hover:text-gray-900">← Back to Unit</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Equipment • {unitName}</h1>
        </div>
        <Link href={`/properties/${propertyId}/units/${unitId}/equipment/new`} className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600">Add Equipment</Link>
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
                <div className="text-sm font-medium text-gray-900">{eq.name}</div>
                <div className="text-xs text-gray-600">{eq.category || 'Uncategorized'} • {eq.maintenance_frequency}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/properties/${propertyId}/units/${unitId}/equipment/${eq.id}/edit`} className="rounded border px-3 py-1 text-sm">Edit</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}






