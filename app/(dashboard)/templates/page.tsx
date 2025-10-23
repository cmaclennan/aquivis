'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import ScheduleBuilder from '@/components/scheduling/ScheduleBuilder'

type TemplateRow = {
  id: string
  template_name: string
  template_type: string
  template_config: any
  is_active: boolean
  created_at?: string
  applicable_unit_types?: string[] | null
  applicable_water_types?: string[] | null
  description?: string | null
}

export default function TemplatesPage() {
  const { data: session } = useSession()
  const [companyId, setCompanyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null)
  const [templateTags, setTemplateTags] = useState<string>('')
  const [versionNote, setVersionNote] = useState<string>('')
  const [unitTypeScope, setUnitTypeScope] = useState<string[]>([])
  const [waterTypeScope, setWaterTypeScope] = useState<string[]>([])
  const [renamingId, setRenamingId] = useState<string>('')
  const [renameValue, setRenameValue] = useState<string>('')

  const load = useCallback(async () => {
    if (!session?.user?.company_id) return

    try {
      setLoading(true)
      setCompanyId(session.user.company_id)
      const res = await fetch('/api/templates')
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load templates')
      setTemplates((json.templates || []) as any)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!session?.user?.company_id) return
    load()
  }, [load, session])

  const saveNewTemplate = async (schedule: any) => {
    try {
      setLoading(true)
      const finalType = schedule.schedule_type === 'occupancy' ? 'complex' : schedule.schedule_type
      const name = (schedule.name || '').trim() || 'New Template'
      const tags = templateTags.split(',').map(t => t.trim()).filter(Boolean)
      const withMeta = { ...(schedule.schedule_config || {}), meta: { tags, version_note: versionNote } }
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: name,
          template_type: finalType,
          template_config: withMeta,
          applicable_unit_types: unitTypeScope.length ? unitTypeScope : null,
          applicable_water_types: waterTypeScope.length ? waterTypeScope : null,
          description: versionNote || null,
          is_active: true,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to save template')
      setShowBuilder(false)
      setEditingTemplate(null)
      setTemplateTags(''); setVersionNote(''); setUnitTypeScope([]); setWaterTypeScope([])
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const saveEditedTemplate = async (schedule: any) => {
    if (!editingTemplate) return
    try {
      setLoading(true)
      const finalType = schedule.schedule_type === 'occupancy' ? 'complex' : schedule.schedule_type
      const name = (schedule.name || '').trim() || editingTemplate.template_name || 'Template'
      const tags = templateTags.split(',').map(t => t.trim()).filter(Boolean)
      const withMeta = { ...(schedule.schedule_config || {}), meta: { tags, version_note: versionNote } }
      const res = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: name,
          template_type: finalType,
          template_config: withMeta,
          applicable_unit_types: unitTypeScope.length ? unitTypeScope : null,
          applicable_water_types: waterTypeScope.length ? waterTypeScope : null,
          description: versionNote || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to update template')
      setShowBuilder(false)
      setEditingTemplate(null)
      setTemplateTags(''); setVersionNote(''); setUnitTypeScope([]); setWaterTypeScope([])
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const duplicateTemplate = async (t: TemplateRow) => {
    try {
      setLoading(true)
      const name = `Copy of ${t.template_name}`
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: name,
          template_type: t.template_type,
          template_config: t.template_config,
          applicable_unit_types: t.applicable_unit_types || null,
          applicable_water_types: t.applicable_water_types || null,
          description: t.description || null,
          is_active: t.is_active,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to duplicate template')
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const deactivate = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: false }) })
    await load()
  }
  const activate = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: true }) })
    await load()
  }
  const remove = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    await load()
  }
  const startRename = (t: TemplateRow) => {
    setRenamingId(t.id)
    setRenameValue(t.template_name)
  }
  const submitRename = async () => {
    if (!renamingId) return
    await fetch(`/api/templates/${renamingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template_name: renameValue.trim() || 'Template' }) })
    setRenamingId('')
    setRenameValue('')
    await load()
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage reusable schedule templates.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/schedule" className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Back to Schedule</Link>
          <button onClick={() => setShowBuilder(true)} className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600">New Template</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-gray-600">Loading templates…</div>
        ) : templates.length === 0 ? (
          <div className="text-gray-600 text-sm">No templates yet.</div>
        ) : (
          <div className="divide-y">
            {templates.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  {renamingId === t.id ? (
                    <div className="flex items-center gap-2">
                      <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="px-2 py-1 border rounded" />
                      <button onClick={submitRename} className="px-3 py-1 rounded bg-primary text-white hover:bg-primary-600 text-sm">Save</button>
                      <button onClick={() => { setRenamingId(''); setRenameValue('') }} className="px-3 py-1 rounded border text-sm">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-gray-900">{t.template_name}</div>
                      <div className="text-xs text-gray-500">{t.template_type}</div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => duplicateTemplate(t)} className="px-3 py-1 rounded border text-sm">Duplicate</button>
                  <button
                    onClick={() => {
                      setEditingTemplate(t)
                      // Prefill meta and scopes from existing template
                      const meta = (t.template_config?.meta) || {}
                      const tags: string[] = Array.isArray(meta.tags) ? meta.tags : []
                      setTemplateTags(tags.join(', '))
                      setVersionNote((meta.version_note as string) || t.description || '')
                      setUnitTypeScope(t.applicable_unit_types || [])
                      setWaterTypeScope(t.applicable_water_types || [])
                      setShowBuilder(true)
                    }}
                    className="px-3 py-1 rounded border text-sm"
                  >
                    Edit in builder
                  </button>
                  {renamingId !== t.id && (
                    <button onClick={() => startRename(t)} className="px-3 py-1 rounded border text-sm">Rename</button>
                  )}
                  {t.is_active ? (
                    <button onClick={() => deactivate(t.id)} className="px-3 py-1 rounded border text-sm">Deactivate</button>
                  ) : (
                    <button onClick={() => activate(t.id)} className="px-3 py-1 rounded border text-sm">Activate</button>
                  )}
                  <button onClick={() => remove(t.id)} className="px-3 py-1 rounded border border-red-300 text-red-600 text-sm hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-medium">{editingTemplate ? 'Edit Template' : 'Create Template'}</div>
              <button onClick={() => { setShowBuilder(false); setEditingTemplate(null) }} className="px-3 py-1 rounded border text-sm">Close</button>
            </div>
            <div className="p-4">
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Types (scope)</label>
                  <select multiple value={unitTypeScope} onChange={(e) => setUnitTypeScope(Array.from(e.target.selectedOptions, o => o.value))} className="w-full border rounded px-2 py-2" size={6}>
                    <option value="main_pool">Main Pool</option>
                    <option value="kids_pool">Kids Pool</option>
                    <option value="main_spa">Main Spa</option>
                    <option value="rooftop_spa">Rooftop Spa</option>
                    <option value="plunge_pool">Plunge Pool</option>
                    <option value="villa_pool">Villa Pool</option>
                    <option value="residential_pool">Residential Pool</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Water Types (scope)</label>
                  <select multiple value={waterTypeScope} onChange={(e) => setWaterTypeScope(Array.from(e.target.selectedOptions, o => o.value))} className="w-full border rounded px-2 py-2" size={3}>
                    <option value="saltwater">Saltwater</option>
                    <option value="freshwater">Freshwater</option>
                    <option value="bromine">Bromine</option>
                  </select>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input value={templateTags} onChange={(e) => setTemplateTags(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., daily, resort" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version note</label>
                  <input value={versionNote} onChange={(e) => setVersionNote(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Short note about changes" />
                </div>
              </div>
              <ScheduleBuilder
                context="unit"
                unitType="villa_pool"
                hasBookings={false}
                onSave={editingTemplate ? saveEditedTemplate : saveNewTemplate}
                onCancel={() => { setShowBuilder(false); setEditingTemplate(null) }}
                initialSchedule={editingTemplate ? {
                  schedule_type: (editingTemplate.template_type as any),
                  schedule_config: editingTemplate.template_config,
                  name: editingTemplate.template_name,
                  description: ''
                } : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}






