/**
 * QLD Health Compliance Validation System
 * 
 * Validates water test parameters against QLD Health standards
 * Provides chemical recommendations for out-of-range parameters
 * Auto-detects compliance violations
 */

export type RiskCategory = 'low' | 'medium' | 'high'
export type WaterType = 'chlorine' | 'bromine'
export type ComplianceStatus = 'compliant' | 'warning' | 'violation'

export interface ComplianceResult {
  status: ComplianceStatus
  message: string
  recommendation?: string
  chemical?: string
  dosage?: string
}

export interface WaterTestParams {
  ph?: number
  chlorine?: number
  bromine?: number
  salt?: number
  alkalinity?: number
  calcium?: number
  cyanuric?: number
  turbidity?: number
  temperature?: number
}

export interface ComplianceStandards {
  ph_min: number
  ph_max: number
  free_chlorine_min?: number
  free_chlorine_max?: number
  bromine_min?: number
  bromine_max?: number
  combined_chlorine_max?: number
  alkalinity_min: number
  alkalinity_max: number
  turbidity_max: number
  cyanuric_acid_max?: number
}

/**
 * QLD Health Standards by Risk Category
 * Based on Tables A2.1, A2.2, A2.3 from QLD Health Guidelines
 */
export const QLD_STANDARDS: Record<RiskCategory, ComplianceStandards> = {
  low: {
    ph_min: 7.2,
    ph_max: 7.8,
    free_chlorine_min: 1.0,
    alkalinity_min: 80,
    alkalinity_max: 200,
    turbidity_max: 1.0,
    cyanuric_acid_max: 50
  },
  medium: {
    ph_min: 7.2,
    ph_max: 7.8,
    free_chlorine_min: 1.0,
    alkalinity_min: 80,
    alkalinity_max: 200,
    turbidity_max: 1.0,
    cyanuric_acid_max: 50
  },
  high: {
    ph_min: 7.2,
    ph_max: 7.8,
    free_chlorine_min: 1.0,
    alkalinity_min: 80,
    alkalinity_max: 200,
    turbidity_max: 1.0,
    cyanuric_acid_max: 50
  }
}

/**
 * Bromine Standards for Spas
 * Based on Table A2.2
 */
export const BROMINE_STANDARDS: ComplianceStandards = {
  ph_min: 7.2,
  ph_max: 8.0,
  bromine_min: 6.0,
  bromine_max: 8.0,
  alkalinity_min: 80,
  alkalinity_max: 200,
  turbidity_max: 1.0
}

/**
 * Chemical Recommendations Database
 * Based on QLD Health guidelines and industry standards
 */
export const CHEMICAL_RECOMMENDATIONS = {
  ph_high: {
    chemical: 'pH Minus (Muriatic Acid)',
    dosage: '50mL per 10,000L',
    retest: '2-4 hours',
    safety: 'Wear protective equipment, add slowly to deep end'
  },
  ph_low: {
    chemical: 'pH Plus (Soda Ash)',
    dosage: '100g per 10,000L',
    retest: '2-4 hours',
    safety: 'Dissolve in bucket first, add to deep end'
  },
  chlorine_low: {
    chemical: 'Chlorine (Sodium Hypochlorite)',
    dosage: '200mL per 10,000L',
    retest: '30 minutes',
    safety: 'Add to deep end, avoid mixing with other chemicals'
  },
  chlorine_high: {
    chemical: 'Chlorine Neutralizer',
    dosage: '50mL per 10,000L',
    retest: '2-4 hours',
    safety: 'Add slowly, test frequently'
  },
  alkalinity_low: {
    chemical: 'Alkalinity Increaser (Sodium Bicarbonate)',
    dosage: '500g per 10,000L',
    retest: '4-6 hours',
    safety: 'Add to deep end, brush to dissolve'
  },
  alkalinity_high: {
    chemical: 'pH Minus (Muriatic Acid)',
    dosage: '100mL per 10,000L',
    retest: '2-4 hours',
    safety: 'Add slowly, test pH frequently'
  },
  bromine_low: {
    chemical: 'Bromine Tablets',
    dosage: '2-3 tablets per 10,000L',
    retest: '2-4 hours',
    safety: 'Use bromine feeder, avoid direct contact'
  },
  bromine_high: {
    chemical: 'Bromine Neutralizer',
    dosage: '50mL per 10,000L',
    retest: '2-4 hours',
    safety: 'Add slowly, test frequently'
  },
  turbidity_high: {
    chemical: 'Clarifier (Aluminum Sulfate)',
    dosage: '100mL per 10,000L',
    retest: '24 hours',
    safety: 'Run filter continuously, backwash when needed'
  }
}

