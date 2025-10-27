import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/invite/accept/route'

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

describe('POST /api/invite/accept', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockAuth(null)
    mockAdminClient({})

    const res: Response = await POST(new Request('http://localhost/api/invite/accept', { method: 'POST', body: JSON.stringify({ token: 'tok' }) }))
    expect(res.status).toBe(401)
  })

  it('rejects invalid token', async () => {
    mockAuth({ user: { id: 'user-1' } })
    mockAdminClient({})

    const res: Response = await POST(new Request('http://localhost/api/invite/accept', { method: 'POST', body: JSON.stringify({ token: '' }) }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Invalid invite token/i)
  })

  it('accepts invite and updates profile', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'team_invitations') {
          const selectChain: any = {}
          selectChain.select = () => selectChain
          selectChain.eq = () => selectChain
          selectChain.single = async () => ({ data: { id: 'inv1', company_id: 'co-1', email: 'user@x', role: 'technician', is_revoked: false, accepted_at: null }, error: null })

          const updateChain: any = {}
          updateChain.update = () => updateChain
          updateChain.eq = async () => ({ error: null })

          return { select: selectChain.select, eq: selectChain.eq, single: selectChain.single, update: updateChain.update }
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

    const res: Response = await POST(new Request('http://localhost/api/invite/accept', { method: 'POST', body: JSON.stringify({ token: 'tok' }) }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('already accepted returns ok true and alreadyAccepted', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'team_invitations') {
          const selectChain: any = {}
          selectChain.select = () => selectChain
          selectChain.eq = () => selectChain
          selectChain.single = async () => ({ data: { id: 'inv1', company_id: 'co-1', email: 'user@x', role: 'technician', is_revoked: false, accepted_at: '2025-01-01' }, error: null })
          return { select: selectChain.select, eq: selectChain.eq, single: selectChain.single }
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await POST(new Request('http://localhost/api/invite/accept', { method: 'POST', body: JSON.stringify({ token: 'tok' }) }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.alreadyAccepted).toBe(true)
  })

  it('revoked invite returns 400', async () => {
    mockAuth({ user: { id: 'user-1' } })

    const fakeDb = {
      from(table: string) {
        if (table === 'team_invitations') {
          const selectChain: any = {}
          selectChain.select = () => selectChain
          selectChain.eq = () => selectChain
          selectChain.single = async () => ({ data: { id: 'inv1', company_id: 'co-1', email: 'user@x', role: 'technician', is_revoked: true, accepted_at: null }, error: null })
          return { select: selectChain.select, eq: selectChain.eq, single: selectChain.single }
        }
        throw new Error('unexpected table ' + table)
      },
    }

    mockAdminClient(fakeDb)

    const res: Response = await POST(new Request('http://localhost/api/invite/accept', { method: 'POST', body: JSON.stringify({ token: 'tok' }) }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/revoked/i)
  })
})
