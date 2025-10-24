import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from '@/app/api/property-rules/[id]/route'

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

describe('/api/property-rules/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PATCH returns 401 when unauthenticated', async () => {
    mockAuth(null)
    mockAdminClient({})

    const res: Response = await PATCH(
      new Request('http://localhost/api/property-rules/r1', { method: 'PATCH', body: JSON.stringify({ is_active: false }) }) as any,
      { params: Promise.resolve({ id: 'r1' }) } as any
    )

    expect(res.status).toBe(401)
  })

  it('DELETE returns ok when owned by company', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { company_id: 'co-1' } }) }) }),
          }
        }
        if (table === 'property_scheduling_rules') {
          const selChain: any = {}
          selChain.select = () => selChain
          selChain.eq = () => selChain
          selChain.single = async () => ({ data: { id: 'r1', properties: { company_id: 'co-1' } } })

          const delChain: any = {}
          delChain.delete = () => delChain
          delChain.eq = async () => ({ error: null })

          return {
            select: selChain.select,
            eq: selChain.eq,
            single: selChain.single,
            delete: delChain.delete,
          }
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await DELETE(
      new Request('http://localhost/api/property-rules/r1', { method: 'DELETE' }) as any,
      { params: Promise.resolve({ id: 'r1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
