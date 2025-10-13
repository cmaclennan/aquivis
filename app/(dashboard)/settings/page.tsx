import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Building2, CreditCard, Bell, Shield, Users } from 'lucide-react'
import CompanySettingsSection from './sections/CompanySettingsSection'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user!.id)
    .single()

  // Only owners and managers can access settings
  if (profile?.role !== 'owner' && profile?.role !== 'manager') {
    redirect('/dashboard')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your company settings, subscription, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            <a
              href="#company"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-md"
            >
              <Building2 className="h-5 w-5 mr-3 text-gray-500" />
              Company Information
            </a>
            <a
              href="#subscription"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <CreditCard className="h-5 w-5 mr-3 text-gray-400" />
              Subscription & Billing
            </a>
            <a
              href="#notifications"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <Bell className="h-5 w-5 mr-3 text-gray-400" />
              Notifications
            </a>
            <a
              href="#security"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <Shield className="h-5 w-5 mr-3 text-gray-400" />
              Security & Access
            </a>
            {profile?.role === 'owner' && (
              <a
                href="/team"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <Users className="h-5 w-5 mr-3 text-gray-400" />
                Team Management
              </a>
            )}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          {/* Company Information */}
          <CompanySettingsSection company={profile?.companies} />

          {/* Subscription & Billing */}
          <div id="subscription" className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Subscription & Billing</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your subscription plan and billing information
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Current Plan</h3>
                  <p className="text-sm text-gray-600">
                    {profile?.companies?.subscription_tier || 'Starter'} Plan
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    profile?.companies?.subscription_status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile?.companies?.subscription_status || 'Trial'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Billing
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div id="notifications" className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose how you want to be notified about important events
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Service Reminders</label>
                    <p className="text-sm text-gray-600">Get reminded about upcoming services</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Team Activity</label>
                    <p className="text-sm text-gray-600">Notifications about team member activity</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

