'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface CompanyStats {
  company_name: string
  user_count: number
  property_count: number
  unit_count: number
  service_count: number
  last_activity: string
}

interface SystemStats {
  total_companies: number
  total_users: number
  total_properties: number
  total_units: number
  total_services: number
  active_companies: number
}

export default function SuperAdminDashboard() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load all companies
      const { data: companies, error: companiesError } = await supabase.rpc('get_all_companies')
      if (companiesError) throw companiesError

      // Calculate system stats
      const stats: SystemStats = {
        total_companies: companies?.length || 0,
        total_users: companies?.reduce((sum: number, c: any) => sum + c.user_count, 0) || 0,
        total_properties: 0, // Will be calculated from individual company stats
        total_units: 0,
        total_services: 0,
        active_companies: 0
      }

      // Load detailed stats for each company
      const companyStatsPromises = companies?.map(async (company: any) => {
        const { data: companyStatsData, error: statsError } = await supabase.rpc('get_company_stats', {
          company_uuid: company.id
        })
        if (statsError) throw statsError
        return companyStatsData?.[0]
      }) || []

      const companyStatsResults = await Promise.all(companyStatsPromises)
      const validCompanyStats = companyStatsResults.filter(Boolean)

      // Update system stats
      stats.total_properties = validCompanyStats.reduce((sum, c) => sum + c.property_count, 0)
      stats.total_units = validCompanyStats.reduce((sum, c) => sum + c.unit_count, 0)
      stats.total_services = validCompanyStats.reduce((sum, c) => sum + c.service_count, 0)
      stats.active_companies = validCompanyStats.filter(c => c.last_activity).length

      setSystemStats(stats)
      setCompanyStats(validCompanyStats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">Error loading dashboard: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          System overview and company management
        </p>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.total_companies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.total_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Companies</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.active_companies}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.total_properties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Units</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.total_units}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.total_services}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Company Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companyStats.map((company, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{company.company_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.user_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.property_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.unit_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.service_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.last_activity ? (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(company.last_activity).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No activity</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <a
            href="/super-admin/companies"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-gray-900">Manage Companies</p>
              <p className="text-sm text-gray-600">View and manage all companies</p>
            </div>
          </a>
          <a
            href="/super-admin/users"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <Users className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-600">View and manage all users</p>
            </div>
          </a>
          <a
            href="/super-admin/audit-log"
            className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-gray-900">Audit Log</p>
              <p className="text-sm text-gray-600">View system activity logs</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
