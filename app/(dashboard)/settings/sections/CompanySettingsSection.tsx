'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CompanySettingsSectionProps {
  company: any
}

export default function CompanySettingsSection({ company }: CompanySettingsSectionProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(company?.name || '')
  const [businessType, setBusinessType] = useState(company?.business_type || 'residential')
  const [email, setEmail] = useState(company?.email || '')
  const [phone, setPhone] = useState(company?.phone || '')
  const [address, setAddress] = useState(company?.address || '')
  const [city, setCity] = useState(company?.city || '')
  const [state, setState] = useState(company?.state || '')
  const [postalCode, setPostalCode] = useState(company?.postal_code || '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: name.trim() || null,
          business_type: businessType,
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          postal_code: postalCode.trim() || null,
        })
        .eq('id', company.id)

      if (error) throw error

      toast({ title: 'Saved', description: 'Company settings updated successfully.' })
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Unable to save company settings.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="company" className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Company Information</h2>
        <p className="mt-1 text-sm text-gray-600">Update your company details and contact information</p>
      </div>
      <div className="px-6 py-4">
        <form className="space-y-6" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="business-type" className="block text-sm font-medium text-gray-700">
                Business Type
              </label>
              <select
                id="business-type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                id="postal-code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}







