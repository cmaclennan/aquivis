'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { reportError } from '@/lib/sentry'

interface ServicesClientProps {
  serviceId: string
}

export default function ServicesClient({ serviceId }: ServicesClientProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDeleteService = async () => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error

      // Refresh the page to show updated list
      router.refresh()
    } catch (err: any) {
      reportError(err, { action: 'delete_service', serviceId })
      alert('Failed to delete service: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center space-x-2 ml-4">
      <Link
        href={`/services/${serviceId}/edit`}
        className="p-2 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
        title="Edit Service"
      >
        <Edit className="h-4 w-4" />
      </Link>
      <button
        onClick={handleDeleteService}
        disabled={isDeleting}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Delete Service"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

