'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: { error: string | null }, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const token = formData.get('cf-turnstile-response') as string

  if (!token) {
    return { error: 'CAPTCHA token missing' }
  }

  // 1. Verify CAPTCHA with Cloudflare
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
    headers: { 'Content-Type': 'application/json' },
  })

  const verifyData = await verifyRes.json()
  
  if (!verifyData.success) {
    return { error: 'CAPTCHA verification failed. Please try again.' }
  }

  // 2. Proceed with Supabase Login
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  redirect('/admin')
}
