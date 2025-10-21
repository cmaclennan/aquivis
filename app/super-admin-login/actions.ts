'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

export async function superAdminLoginAction(formData: FormData) {
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

  // Sign in with email and password
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
    // Check if user is super admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      return { error: profileError.message }
    }

    if (profile?.role !== 'super_admin') {
      // Log failed attempt (not super admin)
      await supabase.rpc('log_login_attempt', {
        p_email: email,
        p_ip_address: null,
        p_user_agent: null,
        p_success: false,
        p_failure_reason: 'Not a super admin',
        p_user_id: data.user.id
      })

      // Sign out if not super admin
      await supabase.auth.signOut()
      return { error: 'Access denied: Super admin privileges required' }
    }

    // Log successful login
    await supabase.rpc('log_login_attempt', {
      p_email: email,
      p_ip_address: null,
      p_user_agent: null,
      p_success: true,
      p_failure_reason: null,
      p_user_id: data.user.id
    })

    // Log super admin login
    await supabase.rpc('log_super_admin_action', {
      p_action_type: 'login',
      p_table_name: null,
      p_record_id: null,
      p_company_id: null,
      p_details: { email, login_method: 'password' }
    })

    // Create session record for tracking
    const sessionExpiry = new Date()
    sessionExpiry.setHours(sessionExpiry.getHours() + 4) // 4 hour session

    try {
      await supabase
        .from('super_admin_sessions')
        .insert({
          user_id: data.user.id,
          email: email,
          expires_at: sessionExpiry.toISOString(),
          ip_address: null, // Could be added from request headers
          user_agent: null  // Could be added from request headers
        })
    } catch (sessionError) {
      // Session table might not exist yet, continue anyway
      logger.warn('Failed to create session record', sessionError)
    }

    // Redirect to super admin dashboard
    redirect('/super-admin')
  }

  return { error: 'Login failed' }
}

