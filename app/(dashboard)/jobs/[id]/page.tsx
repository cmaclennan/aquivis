'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/jobs/${id}`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.error) {
          setError(json?.error || 'Job not found')
          setJob(null)
        } else {
          setJob(json.job)
          setError(null)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  return (
    <div className="p-8">
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : error || !job ? (
        <div className="rounded bg-red-50 text-red-600 p-3 text-sm">{error || 'Job not found'}</div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <button onClick={() => router.push('/jobs')} className="px-3 py-2 rounded border">Back</button>
          </div>
          <div className="bg-white rounded shadow p-4">
            <div className="text-sm text-gray-700">Type: {job.job_type}</div>
            <div className="text-sm text-gray-700">Status: {job.status}</div>
            {job.scheduled_at && (
              <div className="text-sm text-gray-700">Scheduled: {new Date(job.scheduled_at).toLocaleString()}</div>
            )}
            {job.description && (
              <div className="text-sm text-gray-700">Description: {job.description}</div>
            )}
            {job.notes && (
              <div className="text-sm text-gray-700">Notes: {job.notes}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}




