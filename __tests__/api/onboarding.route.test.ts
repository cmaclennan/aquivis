import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/onboarding/route'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import * as Auth from '@/lib/auth'
import * as Admin from '@/lib/supabase/admin'

const mockAuth = (val: any) => {
  ;(Auth.auth as any).mockResolvedValue(val)
}

const mockAdminClient = (impl: any) => {
  ;(Admin.createAdminClient as any).mockReturnValue(impl)
}

describe('POST /api/onboarding', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null)
    mockAdminClient({})

    const res: Response = await POST(new Request('http://localhost/api/onboarding', { method: 'POST', body: JSON.stringify({ name: 'Co' }) }))
    expect(res.status).toBe(401)
  })

  it('validates company name', async () => {
    mockAuth({ user: { id: 'user-1' } })
    mockAdminClient({})

    const res: Response = await POST(new Request('http://localhost/api/onboarding', { method: 'POST', body: JSON.stringify({ name: '' }) }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Company name is required/i)
  })

  it('creates company and updates profile', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'companies') {
          const chain: any = {}
          chain.insert = () => chain
          chain.select = () => chain
          chain.single = async () => ({ data: { id: 'co-1' }, error: null })
          return chain
        }
        if (table === 'profiles') {
          const chain: any = {}
          chain.update = () => chain
          chain.eq = async () => ({ error: null })
          return chain
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await POST(new Request('http://localhost/api/onboarding', { method: 'POST', body: JSON.stringify({ name: 'Acme', businessType: 'both', phone: '123' }) }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.companyId).toBe('co-1')
  })
})
