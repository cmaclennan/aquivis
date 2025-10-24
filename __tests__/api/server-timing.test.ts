import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))

vi.mock('@/lib/data/services', () => ({
  resolveCompanyIdForUser: vi.fn().mockResolvedValue('co-1'),
}))

vi.mock('@/lib/data/units', () => ({
  listUnitsForCompany: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/data/templates', () => ({
  listTemplatesForCompany: vi.fn().mockResolvedValue([]),
}))

import { GET as GET_UNITS } from '@/app/api/units/route'
import { GET as GET_TEMPLATES } from '@/app/api/templates/route'

describe('Server-Timing headers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets Server-Timing on GET /api/units', async () => {
    const res: Response = await GET_UNITS(new Request('http://localhost/api/units'))
    expect(res.status).toBe(200)
    const header = res.headers.get('Server-Timing')
    expect(header).toBeTruthy()
    expect(header).toMatch(/db;dur=\d+/)
  })

  it('sets Server-Timing on GET /api/templates', async () => {
    const res: Response = await GET_TEMPLATES(new Request('http://localhost/api/templates'))
    expect(res.status).toBe(200)
    const header = res.headers.get('Server-Timing')
    expect(header).toBeTruthy()
    expect(header).toMatch(/db;dur=\d+/)
  })
})
