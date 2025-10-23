'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Building2, Users, Activity, LogOut, ChevronDown } from 'lucide-react'

interface Company {
  id: string
  name: string
  business_type?: string
  email: string
  created_at: string
  user_count: number
}

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_all_companies')
      
      if (error) throw error
      
      setCompanies(data || [])
      
      // Set first company as default if none selected
      if (data && data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, selectedCompany])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company)
    setShowCompanyDropdown(false)
    
    // Store selected company in sessionStorage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('superAdminSelectedCompany', JSON.stringify(company))
    }
    
    // In a full implementation, you might also:
    // - Update server-side session context
    // - Refresh data scoped to the selected company
    // - Update URL parameters to reflect the selection
  }

  const handleLogout = async () => {
    // Navigate to logout route which clears NextAuth session
    window.location.href = '/logout'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-600">Loading super admin interface...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Super Admin Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Super Admin Sidebar */}
      <aside className="flex w-80 flex-col bg-red-600 border-r border-red-700">
        {/* Header */}
        <div className="p-6 border-b border-red-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 flex-shrink-0">
              <div className="h-full w-full rounded-lg bg-red-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-white">Super Admin</h1>
              <p className="text-xs text-red-200">System Administrator</p>
            </div>
          </div>
        </div>

        {/* Company Selector */}
        <div className="p-4 border-b border-red-700">
          <label className="block text-sm font-medium text-red-100 mb-2">
            Viewing Company Data
          </label>
          <div className="relative">
            <button
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="w-full flex items-center justify-between rounded-lg bg-red-500 px-3 py-2 text-white hover:bg-red-400 transition-colors"
            >
              <span className="truncate">
                {selectedCompany?.name || 'Select Company'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showCompanyDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                      selectedCompany?.id === company.id ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                    }`}
                  >
                    <div className="font-medium">{company.name}</div>
                    <div className="text-xs text-gray-500">
                      {company.user_count} users • {company.business_type}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <a
            href="/super-admin"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-red-100 hover:bg-red-500 transition-colors"
          >
            <Activity className="h-5 w-5" />
            <span>Dashboard</span>
          </a>
          <a
            href="/super-admin/companies"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-red-100 hover:bg-red-500 transition-colors"
          >
            <Building2 className="h-5 w-5" />
            <span>Companies</span>
          </a>
          <a
            href="/super-admin/users"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-red-100 hover:bg-red-500 transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>Users</span>
          </a>
          <a
            href="/super-admin/audit-log"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-red-100 hover:bg-red-500 transition-colors"
          >
            <Shield className="h-5 w-5" />
            <span>Audit Log</span>
          </a>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-red-700">
          <div className="rounded-lg bg-red-500 p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm truncate">
                  Super Admin Mode
                </p>
                <p className="text-xs text-red-200 truncate">
                  {selectedCompany?.name || 'No company selected'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex-shrink-0 ml-2 text-red-200 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Warning Banner */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              Super Admin Mode Active
            </span>
            <span className="text-sm text-red-700">
              - All actions are logged and audited
            </span>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
