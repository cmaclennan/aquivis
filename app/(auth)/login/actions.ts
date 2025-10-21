'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string || '/dashboard'

  const supabase = await createClient()

  // Check rate limit before attempting login
  const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
    p_email: email,
    p_ip_address: null
  })

  if (rateLimitCheck && !rateLimitCheck.allowed) {
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

  if (error) {
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
      // No profile - redirect to onboarding
      return { success: true, redirectTo: '/onboarding' }
    } else {
      // Profile exists - redirect to requested page or dashboard
      return { success: true, redirectTo }
    }
  }

  return { error: 'Login failed' }
}

