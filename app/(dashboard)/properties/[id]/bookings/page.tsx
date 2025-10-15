'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Save, Trash2, Calendar, User, Home } from 'lucide-react'
import DateRangePicker from '@/components/DateRangePicker'

interface Booking {
  id: string
  unit_id: string
  check_in_date: string
  check_out_date: string
  unit: {
    id: string
    name: string
    unit_type: string
  }
}

interface Property {
  id: string
  name: string
  property_type: string
  units: {
    id: string
    name: string
    unit_type: string
  }[]
}

interface Props {
  params: Promise<{ id: string }>
}

export default function BookingsPage({ params }: Props) {
  const [property, setProperty] = useState<Property | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyId, setPropertyId] = useState<string>('')
  
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const loadData = useCallback(async (propId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) throw new Error('No company found')

      // Load property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          units(id, name, unit_type)
        `)
        .eq('id', propId)
        .eq('company_id', profile.company_id)
        .single()

      if (propertyError) throw propertyError
      if (!propertyData) throw new Error('Property not found')

      setProperty(propertyData)

      // Load bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          unit:units(id, name, unit_type)
        `)
        .eq('unit.property_id', propId)
        .order('check_in_date', { ascending: false })

      if (bookingsError) throw bookingsError
      setBookings((bookingsData || []) as Booking[])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    params.then((resolvedParams) => {
      setPropertyId(resolvedParams.id)
      loadData(resolvedParams.id)
    })
  }, [params, loadData])

  const handleAddBooking = async (bookingData: Omit<Booking, 'id' | 'unit'>) => {
    try {
      setSaving(true)
      setError(null)

      // Find unit by name/number
      const unit = property?.units?.find((u: any) => 
        u.name.toLowerCase().includes(bookingData.unit_id.toLowerCase()) ||
        u.name === bookingData.unit_id
      )

      if (!unit) {
        throw new Error(`Unit "${bookingData.unit_id}" not found. Please check the unit number.`)
      }

      // Validate dates before insertion
      if (!bookingData.check_in_date || !bookingData.check_out_date) {
        throw new Error('Both check-in and check-out dates are required')
      }

      if (new Date(bookingData.check_out_date) <= new Date(bookingData.check_in_date)) {
        throw new Error('Check-out date must be after check-in date')
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          unit_id: unit.id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date
        })
        .select(`
          *,
          unit:units(id, name, unit_type)
        `)
        .single()

      if (error) throw error

      setBookings(prev => [data as Booking, ...prev])
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateBooking = async (bookingData: Booking | Omit<Booking, 'id' | 'unit'>) => {
    // Type guard: if it's an edit, it should have an id
    if (!('id' in bookingData)) {
      setError('Invalid booking data for update')
      return
    }
    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('bookings')
        .update({
          unit_id: bookingData.unit_id,
          check_in_date: bookingData.check_in_date,
          check_out_date: bookingData.check_out_date
        })
        .eq('id', bookingData.id)

      if (error) throw error

      setBookings(prev => prev.map(booking => 
        booking.id === bookingData.id ? (bookingData as Booking) : booking
      ))
      setEditingBooking(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      setBookings(prev => prev.filter(booking => booking.id !== bookingId))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAddBookings = async (bulkData: { bookings: Array<{ unitNumber: string, checkInDate: string, checkOutDate: string }> }) => {
    try {
      setSaving(true)
      setError(null)

      const bookingsToAdd = []
      const errors = []

      for (const booking of bulkData.bookings) {
        // Find unit by name/number
        const unit = property?.units?.find((u: any) => 
          u.name.toLowerCase().includes(booking.unitNumber.toLowerCase()) ||
          u.name === booking.unitNumber
        )

        if (!unit) {
          errors.push(`Unit "${booking.unitNumber}" not found`)
          continue
        }

        // Validate dates before adding to batch
        if (!booking.checkInDate || !booking.checkOutDate) {
          errors.push(`Unit "${booking.unitNumber}" is missing dates`)
          continue
        }

        if (new Date(booking.checkOutDate) <= new Date(booking.checkInDate)) {
          errors.push(`Unit "${booking.unitNumber}" has invalid date range`)
          continue
        }

        bookingsToAdd.push({
          unit_id: unit.id,
          check_in_date: booking.checkInDate,
          check_out_date: booking.checkOutDate
        })
      }

      if (errors.length > 0) {
        throw new Error(`Errors found:\n${errors.join('\n')}`)
      }

      if (bookingsToAdd.length === 0) {
        throw new Error('No valid units found')
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingsToAdd)
        .select(`
          *,
          unit:units(id, name, unit_type)
        `)

      if (error) throw error

      setBookings(prev => [...((data || []) as Booking[]), ...prev])
      setShowBulkForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getBookingStatus = (checkIn: string, checkOut: string) => {
    const now = new Date()
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (now < checkInDate) return 'upcoming'
    if (now >= checkInDate && now <= checkOutDate) return 'current'
    return 'past'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'past':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading bookings...</div>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error || 'Property not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/properties/${propertyId}`)}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {property.name}</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="mt-2 text-gray-600">
              Manage occupancy for {property.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBulkForm(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Bulk Add
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Booking
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const status = getBookingStatus(booking.check_in_date, booking.check_out_date)
          return (
            <div key={booking.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Home className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {booking.unit.name} ({booking.unit.unit_type.replace('_', ' ')})
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        <span className="font-medium">Check-in:</span> {new Date(booking.check_in_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        <span className="font-medium">Check-out:</span> {new Date(booking.check_out_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {
                        Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))
                      } days
                    </div>
                  </div>
                  
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingBooking(booking)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit Booking"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBooking(booking.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Booking"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add bookings to track occupancy and generate service schedules.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Booking
            </button>
          </div>
        </div>
      )}

      {/* Add Booking Form */}
      {showAddForm && (
        <BookingForm
          property={property}
          onSave={handleAddBooking}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
        />
      )}

      {/* Edit Booking Form */}
      {editingBooking && (
        <BookingForm
          property={property}
          booking={editingBooking}
          onSave={handleUpdateBooking}
          onCancel={() => setEditingBooking(null)}
          saving={saving}
        />
      )}

      {/* Bulk Booking Form */}
      {showBulkForm && (
        <BulkBookingForm
          property={property}
          onSave={handleBulkAddBookings}
          onCancel={() => setShowBulkForm(false)}
          saving={saving}
        />
      )}
    </div>
  )
}

interface BookingFormProps {
  property: Property
  booking?: Booking
  onSave: (booking: Booking | Omit<Booking, 'id' | 'unit'>) => void
  onCancel: () => void
  saving: boolean
}

function BookingForm({ property, booking, onSave, onCancel, saving }: BookingFormProps) {
  const [formData, setFormData] = useState({
    unit_id: booking?.unit_id || '',
    check_in_date: booking?.check_in_date || '',
    check_out_date: booking?.check_out_date || ''
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    
    // Validate unit number
    if (!formData.unit_id.trim()) {
      setFormError('Please enter a unit number')
      return
    }
    
    // Validate that both dates are provided
    if (!formData.check_in_date || !formData.check_out_date) {
      setFormError('Please select both check-in and check-out dates')
      return
    }
    
    // Validate date range
    if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
      setFormError('Check-out date must be after check-in date')
      return
    }
    
    if (booking) {
      onSave({ ...booking, ...formData })
    } else {
      onSave(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {booking ? 'Edit Booking' : 'Add Booking'}
          </h3>
          
          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Number</label>
              <input
                type="text"
                value={formData.unit_id}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_id: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="e.g., 203, 105, Villa A"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter unit number or name (e.g., "203", "Villa 105")
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stay Dates</label>
              <DateRangePicker
                startDate={formData.check_in_date}
                endDate={formData.check_out_date}
                onChange={(startDate, endDate) => {
                  setFormData(prev => ({
                    ...prev,
                    check_in_date: startDate,
                    check_out_date: endDate
                  }))
                }}
                placeholder="Select check-in and check-out dates"
                className="mt-1"
              />
            </div>


            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface BulkBookingFormProps {
  property: Property
  onSave: (bulkData: { bookings: Array<{ unitNumber: string, checkInDate: string, checkOutDate: string }> }) => void
  onCancel: () => void
  saving: boolean
}

interface BookingRow {
  id: string
  unitNumber: string
  checkInDate: string
  checkOutDate: string
}

function BulkBookingForm({ property, onSave, onCancel, saving }: BulkBookingFormProps) {
  const [rows, setRows] = useState<BookingRow[]>([
    { id: '1', unitNumber: '', checkInDate: '', checkOutDate: '' }
  ])

  const addRow = () => {
    const newId = (rows.length + 1).toString()
    setRows(prev => [...prev, { id: newId, unitNumber: '', checkInDate: '', checkOutDate: '' }])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(row => row.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof BookingRow, value: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validBookings = rows.filter(row => 
      row.unitNumber.trim() && row.checkInDate && row.checkOutDate
    )

    if (validBookings.length === 0) {
      alert('Please enter at least one complete booking with unit number and dates')
      return
    }

    // Additional validation for date ranges
    const invalidBookings = validBookings.filter(row => 
      new Date(row.checkOutDate) <= new Date(row.checkInDate)
    )

    if (invalidBookings.length > 0) {
      alert('Check-out date must be after check-in date for all bookings')
      return
    }

    onSave({
      bookings: validBookings.map(row => ({
        unitNumber: row.unitNumber.trim(),
        checkInDate: row.checkInDate,
        checkOutDate: row.checkOutDate
      }))
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[900px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Bulk Add Bookings
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div key={row.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.unitNumber}
                      onChange={(e) => updateRow(row.id, 'unitNumber', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="Unit number"
                    />
                  </div>
                  
                  <div className="w-64">
                    <DateRangePicker
                      startDate={row.checkInDate}
                      endDate={row.checkOutDate}
                      onChange={(startDate, endDate) => {
                        updateRow(row.id, 'checkInDate', startDate)
                        updateRow(row.id, 'checkOutDate', endDate)
                      }}
                      placeholder="Select dates"
                      className="text-sm"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? 'Adding...' : `Add ${rows.filter(r => r.unitNumber.trim() && r.checkInDate && r.checkOutDate).length} Bookings`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
