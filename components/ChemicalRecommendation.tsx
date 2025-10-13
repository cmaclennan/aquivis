'use client'

import { Beaker, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { CHEMICAL_RECOMMENDATIONS } from '@/lib/compliance'

interface ChemicalRecommendationProps {
  parameter: string
  value: number
  target: string
  chemical: string
  dosage: string
  retest: string
  safety: string
  className?: string
}

export default function ChemicalRecommendation({
  parameter,
  value,
  target,
  chemical,
  dosage,
  retest,
  safety,
  className = ''
}: ChemicalRecommendationProps) {
  return (
    <div className={`rounded-lg border border-blue-200 bg-blue-50 p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Beaker className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-blue-900">
              Chemical Recommendation
            </span>
            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
              {parameter.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-blue-900">Current:</span>
              <span className="text-blue-800 ml-2">{value}</span>
              <span className="text-blue-600 ml-2">({target})</span>
            </div>
            
            <div className="bg-white bg-opacity-50 rounded p-3 border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-blue-900">Recommended Action:</span>
              </div>
              
              <div className="space-y-1">
                <p><strong>Chemical:</strong> {chemical}</p>
                <p><strong>Dosage:</strong> {dosage}</p>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-blue-600" />
                  <span><strong>Retest:</strong> {retest}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-800 mb-1">Safety Warning:</p>
                  <p className="text-xs text-yellow-700">{safety}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}








