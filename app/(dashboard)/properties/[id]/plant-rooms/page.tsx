'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'

export default function PlantRoomsListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = use(params)
  const [plantRooms, setPlantRooms] = useState<any[]>([])
  const [propertyName, setPropertyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/properties/${propertyId}`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load plant rooms')
        setPropertyName(json?.property?.name || '')
        setPlantRooms(json?.property?.plant_rooms || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [propertyId])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/properties/${propertyId}`} className="text-sm text-gray-600 hover:text-gray-900">← Back to {propertyName}</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Plant Rooms</h1>
        </div>
        <Link href={`/properties/${propertyId}/plant-rooms/new`} className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600">New Plant Room</Link>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 text-red-600 p-3 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow divide-y">
        {loading ? (
          <div className="p-4 text-gray-600">Loading…</div>
        ) : plantRooms.length === 0 ? (
          <div className="p-4 text-gray-600 text-sm">No plant rooms yet.</div>
        ) : (
          plantRooms.map(pr => (
            <div key={pr.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">{pr.name}</div>
                <div className="text-xs text-gray-600">{pr.check_frequency || 'n/a'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/properties/${propertyId}/plant-rooms/${pr.id}/equipment`} className="rounded border px-3 py-1 text-sm">Equipment</Link>
                <Link href={`/properties/${propertyId}/plant-rooms/${pr.id}/check`} className="rounded border px-3 py-1 text-sm">Start Check</Link>
                <Link href={`/properties/${propertyId}/plant-rooms/${pr.id}/edit`} className="rounded border px-3 py-1 text-sm">Edit</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


