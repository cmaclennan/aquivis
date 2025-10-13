'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function JobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('jobs')
        .select('id, title, job_type, status, scheduled_at, property_id, unit_id, plant_room_id')
        .order('scheduled_at', { ascending: true })
        .limit(200)
      setJobs(data || [])
      setLoading(false)
    })()
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Link href="/jobs/new" className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-600">New Job</Link>
      </div>

      <div className="bg-white rounded shadow">
        {loading ? (
          <div className="p-4 text-gray-600">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="p-4 text-gray-600 text-sm">No jobs yet.</div>
        ) : (
          <div className="divide-y">
            {jobs.map(j => (
              <Link href={`/jobs/${j.id}`} key={j.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-900">{j.title}</div>
                  <div className="text-xs text-gray-600">{j.job_type} • {j.status}{j.scheduled_at ? ` • ${new Date(j.scheduled_at).toLocaleString()}` : ''}</div>
                </div>
                <div className="text-xs text-gray-500">View</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




