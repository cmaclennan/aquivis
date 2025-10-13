'use client'

import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { ComplianceResult, ComplianceStatus } from '@/lib/compliance'

interface ComplianceAlertProps {
  result: ComplianceResult
  parameter: string
  className?: string
}

export default function ComplianceAlert({ result, parameter, className = '' }: ComplianceAlertProps) {
  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <Info className="h-4 w-4 text-yellow-600" />
      case 'violation':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant':
        return 'border-green-200 bg-green-50 text-green-800'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'violation':
        return 'border-red-200 bg-red-50 text-red-800'
    }
  }

  const getStatusLabel = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant':
        return 'Compliant'
      case 'warning':
        return 'Warning'
      case 'violation':
        return 'Violation'
    }
  }

  return (
    <div className={`rounded-lg border p-3 ${getStatusColor(result.status)} ${className}`}>
      <div className="flex items-start space-x-2">
        {getStatusIcon(result.status)}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium capitalize">
              {parameter.replace('_', ' ')} - {getStatusLabel(result.status)}
            </span>
          </div>
          <p className="text-sm">{result.message}</p>
          
          {result.recommendation && (
            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border">
              <p className="text-xs font-medium mb-1">Recommended Action:</p>
              <p className="text-xs">{result.recommendation}</p>
              {result.chemical && result.dosage && (
                <p className="text-xs mt-1">
                  <strong>{result.chemical}:</strong> {result.dosage}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}








