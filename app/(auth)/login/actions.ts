'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string || '/dashboard'

  console.log('[LoginAction] Starting login for:', email)
  const supabase = await createClient()

  // Check rate limit before attempting login
  const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
    p_email: email,
    p_ip_address: null // Could be added from request headers
  })

  if (rateLimitCheck && !rateLimitCheck.allowed) {
    console.log('[LoginAction] Rate limit exceeded for:', email)
    // Log failed attempt due to rate limit
    await supabase.rpc('log_login_attempt', {
      p_email: email,
      p_ip_address: null,
      p_user_agent: null,
      p_success: false,
      p_failure_reason: rateLimitCheck.reason,
      p_user_id: null
    })

    return { error: rateLimitCheck.message || 'Too many login attempts. Please try again later.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('[LoginAction] SignIn response - Error:', error?.message, 'User:', data?.user?.email)

  if (error) {
    console.log('[LoginAction] Login failed:', error.message)
    // Log failed login attempt
    await supabase.rpc('log_login_attempt', {
      p_email: email,
      p_ip_address: null,
      p_user_agent: null,
      p_success: false,
      p_failure_reason: error.message,
      p_user_id: null
    })

    return { error: error.message }
  }

  if (data.user) {
    console.log('[LoginAction] Login successful for:', data.user.email, 'Redirecting to:', redirectTo)
    // Log successful login
    await supabase.rpc('log_login_attempt', {
      p_email: email,
      p_ip_address: null,
      p_user_agent: null,
      p_success: true,
      p_failure_reason: null,
      p_user_id: data.user.id
    })

    // Check if user has a company profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      console.log('[LoginAction] No profile found, redirecting to onboarding')
      redirect('/onboarding')
    } else {
      console.log('[LoginAction] Profile found, redirecting to:', redirectTo)
      redirect(redirectTo)
    }
  }

  console.log('[LoginAction] Unexpected: no user and no error')
  return { error: 'Login failed' }
}

