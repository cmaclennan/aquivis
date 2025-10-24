'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { use } from 'react'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Rule = {
  id?: string
  rule_name: string
  selection_count: number
  frequency: 'daily' | 'twice_weekly' | 'weekly' | 'biweekly' | 'monthly'
  time_preference?: string
  target_unit_types: string[]
  target_water_types: string[]
  is_active: boolean
}

export default function PropertySchedulingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = use(params)
  const { data: session } = useSession()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [units, setUnits] = useState<any[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [draft, setDraft] = useState<Rule>({
    rule_name: '',
    selection_count: 2,
    frequency: 'daily',
    time_preference: '09:00',
    target_unit_types: [],
    target_water_types: [],
    is_active: true,
  })

  const load = useCallback(async () => {
    if (!session?.user?.company_id) return

    try {
      setLoading(true)

      const [{ data: property }, { data: u }, { data: r }] = await Promise.all([
        supabase.from('properties').select('name').eq('id', propertyId).single(),
        supabase.from('units').select('id, name, unit_type, water_type').eq('property_id', propertyId).eq('is_active', true),
        supabase
          .from('property_scheduling_rules')
          .select('id, rule_name, rule_config, is_active')
          .eq('property_id', propertyId)
          .eq('rule_type', 'random_selection')
          .eq('is_active', true)
      ])

      setPropertyName(property?.name || '')
      setUnits(u || [])
      const parsed = (r || []).map((row: any) => ({
        id: row.id,
        rule_name: row.rule_name,
        selection_count: Number(row.rule_config?.selection_count || 2),
        frequency: (row.rule_config?.frequency || 'daily'),
        time_preference: row.rule_config?.time_preference || '09:00',
        target_unit_types: row.rule_config?.target_unit_types || [],
        target_water_types: row.rule_config?.target_water_types || [],
        is_active: !!row.is_active,
      }))
      setRules(parsed)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, propertyId, session])

  useEffect(() => {
    if (!session?.user?.company_id) return
    load()
  }, [load, session])

  const saveRule = async () => {
    try {
      setLoading(true)
      const payload = {
        property_id: propertyId,
        rule_name: draft.rule_name || 'Random Selection',
        rule_type: 'random_selection',
        rule_config: {
          selection_count: draft.selection_count,
          frequency: draft.frequency,
          time_preference: draft.time_preference,
          target_unit_types: draft.target_unit_types,
          target_water_types: draft.target_water_types,
        },
        is_active: draft.is_active,
      }
      const { error } = await supabase.from('property_scheduling_rules').insert(payload)
      if (error) throw error
      setDraft({ rule_name: '', selection_count: 2, frequency: 'daily', time_preference: '09:00', target_unit_types: [], target_water_types: [], is_active: true })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const deactivateRule = async (id: string) => {
    try {
      await supabase.from('property_scheduling_rules').update({ is_active: false }).eq('id', id)
      await load()
    } catch {}
  }

  const candidateUnits = units.filter(u =>
    (draft.target_unit_types.length === 0 || draft.target_unit_types.includes(u.unit_type)) &&
    (draft.target_water_types.length === 0 || draft.target_water_types.includes(u.water_type))
  )

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/properties/${propertyId}`} className="text-sm text-gray-600 hover:text-gray-900">← Back to {propertyName}</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Scheduling Rules</h1>
        <p className="text-gray-600 mt-1">Create property-level random selection rules (e.g., pick N pools each day).</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="rounded-lg bg-white p-6 shadow mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Random Selection Rule</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rule Name</label>
            <input value={draft.rule_name} onChange={(e) => setDraft({ ...draft, rule_name: e.target.value })} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="Sheraton Daily Random 2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Frequency</label>
            <select value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value as any })} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
              <option value="daily">Daily</option>
              <option value="twice_weekly">Twice Weekly</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input type="time" value={draft.time_preference} onChange={(e) => setDraft({ ...draft, time_preference: e.target.value })} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Count</label>
            <input type="number" min={1} max={50} value={draft.selection_count} onChange={(e) => setDraft({ ...draft, selection_count: parseInt(e.target.value) || 1 })} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Unit Types</label>
            <select multiple value={draft.target_unit_types} onChange={(e) => setDraft({ ...draft, target_unit_types: Array.from(e.target.selectedOptions).map(o => o.value) })} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" size={5}>
              <option value="main_pool">Main Pool</option>
              <option value="kids_pool">Kids Pool</option>
              <option value="main_spa">Main Spa</option>
              <option value="residential_pool">Residential Pool</option>
              <option value="splash_park">Splash Park</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Water Types</label>
            <select multiple value={draft.target_water_types} onChange={(e) => setDraft({ ...draft, target_water_types: Array.from(e.target.selectedOptions).map(o => o.value) })} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" size={3}>
              <option value="saltwater">Saltwater</option>
              <option value="freshwater">Freshwater</option>
              <option value="bromine">Bromine</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Preview Candidates</h3>
          <div className="text-xs text-gray-600 mb-2">{candidateUnits.length} candidates match the filters</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-auto border rounded p-2">
            {candidateUnits.map(u => (
              <div key={u.id} className="text-sm text-gray-800">{u.name} <span className="text-gray-500">({u.unit_type})</span></div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <Link href={`/properties/${propertyId}`} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</Link>
          <button onClick={saveRule} className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600">Save Rule</button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Rules</h2>
        {rules.length === 0 ? (
          <div className="text-sm text-gray-600">No random selection rules yet.</div>
        ) : (
          <div className="space-y-3">
            {rules.map(r => (
              <div key={r.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.rule_name}</div>
                  <div className="text-xs text-gray-600">{r.frequency} • select {r.selection_count} • types: {r.target_unit_types.join(', ') || 'Any'}</div>
                </div>
                <button onClick={() => deactivateRule(r.id!)} className="text-sm text-red-600 hover:text-red-800">Deactivate</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}