/**
 * Determine risk category based on unit type
 */
export function getRiskCategory(unitType: string): RiskCategory {
  const highRiskTypes = ['main_spa', 'rooftop_spa', 'plunge_pool']
  const mediumRiskTypes = ['main_pool', 'kids_pool', 'villa_pool', 'residential_pool']
  
  if (highRiskTypes.includes(unitType)) return 'high'
  if (mediumRiskTypes.includes(unitType)) return 'medium'
  return 'low'
}

/**
 * Validate pH level against QLD standards
 */
export function validatePH(ph: number, standards: ComplianceStandards): ComplianceResult {
  if (ph < standards.ph_min) {
    return {
      status: 'violation',
      message: `pH too low (${ph}), target: ${standards.ph_min}-${standards.ph_max}`,
      recommendation: CHEMICAL_RECOMMENDATIONS.ph_low.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.ph_low.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.ph_low.dosage
    }
  }
  
  if (ph > standards.ph_max) {
    return {
      status: 'violation',
      message: `pH too high (${ph}), target: ${standards.ph_min}-${standards.ph_max}`,
      recommendation: CHEMICAL_RECOMMENDATIONS.ph_high.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.ph_high.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.ph_high.dosage
    }
  }
  
  return {
    status: 'compliant',
    message: `pH within range (${ph})`
  }
}

/**
 * Validate chlorine level against QLD standards
 */
export function validateChlorine(chlorine: number, standards: ComplianceStandards): ComplianceResult {
  if (!standards.free_chlorine_min) {
    return { status: 'compliant', message: 'Chlorine not required for this water type' }
  }
  
  if (chlorine < standards.free_chlorine_min) {
    return {
      status: 'violation',
      message: `Chlorine too low (${chlorine}mg/L), target: ≥${standards.free_chlorine_min}mg/L`,
      recommendation: CHEMICAL_RECOMMENDATIONS.chlorine_low.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.chlorine_low.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.chlorine_low.dosage
    }
  }
  
  if (standards.free_chlorine_max && chlorine > standards.free_chlorine_max) {
    return {
      status: 'violation',
      message: `Chlorine too high (${chlorine}mg/L), target: ≤${standards.free_chlorine_max}mg/L`,
      recommendation: CHEMICAL_RECOMMENDATIONS.chlorine_high.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.chlorine_high.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.chlorine_high.dosage
    }
  }
  
  return {
    status: 'compliant',
    message: `Chlorine within range (${chlorine}mg/L)`
  }
}

/**
 * Validate bromine level for spas
 */
export function validateBromine(bromine: number, standards: ComplianceStandards): ComplianceResult {
  if (!standards.bromine_min || !standards.bromine_max) {
    return { status: 'compliant', message: 'Bromine not required for this water type' }
  }
  
  if (bromine < standards.bromine_min) {
    return {
      status: 'violation',
      message: `Bromine too low (${bromine}mg/L), target: ${standards.bromine_min}-${standards.bromine_max}mg/L`,
      recommendation: CHEMICAL_RECOMMENDATIONS.bromine_low.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.bromine_low.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.bromine_low.dosage
    }
  }
  
  if (bromine > standards.bromine_max) {
    return {
      status: 'violation',
      message: `Bromine too high (${bromine}mg/L), target: ${standards.bromine_min}-${standards.bromine_max}mg/L`,
      recommendation: CHEMICAL_RECOMMENDATIONS.bromine_high.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.bromine_high.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.bromine_high.dosage
    }
  }
  
  return {
    status: 'compliant',
    message: `Bromine within range (${bromine}mg/L)`
  }
}

/**
 * Validate alkalinity level
 */
