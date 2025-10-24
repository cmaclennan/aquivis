import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/equipment/[id]/maintenance/route'

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

describe('/api/equipment/[id]/maintenance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns logs when equipment owned', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return { select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }) }
        }
        if (table === 'equipment') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.single = async () => ({ data: { id: 'eq1', properties: { company_id: 'co-1' } } })
          return chain
        }
        if (table === 'equipment_maintenance_logs') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.order = async () => ({ data: [{ id: 'm1' }], error: null })
          return chain
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await GET(
      new Request('http://localhost/api/equipment/eq1/maintenance') as any,
      { params: Promise.resolve({ id: 'eq1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.logs[0].id).toBe('m1')
  })

  it('POST creates log when equipment owned', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return { select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }) }
        }
        if (table === 'equipment') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.single = async () => ({ data: { id: 'eq1', properties: { company_id: 'co-1' } } })
          return chain
        }
        if (table === 'equipment_maintenance_logs') {
          const chain: any = {}
          chain.insert = () => chain
          chain.select = () => chain
          chain.single = async () => ({ data: { id: 'm2', equipment_id: 'eq1' }, error: null })
          return chain
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await POST(
      new Request('http://localhost/api/equipment/eq1/maintenance', {
        method: 'POST',
        body: JSON.stringify({ maintenance_date: '2025-01-01', actions: 'Lube pump' })
      }) as any,
      { params: Promise.resolve({ id: 'eq1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.log.id).toBe('m2')
  })
})
