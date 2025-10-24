import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/api-auth'

export async function GET(req: Request) {
  if (process.env.E2E_TEST_MODE !== '1') {
    return NextResponse.json({}, { status: 404 })
  }
  const user = await getRequestUser(req)

  return NextResponse.json({
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    userCompanyId: user?.company_id,
  })
}