export function validateAlkalinity(alkalinity: number, standards: ComplianceStandards): ComplianceResult {
  if (alkalinity < standards.alkalinity_min) {
    return {
      status: 'violation',
      message: `Alkalinity too low (${alkalinity}mg/L), target: ${standards.alkalinity_min}-${standards.alkalinity_max}mg/L`,
      recommendation: CHEMICAL_RECOMMENDATIONS.alkalinity_low.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.alkalinity_low.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.alkalinity_low.dosage
    }
  }
  
  if (alkalinity > standards.alkalinity_max) {
    return {
      status: 'violation',
      message: `Alkalinity too high (${alkalinity}mg/L), target: ${standards.alkalinity_min}-${standards.alkalinity_max}mg/L`,
      recommendation: CHEMICAL_RECOMMENDATIONS.alkalinity_high.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.alkalinity_high.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.alkalinity_high.dosage
    }
  }
  
  return {
    status: 'compliant',
    message: `Alkalinity within range (${alkalinity}mg/L)`
  }
}

/**
 * Validate turbidity level
 */
export function validateTurbidity(turbidity: number, standards: ComplianceStandards): ComplianceResult {
  if (turbidity > standards.turbidity_max) {
    return {
      status: 'violation',
      message: `Turbidity too high (${turbidity}NTU), target: ≤${standards.turbidity_max}NTU`,
      recommendation: CHEMICAL_RECOMMENDATIONS.turbidity_high.chemical,
      chemical: CHEMICAL_RECOMMENDATIONS.turbidity_high.chemical,
      dosage: CHEMICAL_RECOMMENDATIONS.turbidity_high.dosage
    }
  }
  
  return {
    status: 'compliant',
    message: `Turbidity within range (${turbidity}NTU)`
  }
}

/**
 * Main compliance validation function
 */
export function validateWaterTest(
  params: WaterTestParams,
  unitType: string,
  waterType: string
): { overall: ComplianceStatus; results: Record<string, ComplianceResult> } {
  const riskCategory = getRiskCategory(unitType)
  const standards = waterType === 'bromine' ? BROMINE_STANDARDS : QLD_STANDARDS[riskCategory]
  
  const results: Record<string, ComplianceResult> = {}
  let hasViolations = false
  
  // Validate pH
  if (params.ph !== undefined) {
    results.ph = validatePH(params.ph, standards)
    if (results.ph.status === 'violation') hasViolations = true
  }
  
  // Validate chlorine (for chlorine pools)
  if (params.chlorine !== undefined && waterType !== 'bromine') {
    results.chlorine = validateChlorine(params.chlorine, standards)
    if (results.chlorine.status === 'violation') hasViolations = true
  }
  
  // Validate bromine (for spas)
  if (params.bromine !== undefined && waterType === 'bromine') {
    results.bromine = validateBromine(params.bromine, standards)
    if (results.bromine.status === 'violation') hasViolations = true
  }
  
  // Validate alkalinity
  if (params.alkalinity !== undefined) {
    results.alkalinity = validateAlkalinity(params.alkalinity, standards)
    if (results.alkalinity.status === 'violation') hasViolations = true
  }
  
  // Validate turbidity
  if (params.turbidity !== undefined) {
    results.turbidity = validateTurbidity(params.turbidity, standards)
    if (results.turbidity.status === 'violation') hasViolations = true
  }
  
  return {
    overall: hasViolations ? 'violation' : 'compliant',
    results
  }
}

/**
 * Get chemical recommendation for a specific parameter
 */
export function getChemicalRecommendation(parameter: string, value: number, standards: ComplianceStandards): string | null {
  switch (parameter) {
    case 'ph':
      if (value < standards.ph_min) return CHEMICAL_RECOMMENDATIONS.ph_low.chemical
      if (value > standards.ph_max) return CHEMICAL_RECOMMENDATIONS.ph_high.chemical
      break
    case 'chlorine':
      if (standards.free_chlorine_min && value < standards.free_chlorine_min) {
        return CHEMICAL_RECOMMENDATIONS.chlorine_low.chemical
      }
      break
    case 'bromine':
      if (standards.bromine_min && value < standards.bromine_min) {
        return CHEMICAL_RECOMMENDATIONS.bromine_low.chemical
      }
      break
    case 'alkalinity':
      if (value < standards.alkalinity_min) return CHEMICAL_RECOMMENDATIONS.alkalinity_low.chemical
      if (value > standards.alkalinity_max) return CHEMICAL_RECOMMENDATIONS.alkalinity_high.chemical
      break
    case 'turbidity':
      if (value > standards.turbidity_max) return CHEMICAL_RECOMMENDATIONS.turbidity_high.chemical
      break
  }
  
  return null
}
