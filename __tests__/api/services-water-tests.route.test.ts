import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/services/[id]/water-tests/route'

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

describe('POST /api/services/[id]/water-tests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null)
    mockAdminClient({})

    const res: Response = await POST(
      new Request('http://localhost/api/services/s1/water-tests', {
        method: 'POST',
        body: JSON.stringify({ ph: 7.4 }),
      }) as any,
      { params: Promise.resolve({ id: 's1' }) } as any
    )

    expect(res.status).toBe(401)
  })

  it('creates a water test when service is owned by the company', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }),
          }
        }
        if (table === 'services') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.single = async () => ({ data: { id: 's1', units: { properties: { company_id: 'co-1' } } } })
          return chain
        }
        if (table === 'water_tests') {
          const chain: any = {}
          chain.insert = () => chain
          chain.select = () => chain
          chain.single = async () => ({ data: { id: 'wt1', service_id: 's1', ph: 7.4 }, error: null })
          return chain
        }
        throw new Error('unexpected table: ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await POST(
      new Request('http://localhost/api/services/s1/water-tests', {
        method: 'POST',
        body: JSON.stringify({ ph: 7.4 }),
      }) as any,
      { params: Promise.resolve({ id: 's1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.waterTest).toBeTruthy()
    expect(json.waterTest.id).toBe('wt1')
  })
})
