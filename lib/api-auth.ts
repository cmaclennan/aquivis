import { auth as realAuth } from '@/lib/auth'

export type RequestUser = {
  id: string
  email?: string
  role?: string
  company_id?: string | null
}

function fromHeaders(h: any | null): RequestUser | null {
  if (!h) return null
  const id = h.get('x-user-id') || undefined
  if (!id) return null
  return {
    id,
    email: h.get('x-user-email') || undefined,
    role: h.get('x-user-role') || undefined,
    company_id: (h.get('x-user-company-id') as string) || null,
  }
}

function fromCookieHeader(h: any | null): RequestUser | null {
  if (!h) return null
  const cookieHeader = h.get('cookie') || ''
  const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('e2e-auth='))
  if (!match) return null
  const raw = decodeURIComponent(match.slice('e2e-auth='.length))
  try {
    const payload = JSON.parse(raw) as RequestUser
    if (payload && payload.id) return payload
  } catch {}
  return null
}

export async function getRequestUser(req: Request): Promise<RequestUser | null> {
  // 1) Prefer explicit headers set by middleware or client
  const user = fromHeaders(req.headers as any)
  if (user) return user

  // 2) Fallback to e2e-auth cookie in raw Cookie header
  const fromCookie = fromCookieHeader(req.headers as any)
  if (fromCookie) return fromCookie

  // 3) Fallback to real NextAuth session
  const session = await realAuth()
  return (session?.user as any) || null
}
