'use client'

import { useState } from 'react'

export type EquipmentEditorRow = {
  name: string
  category: 'pump' | 'filter' | 'chlorinator' | 'heater' | 'balance_tank' | 'other' | ''
  notes?: string
  is_active: boolean
  measurement_config?: any
}

export default function EquipmentEditor({
  onCancel,
  onSave,
  initialRows = [{ name: '', category: 'pump', notes: '', is_active: true }],
}: {
  onCancel: () => void
  onSave: (rows: EquipmentEditorRow[]) => void
  initialRows?: EquipmentEditorRow[]
}) {
  const [rows, setRows] = useState<EquipmentEditorRow[]>(initialRows)

  const addRow = () => setRows(prev => [...prev, { name: '', category: 'pump', notes: '', is_active: true }])
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx))
  const updateRow = (idx: number, patch: Partial<EquipmentEditorRow>) =>
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const isValid = rows.length > 0 && rows.every(r => r.name.trim() && r.category)

  const categoryOptions = [
    { value: '', label: 'Select category' },
    { value: 'pump', label: 'Pump' },
    { value: 'filter', label: 'Filter' },
    { value: 'chlorinator', label: 'Chlorinator' },
    { value: 'heater', label: 'Heater' },
    { value: 'balance_tank', label: 'Balance Tank' },
    { value: 'other', label: 'Other' },
  ] as const

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-medium">Add Multiple Equipment</div>
          <button onClick={onCancel} className="px-3 py-1 rounded border text-sm">Close</button>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-2 py-2 w-[32%]">Name</th>
                  <th className="px-2 py-2 w-[18%]">Category</th>
                  <th className="px-2 py-2 w-[26%]">Config</th>
                  <th className="px-2 py-2">Notes</th>
                  <th className="px-2 py-2">Active</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-2">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(idx, { name: e.target.value })}
                        placeholder="e.g., Filter #1"
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={row.category}
                        onChange={(e) => updateRow(idx, { category: e.target.value as any })}
                        className="w-full border rounded px-2 py-1"
                      >
                        {categoryOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      {row.category === 'pump' && (
                        <select
                          value={row.measurement_config?.field_type || 'rpm'}
                          onChange={(e) => updateRow(idx, { measurement_config: { field_type: e.target.value } })}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="rpm">RPM</option>
                          <option value="hz">Hz</option>
                        </select>
                      )}
                      {row.category === 'filter' && (
                        <select
                          value={row.measurement_config?.field_type || 'pressure_dual'}
                          onChange={(e) => updateRow(idx, { measurement_config: { field_type: e.target.value } })}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="pressure_dual">Inlet/Outlet (dual)</option>
                          <option value="pressure_single">Overall (single)</option>
                        </select>
                      )}
                      {row.category === 'chlorinator' && (
                        <select
                          value={row.measurement_config?.label || 'Setpoint'}
                          onChange={(e) => updateRow(idx, { measurement_config: { field_type: 'percent', label: e.target.value } })}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="Setpoint">Setpoint %</option>
                          <option value="Output">Output %</option>
                        </select>
                      )}
                      {row.category === 'heater' && (
                        <input disabled value="Temperature (°C)" className="w-full border rounded px-2 py-1 bg-gray-50 text-gray-700" />
                      )}
                      {row.category === 'balance_tank' && (
                        <input disabled value="Level (L)" className="w-full border rounded px-2 py-1 bg-gray-50 text-gray-700" />
                      )}
                      {row.category === 'other' && (
                        <div className="flex gap-2">
                          <select
                            value={row.measurement_config?.field_type || 'number'}
                            onChange={(e) => updateRow(idx, { measurement_config: { ...(row.measurement_config || {}), field_type: e.target.value } })}
                            className="border rounded px-2 py-1"
                          >
                            <option value="number">Number</option>
                            <option value="text">Text</option>
                            <option value="boolean">Yes/No</option>
                          </select>
                          <input
                            value={row.measurement_config?.label || ''}
                            onChange={(e) => updateRow(idx, { measurement_config: { ...(row.measurement_config || {}), label: e.target.value } })}
                            placeholder="Label (optional)"
                            className="w-full border rounded px-2 py-1"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={row.notes || ''}
                        onChange={(e) => updateRow(idx, { notes: e.target.value })}
                        placeholder="Optional"
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) => updateRow(idx, { is_active: e.target.checked })}
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => removeRow(idx)} className="px-2 py-1 rounded border text-xs">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button onClick={addRow} className="px-3 py-2 rounded border">Add Row</button>
            <div className="space-x-2">
              <button onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
              <button
                disabled={!isValid}
                onClick={() => onSave(rows)}
                className={`px-3 py-2 rounded text-white ${isValid ? 'bg-primary hover:bg-primary-600' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Save All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




