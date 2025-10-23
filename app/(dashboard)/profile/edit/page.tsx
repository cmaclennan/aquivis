'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'

export default function EditProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    (async () => {
      try {
        const res = await fetch('/api/profile')
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to load profile')
        setFirstName(json.profile?.first_name || '')
        setLastName(json.profile?.last_name || '')
        setPhone(json.profile?.phone || '')
      } catch (e: any) {
        setError(e.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    })()
  }, [session])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          phone: phone.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || 'Failed to save profile')
      toast({ title: 'Profile updated', description: 'Your profile has been saved.' })
      router.push('/profile')
    } catch (e: any) {
      setError(e.message || 'Failed to save profile')
      toast({ title: 'Save failed', description: e.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-600">Loading profile…</div>
    )
  }

  return (
    <div className="p-8">
      <Link href="/profile" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Profile</span>
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>

      <div className="max-w-2xl">
        {error && (
          <div className="mb-6 rounded-lg bg-error-light p-4 text-sm text-error">{error}</div>
        )}

        <form onSubmit={handleSave} className="rounded-lg bg-white p-6 shadow space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <Link href="/profile" className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}







