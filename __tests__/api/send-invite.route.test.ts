import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/send-invite/route'

vi.mock('resend', () => {
  class Resend {
    public emails = { send: vi.fn().mockResolvedValue({ error: null }) }
    constructor(_apiKey?: string) {}
  }
  return { Resend }
})

describe('POST /api/send-invite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (process.env as any).RESEND_API_KEY
  })

  it('returns 500 when API key not configured', async () => {
    const res: Response = await POST(new Request('http://localhost/api/send-invite', {
      method: 'POST',
      body: JSON.stringify({ to: 'user@example.com', inviteLink: 'https://x', role: 'tech' })
    }) as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toMatch(/Resend API key not configured/i)
  })

  it('returns 400 when missing required fields', async () => {
    ;(process.env as any).RESEND_API_KEY = 'test'
    const res: Response = await POST(new Request('http://localhost/api/send-invite', {
      method: 'POST',
      body: JSON.stringify({ to: 'user@example.com' })
    }) as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Missing to or inviteLink/i)
  })

  it('sends invite email successfully', async () => {
    ;(process.env as any).RESEND_API_KEY = 'test'
    const res: Response = await POST(new Request('http://localhost/api/send-invite', {
      method: 'POST',
      body: JSON.stringify({ to: 'user@example.com', inviteLink: 'https://x', role: 'tech', firstName: 'A', lastName: 'B' })
    }) as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
