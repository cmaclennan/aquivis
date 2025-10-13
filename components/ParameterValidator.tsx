'use client'

import { useState, useEffect } from 'react'
import { validateWaterTest, WaterTestParams, ComplianceResult } from '@/lib/compliance'
import ComplianceAlert from './ComplianceAlert'

interface ParameterValidatorProps {
  parameter: string
  value: number | null
  unitType: string
  waterType: string
  className?: string
}

export default function ParameterValidator({ 
  parameter, 
  value, 
  unitType, 
  waterType, 
  className = '' 
}: ParameterValidatorProps) {
  const [result, setResult] = useState<ComplianceResult | null>(null)

  useEffect(() => {
    if (value === null || value === undefined) {
      setResult(null)
      return
    }

    // Create minimal params object for single parameter validation
    const params: WaterTestParams = {}
    params[parameter as keyof WaterTestParams] = value

    const validation = validateWaterTest(params, unitType, waterType)
    setResult(validation.results[parameter] || null)
  }, [parameter, value, unitType, waterType])

  if (!result || value === null || value === undefined) {
    return null
  }

  return (
    <div className={className}>
      <ComplianceAlert 
        result={result} 
        parameter={parameter}
      />
    </div>
  )
}








