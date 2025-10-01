import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert litres to gallons (for imperial display)
 */
export function litresToGallons(litres: number): number {
  return Math.round(litres * 0.264172)
}

/**
 * Convert gallons to litres (for storage)
 */
export function gallonsToLitres(gallons: number): number {
  return Math.round(gallons / 0.264172)
}

/**
 * Format volume based on unit system
 */
export function formatVolume(litres: number, unitSystem: 'metric' | 'imperial' = 'metric'): string {
  if (unitSystem === 'imperial') {
    return `${litresToGallons(litres).toLocaleString()} gal`
  }
  return `${litres.toLocaleString()} L`
}

/**
 * Format date based on preference
 */
export function formatDate(date: Date, format: 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'DD/MM/YYYY'): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`
  }
  return `${day}/${month}/${year}`
}

