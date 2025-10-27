import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/equipment/[id]/failures/route'

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

describe('/api/equipment/[id]/failures', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns failures when equipment owned', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }),
          }
        }
        if (table === 'equipment') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.single = async () => ({ data: { id: 'eq1', properties: { company_id: 'co-1' } } })
          return chain
        }
        if (table === 'equipment_failures') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.order = async () => ({ data: [{ id: 'f1' }], error: null })
          return chain
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await GET(
      new Request('http://localhost/api/equipment/eq1/failures') as any,
      { params: Promise.resolve({ id: 'eq1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.failures)).toBe(true)
    expect(json.failures[0].id).toBe('f1')
  })

  it('POST creates failure when equipment owned', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }),
          }
        }
        if (table === 'equipment') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.single = async () => ({ data: { id: 'eq1', properties: { company_id: 'co-1' } } })
          return chain
        }
        if (table === 'equipment_failures') {
          const chain: any = {}
          chain.insert = () => chain
          chain.select = () => chain
          chain.single = async () => ({ data: { id: 'f2', equipment_id: 'eq1' }, error: null })
          return chain
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await POST(
      new Request('http://localhost/api/equipment/eq1/failures', { method: 'POST', body: JSON.stringify({ failure_date: '2025-01-01' }) }) as any,
      { params: Promise.resolve({ id: 'eq1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.failure.id).toBe('f2')
  })
})
