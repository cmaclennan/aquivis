import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/company/route'

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

describe('/api/company', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth(null)
    mockAdminClient({})

    const res: Response = await GET()
    expect(res.status).toBe(401)
  })

  it('GET returns company for authenticated user with company', async () => {
    mockAuth({ user: { id: 'u-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }),
          }
        }
        if (table === 'companies') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.single = async () => ({ data: { id: 'co-1', name: 'Acme Pools' }, error: null })
          return chain
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.company.id).toBe('co-1')
    expect(json.company.name).toBe('Acme Pools')
  })

  it('PATCH updates company when id matches user company', async () => {
    mockAuth({ user: { id: 'u-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }),
          }
        }
        if (table === 'companies') {
          const chain: any = {}
          chain.update = () => chain
          chain.eq = async () => ({ error: null })
          return chain
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const body = { id: 'co-1', name: 'Updated Name' }
    const res: Response = await PATCH(new Request('http://localhost/api/company', { method: 'PATCH', body: JSON.stringify(body) }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('PATCH rejects when ids do not match', async () => {
    mockAuth({ user: { id: 'u-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }),
          }
        }
        return { } as any
      },
    }

    mockAdminClient(fakeDb)

    const body = { id: 'co-2', name: 'Bad Name' }
    const res: Response = await PATCH(new Request('http://localhost/api/company', { method: 'PATCH', body: JSON.stringify(body) }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Invalid company id/i)
  })
})
