'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function customerPortalLoginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  // Check rate limit before attempting login
  const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
    p_email: email,
    p_ip_address: null
  })

  if (rateLimitCheck && !rateLimitCheck.allowed) {
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
    await supabase.rpc('log_login_attempt', {
      p_email: email,
      p_ip_address: null,
      p_user_agent: null,
      p_success: true,
      p_failure_reason: null,
      p_user_id: data.user.id
    })

    // Verify user exists in profiles (basic check)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      await supabase.auth.signOut()
      return { error: 'Access denied: Customer account not found' }
    }

    // Redirect to customer portal
    redirect('/customer-portal')
  }

  return { error: 'Login failed' }
}

