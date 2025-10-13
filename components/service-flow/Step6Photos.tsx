'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Image as ImageIcon, Plus } from 'lucide-react'

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
  { value: 'before_service', label: 'Before Service' },
  { value: 'water_test', label: 'Water Test Results' },
  { value: 'chemical_addition', label: 'Chemical Addition' },
  { value: 'maintenance', label: 'Maintenance Work' },
  { value: 'equipment', label: 'Equipment Status' },
  { value: 'after_service', label: 'After Service' },
  { value: 'issues', label: 'Issues Found' },
  { value: 'other', label: 'Other' }
]

export default function Step6Photos({ serviceData, updateServiceData, unit }: Props) {
  const [localData, setLocalData] = useState({
    photos: serviceData.photos || []
  })
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (updates: any) => {
    setLocalData(prev => ({ ...prev, ...updates }))
    updateServiceData({ photos: localData.photos })
  }

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    
    try {
      const newPhotos = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image. Please select image files only.`)
          continue
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Please select files smaller than 10MB.`)
          continue
        }
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        
        newPhotos.push({
          url: previewUrl,
          caption: '',
          file: file // Store file for actual upload
        })
      }
      
      const updatedPhotos = [...localData.photos, ...newPhotos]
      setLocalData(prev => ({ ...prev, photos: updatedPhotos }))
      updateServiceData({ photos: updatedPhotos })
      
    } catch (error) {
      console.error('Error processing files:', error)
      alert('Error processing files. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = localData.photos.filter((_, i) => i !== index)
    setLocalData(prev => ({ ...prev, photos: updatedPhotos }))
    updateServiceData({ photos: updatedPhotos })
  }

  const updatePhotoCaption = (index: number, caption: string) => {
    const updatedPhotos = [...localData.photos]
    updatedPhotos[index] = { ...updatedPhotos[index], caption }
    setLocalData(prev => ({ ...prev, photos: updatedPhotos }))
    updateServiceData({ photos: updatedPhotos })
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Photos</h2>
        <p className="text-gray-600">
          Add photos documenting the service for {unit.name}
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <div
          onClick={openFileDialog}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary hover:bg-primary-50 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center space-y-4">
            {isUploading ? (
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">
                {isUploading ? 'Processing Photos...' : 'Upload Service Photos'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Click to select photos or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 10MB each
              </p>
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Photo Grid */}
      {localData.photos.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Uploaded Photos ({localData.photos.length})</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localData.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={photo.url}
                    alt={`Service photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* Caption Input */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => updatePhotoCaption(index, e.target.value)}
                    placeholder="Add caption..."
                    className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <ImageIcon className="h-6 w-6" />
          </div>
          <p>No photos uploaded yet</p>
          <p className="text-sm">Click the upload area above to add photos</p>
        </div>
      )}

      {/* Photo Categories Suggestion */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Suggested Photo Types</h4>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PHOTO_CATEGORIES.map((category) => (
            <div
              key={category.value}
              className="p-3 rounded-lg border border-gray-200 text-center hover:border-primary hover:bg-primary-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{category.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Skip Option */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Photos are optional but recommended for service documentation. You can skip this step if no photos were taken.
        </p>
      </div>
    </div>
  )
}








