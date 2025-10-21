'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewJobPage() {
  const { data: session } = useSession()
  const supabase = createClient()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [jobType, setJobType] = useState<'repair' | 'installation' | 'inspection' | 'other'>('repair')
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('draft')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [externalContact, setExternalContact] = useState({ name: '', email: '', phone: '', address: '' })
  const [customers, setCustomers] = useState<any[]>([])
  const [customerChoice, setCustomerChoice] = useState<string>('') // existing id | 'new' | 'other' | ''
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load company customers
  useEffect(() => {
    if (!session?.user?.company_id) return

    ;(async () => {
      const { data } = await supabase.from('customers').select('id, name').eq('company_id', session.user.company_id).order('name')
      setCustomers(data || [])
    })()
  }, [supabase, session])

  const save = async () => {
    if (!session?.user?.company_id) return

    try {
      setSaving(true)
      setError(null)

      // Determine customer linkage / external contact
      let customerId: string | null = null
      let external = null as any
      if (customerChoice === 'new') {
        // Create new customer
        if (!newCustomer.name.trim()) throw new Error('Customer name is required')
        const { data: c, error: cErr } = await supabase
          .from('customers')
          .insert({
            company_id: session.user.company_id,
            name: newCustomer.name.trim(),
            email: newCustomer.email || null,
            phone: newCustomer.phone || null,
            address: newCustomer.address || null,
            customer_type: 'property_owner' // Add required field
          })
          .select('id')
          .single()
        if (cErr) throw cErr
        customerId = c.id
      } else if (customerChoice === 'other') {
        external = externalContact.name || externalContact.email || externalContact.phone || externalContact.address ? externalContact : null
      } else if (customerChoice) {
        customerId = customerChoice
      }

      const { data, error } = await supabase.from('jobs').insert({
        company_id: session.user.company_id,
        title: title.trim(),
        job_type: jobType,
        status,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        notes: notes || null,
        customer_id: customerId,
        external_contact: external,
      }).select().single()
      if (error) throw error
      router.push(`/jobs/${data.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const isValid = title.trim().length > 0

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Job</h1>

      {error && <div className="mb-4 rounded bg-red-50 text-red-600 p-3 text-sm">{error}</div>}

      <div className="bg-white rounded shadow p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer</label>
          <select value={customerChoice} onChange={(e) => setCustomerChoice(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">
            <option value="">Unassigned</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="new">New customer…</option>
            <option value="other">Other (one-off)…</option>
          </select>
        </div>

        {customerChoice === 'new' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input value={newCustomer.email} onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input value={newCustomer.address} onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))} className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          </div>
        )}

        {customerChoice === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">External Contact</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Name" value={externalContact.name} onChange={(e) => setExternalContact(prev => ({ ...prev, name: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input placeholder="Email" value={externalContact.email} onChange={(e) => setExternalContact(prev => ({ ...prev, email: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input placeholder="Phone" value={externalContact.phone} onChange={(e) => setExternalContact(prev => ({ ...prev, phone: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input placeholder="Address" value={externalContact.address} onChange={(e) => setExternalContact(prev => ({ ...prev, address: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select value={jobType} onChange={(e) => setJobType(e.target.value as any)} className="mt-1 w-full border rounded px-3 py-2">
              <option value="repair">Repair</option>
              <option value="installation">Installation</option>
              <option value="inspection">Inspection</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="mt-1 w-full border rounded px-3 py-2">
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Scheduled At</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full border rounded px-3 py-2" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={() => router.push('/jobs')} className="px-3 py-2 rounded border">Cancel</button>
          <button onClick={save} disabled={!isValid || saving} className="px-3 py-2 rounded bg-primary text-white hover:bg-primary-600 disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  )
}


