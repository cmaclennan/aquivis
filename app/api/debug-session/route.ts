import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { headers, cookies } from 'next/headers'

export async function GET(request: Request) {
  const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  const token = await getToken({ 
    req: request as any, 
    secret: SECRET 
  })

  const headersList = await headers()
  const cookieStore = await cookies()
  
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(c => 
    c.name.includes('auth') || c.name.includes('next-auth')
  )

  return NextResponse.json({
    hasToken: !!token,
    token: token ? {
      id: token.id,
      email: token.email,
      role: token.role,
      company_id: token.company_id,
    } : null,
    headers: {
      'x-user-id': headersList.get('x-user-id'),
      'x-user-email': headersList.get('x-user-email'),
      'x-user-role': headersList.get('x-user-role'),
      'x-user-company-id': headersList.get('x-user-company-id'),
    },
    cookies: authCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0,
    })),
    env: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasAuthUrl: !!process.env.AUTH_URL,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    }
  })
}

