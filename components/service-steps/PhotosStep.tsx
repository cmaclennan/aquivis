'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Image as ImageIcon, Plus } from 'lucide-react'
import Image from 'next/image'

interface ServiceData {
  photos: Array<{
    url: string
    caption: string
  }>
  [key: string]: any
}

interface Unit {
  id: string
  name: string
  unit_type: string
  water_type: string
  property: {
    id: string
    name: string
  }
}

interface Props {
  serviceData: ServiceData
  updateServiceData: (updates: Partial<ServiceData>) => void
  unit: Unit
}

const PHOTO_CATEGORIES = [
  { id: 'water_quality', name: 'Water Quality', description: 'Clear water, proper circulation' },
  { id: 'equipment', name: 'Equipment', description: 'Pump, filter, heater status' },
  { id: 'maintenance', name: 'Maintenance', description: 'Cleaning, repairs performed' },
  { id: 'safety', name: 'Safety', description: 'Safety equipment, signage' },
  { id: 'issues', name: 'Issues', description: 'Problems, damage, concerns' },
  { id: 'general', name: 'General', description: 'Overall condition, area' }
]

export default function PhotosStep({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState(serviceData.photos)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSpa = unit.unit_type.includes('spa')
  const isPool = unit.unit_type.includes('pool')

  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    
    try {
      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll simulate the upload process
      const newPhotos = Array.from(files).map((file, index) => ({
        url: URL.createObjectURL(file), // Temporary URL for demo
        caption: `Photo ${localData.length + index + 1}`
      }))

      const updated = [...localData, ...newPhotos]
      setLocalData(updated)
      updateServiceData({ photos: updated })
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const removePhoto = (index: number) => {
    const updated = localData.filter((_, i) => i !== index)
    setLocalData(updated)
    updateServiceData({ photos: updated })
  }

  const updateCaption = (index: number, caption: string) => {
    const updated = localData.map((photo, i) => 
      i === index ? { ...photo, caption } : photo
    )
    setLocalData(updated)
    updateServiceData({ photos: updated })
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Photos</h2>
        <p className="text-gray-600">
          Document the service with photos for {unit.name}
        </p>
        {isSpa && (
          <div className="mt-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-sm font-medium text-purple-900">
                Spa Service - Focus on spa-specific documentation
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Photo Categories Guide */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Photo Categories</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {PHOTO_CATEGORIES.map((category) => (
            <div key={category.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <h4 className="font-medium text-gray-900 text-sm">{category.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{category.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          onClick={openFileDialog}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary hover:bg-primary-50 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Upload Photos</h3>
              <p className="text-sm text-gray-600">
                Click to select photos or drag and drop
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Upload className="h-4 w-4" />
              <span>Supports JPG, PNG, HEIC up to 10MB each</span>
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Photos Grid */}
      {localData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Uploaded Photos ({localData.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localData.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                  <Image
                    src={photo.url}
                    alt={`Service photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* Caption Input */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => updateCaption(index, e.target.value)}
                    placeholder="Add caption..."
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm text-blue-700">Uploading photos...</span>
          </div>
        </div>
      )}

      {/* Photo Tips */}
      <div className="mb-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Photo Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Take clear, well-lit photos</li>
          <li>• Include water quality shots (clear water, proper circulation)</li>
          <li>• Document any issues or concerns</li>
          <li>• Show equipment status and maintenance performed</li>
          <li>• Include safety equipment and signage</li>
        </ul>
      </div>

      {/* Skip Option */}
      <div className="mt-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="skipPhotos"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="skipPhotos" className="text-sm text-gray-700">
            Skip photos (no documentation needed)
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          You can still complete the service without photos
        </p>
      </div>
    </div>
  )
}








