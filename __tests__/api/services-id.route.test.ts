import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/services/[id]/route'

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

describe('GET /api/services/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth(null)
    mockAdminClient({})

    const res: Response = await GET(
      new Request('http://localhost/api/services/svc1') as any,
      { params: Promise.resolve({ id: 'svc1' }) } as any
    )

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/Not authenticated/i)
  })

  it('returns service for authenticated user with company', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { company_id: 'co-1' } }),
              }),
            }),
          }
        }
        if (table === 'services') {
          const chain = {
            select: () => chain,
            eq: () => chain,
            single: async () => ({ data: { id: 'svc1' }, error: null }),
          }
          return chain
        }
        throw new Error('unexpected table: ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await GET(
      new Request('http://localhost/api/services/svc1') as any,
      { params: Promise.resolve({ id: 'svc1' }) } as any
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.service).toBeTruthy()
    expect(json.service.id).toBe('svc1')
  })
})
