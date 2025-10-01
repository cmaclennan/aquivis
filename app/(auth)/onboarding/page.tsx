'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type BusinessType = 'residential' | 'commercial' | 'both'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [companyName, setCompanyName] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType>('both')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleCreateCompany = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          business_type: businessType,
          phone: phone,
          timezone: 'Australia/Brisbane',
          unit_system: 'metric',
          date_format: 'DD/MM/YYYY',
          currency: 'AUD',
          compliance_jurisdiction: 'QLD',
        })
        .select()
        .single()

      if (companyError) throw companyError

      // Update user profile with company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create company')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-accent-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <span className="text-2xl text-white">🌊</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Aquivis</h1>
          <p className="mt-2 text-sm text-gray-600">Let's set up your pool service business</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center space-x-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-6 rounded-lg bg-error-light p-3 text-sm text-error">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">What type of pool service do you provide?</h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setBusinessType('residential')}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    businessType === 'residential'
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      businessType === 'residential' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {businessType === 'residential' && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">🏡 Residential Pools</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Backyard pools, private properties
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBusinessType('commercial')}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    businessType === 'commercial'
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      businessType === 'commercial' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {businessType === 'commercial' && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">🏢 Commercial Properties</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Resorts, hotels, body corporate, gyms
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBusinessType('both')}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    businessType === 'both'
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      businessType === 'both' ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {businessType === 'both' && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">🌊 Both Residential & Commercial</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Full-service pool management
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Company Details</h2>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Your Pool Service Company"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0412 345 678"
                />
              </div>

              <div className="rounded-lg bg-accent-50 p-4">
                <h3 className="font-medium text-gray-900">Selected Business Type:</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {businessType === 'residential' && '🏡 Residential Pools'}
                  {businessType === 'commercial' && '🏢 Commercial Properties'}
                  {businessType === 'both' && '🌊 Both Residential & Commercial'}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-2 text-sm text-primary hover:text-primary-600"
                >
                  Change →
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateCompany}
                  disabled={loading || !companyName}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          Default settings: Australia/Brisbane • Metric • QLD Health Compliance
        </p>
      </div>
    </div>
  )
}

