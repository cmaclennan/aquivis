'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react'

interface WaterQualityChartProps {
  unitId: string
  parameter: 'ph' | 'chlorine' | 'bromine' | 'alkalinity'
  className?: string
}

interface DataPoint {
  date: string
  value: number
  compliant: boolean
}

export default function WaterQualityChart({ unitId, parameter, className = '' }: WaterQualityChartProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadChartData = useCallback(async () => {
    try {
      // Fetch recent services for the unit, then extract water tests
      const res = await fetch(`/api/services?unitId=${unitId}&limit=50`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load water tests')

      const services = Array.isArray(json.services) ? json.services : []
      // Flatten water tests, attach service_date
      const tests: Array<{ date: string; value: number; compliant: boolean }> = []
      for (const s of services) {
        const sts = Array.isArray(s.water_tests) ? s.water_tests : []
        for (const wt of sts) {
          const v = wt?.[parameter]
          if (v !== null && v !== undefined) {
            const d = (s.service_date || wt.test_time || '')
            tests.push({ date: d, value: Number(v), compliant: !!wt.all_parameters_ok })
          }
        }
      }
      // Sort ascending by date/time and take last 10 points
      tests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const last10 = tests.slice(-10)
      setData(last10)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [parameter, unitId])

  useEffect(() => {
    loadChartData()
  }, [loadChartData])

  const getParameterLabel = () => {
    switch (parameter) {
      case 'ph':
        return 'pH Level'
      case 'chlorine':
        return 'Free Chlorine (mg/L)'
      case 'bromine':
        return 'Bromine (mg/L)'
      case 'alkalinity':
        return 'Total Alkalinity (mg/L)'
      default:
        return parameter
    }
  }

  const getParameterUnit = () => {
    switch (parameter) {
      case 'ph':
        return ''
      case 'chlorine':
      case 'bromine':
        return 'mg/L'
      case 'alkalinity':
        return 'mg/L'
      default:
        return ''
    }
  }

  const getTrendIcon = () => {
    if (data.length < 2) return <Minus className="h-4 w-4 text-gray-500" />
    
    const latest = data[data.length - 1].value
    const previous = data[data.length - 2].value
    
    if (latest > previous) {
      return <TrendingUp className="h-4 w-4 text-red-500" />
    } else if (latest < previous) {
      return <TrendingDown className="h-4 w-4 text-green-500" />
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendText = () => {
    if (data.length < 2) return 'Insufficient data'
    
    const latest = data[data.length - 1].value
    const previous = data[data.length - 2].value
    const change = latest - previous
    
    if (change > 0) {
      return `+${change.toFixed(1)} from last test`
    } else if (change < 0) {
      return `${change.toFixed(1)} from last test`
    } else {
      return 'No change from last test'
    }
  }

  const getComplianceStatus = () => {
    if (data.length === 0) return null
    
    const latest = data[data.length - 1]
    const compliantCount = data.filter(d => d.compliant).length
    const complianceRate = (compliantCount / data.length) * 100
    
    return {
      latest: latest.compliant,
      rate: complianceRate,
      count: compliantCount,
      total: data.length
    }
  }

  if (loading) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-600">Loading chart data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Error loading chart data</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{getParameterLabel()}</h3>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No data available</p>
          <p className="text-sm text-gray-500 mt-1">Chart will appear once test data is available</p>
        </div>
      </div>
    )
  }

  const compliance = getComplianceStatus()
  const latestValue = data[data.length - 1].value

  return (
    <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{getParameterLabel()}</h3>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className="text-sm text-gray-600">{getTrendText()}</span>
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-bold text-gray-900">
            {latestValue}{getParameterUnit()}
          </div>
          {compliance && (
            <div className="flex items-center space-x-1">
              {compliance.latest ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${compliance.latest ? 'text-green-600' : 'text-red-600'}`}>
                {compliance.latest ? 'Compliant' : 'Non-compliant'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Recent Tests</span>
          <span>{compliance?.count}/{compliance?.total} compliant</span>
        </div>
        
        <div className="flex items-end space-x-1 h-20">
          {data.slice(-6).map((point, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t ${
                  point.compliant ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  height: `${Math.max(20, (point.value / Math.max(...data.map(d => d.value))) * 60)}px`
                }}
              />
              <div className="text-xs text-gray-500 mt-1">
                {new Date(point.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Points */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          {data.slice(-3).map((point, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {new Date(point.date).toLocaleDateString('en-AU')}
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{point.value}{getParameterUnit()}</span>
                {point.compliant ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
