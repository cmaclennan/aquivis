import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    const businessType = (body?.businessType || 'both') as 'residential' | 'commercial' | 'both'
    const phone = String(body?.phone || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const supabase = createAdminClient() as any

    const { data: company, error: companyError } = await supabase
      .from('companies' as any)
      .insert({
        name,
        business_type: businessType,
        phone,
        timezone: 'Australia/Brisbane',
        unit_system: 'metric',
        date_format: 'DD/MM/YYYY',
        currency: 'AUD',
        compliance_jurisdiction: 'QLD',
      } as any)
      .select('id' as any)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: companyError?.message || 'Failed to create company' }, { status: 500 })
    }

    const { error: profileError } = await supabase
      .from('profiles' as any)
      .update({ company_id: (company as any).id } as any)
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message || 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, companyId: (company as any).id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
