import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Phone, Calendar, Shield, Edit } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/onboarding')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-gray-600">
              Manage your personal information and account settings
            </p>
          </div>
          <a
            href="/profile/edit"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Profile Overview</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-20 w-20">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl font-medium text-primary-700">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </span>
                  </div>
                </div>
                <div className="ml-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      profile?.role === 'owner' 
                        ? 'bg-purple-100 text-purple-800'
                        : profile?.role === 'super_admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Info</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-500">
                      {new Date(profile?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Company</p>
                    <p className="text-sm text-gray-500">{profile?.companies?.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              <p className="mt-1 text-sm text-gray-600">
                Your personal details and contact information
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <div className="mt-1 flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{profile?.first_name}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <div className="mt-1 flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{profile?.last_name}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{profile?.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {profile?.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your account preferences and security
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Change Password
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Enable 2FA
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Account Deactivation</h3>
                    <p className="text-sm text-gray-600">Temporarily deactivate your account</p>
                  </div>
                  <button className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                    Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <p className="mt-1 text-sm text-gray-600">
                Your recent actions and system activity
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-green-700">✓</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Account created</p>
                    <p className="text-sm text-gray-500">
                      {new Date(profile?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-700">👤</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Joined {profile?.companies?.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(profile?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






