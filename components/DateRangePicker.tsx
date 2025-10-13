'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string) => void
  placeholder?: string
  className?: string
}

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onChange, 
  placeholder = "Select date range",
  className = ""
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const [tempStartDate, setTempStartDate] = useState<string | null>(null)
  const [tempEndDate, setTempEndDate] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setTempStartDate(null)
        setTempEndDate(null)
        setSelectingStart(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (date: string) => {
    if (!date) return ''
    // Parse the date string as local date to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    return localDate.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateInRange = (date: Date) => {
    const checkDate = formatDateForStorage(date)
    const start = tempStartDate || startDate
    const end = tempEndDate || endDate
    
    if (!start || !end) return false
    
    return checkDate >= start && checkDate <= end
  }

  const isDateSelected = (date: Date) => {
    const checkDate = formatDateForStorage(date)
    return checkDate === startDate || checkDate === endDate || checkDate === tempStartDate || checkDate === tempEndDate
  }

  const formatDateForStorage = (date: Date) => {
    // Use local date to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateClick = (date: Date) => {
    const dateString = formatDateForStorage(date)
    
    if (selectingStart) {
      setTempStartDate(dateString)
      setTempEndDate(null)
      setSelectingStart(false)
    } else {
      const startDateToUse = tempStartDate || startDate
      if (dateString >= startDateToUse) {
        setTempEndDate(dateString)
        onChange(startDateToUse, dateString)
        setIsOpen(false)
        setSelectingStart(true)
        setTempStartDate(null)
        setTempEndDate(null)
      } else {
        // If end date is before start date, make it the new start date
        setTempStartDate(dateString)
        setTempEndDate(null)
        setSelectingStart(false)
      }
    }
  }

  const handleClear = () => {
    onChange('', '')
    setTempStartDate(null)
    setTempEndDate(null)
    setSelectingStart(true)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isInRange = isDateInRange(date)
      const isSelected = isDateSelected(date)
      const isToday = date.toDateString() === new Date().toDateString()
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`
            h-8 w-8 rounded text-sm transition-colors
            ${isSelected 
              ? 'bg-primary text-white' 
              : isInRange 
                ? 'bg-primary-100 text-primary-700' 
                : isToday
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  const displayValue = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }
    if (startDate) {
      return `${formatDate(startDate)} - Select end date`
    }
    return placeholder
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 text-left"
          >
            <span className={startDate || endDate ? 'text-gray-900' : 'text-gray-500'}>
              {displayValue()}
            </span>
          </button>
          <div className="flex items-center space-x-1">
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-4">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="rounded p-1 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-medium text-gray-900">
                {currentMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="rounded p-1 hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day labels */}
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="h-8 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Instructions */}
            <div className="mt-4 text-xs text-gray-500">
              {selectingStart ? 'Select check-in date' : 'Select check-out date'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
