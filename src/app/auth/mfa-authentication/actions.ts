'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function verifyMfaAction(prevState: { error: string | null }, formData: FormData) {
  const code = formData.get('code') as string
  const supabase = await createClient()

  // 1. Get the factor ID of the verified MFA factor
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const factor = factors?.all.find(f => f.status === 'verified')

  if (!factor) {
    return { error: 'No MFA factor found. Please contact admin.' }
  }

  // 2. Challenge the factor
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  })
  if (challengeError) {
    return { error: 'MFA challenge failed' }
  }

  // 3. Verify the code
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  })

  if (verifyError) {
    return { error: 'Invalid verification code' }
  }

  redirect('/admin')
}
