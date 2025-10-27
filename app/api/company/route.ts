import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCompanyById, getCompanyIdForUser, updateCompanyById } from '@/lib/data/company'
import { companyUpdateSchema, safeParse, formatValidationErrors } from '@/lib/validations/schemas'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const companyId = await getCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const data = await getCompanyById(companyId)
    const res = NextResponse.json({ company: data || null })
    res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const t0 = Date.now()
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const updates = await req.json().catch(() => ({}))
    const parsed = safeParse(companyUpdateSchema, updates)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: formatValidationErrors(parsed.errors!) }, { status: 400 })
    }
    const valid = parsed.data
    const companyId = await getCompanyIdForUser(userId)
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

    if (!valid?.id || valid.id !== companyId) {
      return NextResponse.json({ error: 'Invalid company id' }, { status: 400 })
    }

    const payload: any = {
      name: valid.name ?? null,
      business_type: valid.business_type ?? null,
      email: valid.email ?? null,
      phone: valid.phone ?? null,
      address: valid.address ?? null,
      city: valid.city ?? null,
      state: valid.state ?? null,
      postal_code: valid.postal_code ?? null,
    }

    await updateCompanyById(companyId, payload)

    const res = NextResponse.json({ ok: true })
    res.headers.set('Server-Timing', `db;dur=${Date.now() - t0}`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
