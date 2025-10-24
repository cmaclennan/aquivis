import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/equipment/[id]/failures/summary/route'

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

describe('GET /api/equipment/[id]/failures/summary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null)
    mockAdminClient({})

    const res: Response = await GET(
      new Request('http://localhost/api/equipment/eq1/failures/summary') as any,
      { params: Promise.resolve({ id: 'eq1' }) } as any
    )

    expect(res.status).toBe(401)
  })

  it('returns summary when equipment owned and rpc succeeds', async () => {
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
        throw new Error('unexpected table ' + table)
      },
      rpc(name: string, args: any) {
        if (name === 'get_equipment_failure_summary' && args?.p_equipment_id === 'eq1') {
          return Promise.resolve({ data: { total: 3, last_failure_date: '2025-01-02' }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await GET(
      new Request('http://localhost/api/equipment/eq1/failures/summary') as any,
      { params: Promise.resolve({ id: 'eq1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.summary).toEqual({ total: 3, last_failure_date: '2025-01-02' })
  })
})
