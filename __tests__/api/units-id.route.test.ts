import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/units/[id]/route'

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

describe('GET /api/units/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null)
    mockAdminClient({})

    const res: Response = await GET(
      new Request('http://localhost/api/units/u1') as any,
      { params: Promise.resolve({ id: 'u1' }) } as any
    )

    expect(res.status).toBe(401)
  })

  it('returns unit when owned by company', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }),
          }
        }
        if (table === 'units') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.single = async () => ({
            data: {
              id: 'u1',
              unit_number: '101',
              name: 'Main Pool',
              unit_type: 'main_pool',
              water_type: 'chlorine',
              volume_litres: 50000,
              billing_entity: 'property',
              customer_id: null,
              notes: null,
              service_frequency: 'weekly',
              properties: { id: 'p1', name: 'Property', company_id: 'co-1' },
            },
            error: null,
          })
          return chain
        }
        if (table === 'bookings') {
          const chain: any = {}
          chain.select = () => chain
          chain.eq = () => chain
          chain.limit = async () => ({ data: [] })
          return chain
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await GET(
      new Request('http://localhost/api/units/u1') as any,
      { params: Promise.resolve({ id: 'u1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.unit).toBeTruthy()
    expect(json.unit.id).toBe('u1')
  })
})
