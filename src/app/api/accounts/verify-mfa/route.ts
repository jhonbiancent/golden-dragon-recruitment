import { NextResponse } from 'next/server'
import { adminSupabase } from '@/utils/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const { email, password, enrollmentId, code } = await request.json()

    // Sign in as the user to verify MFA
    await adminSupabase.auth.signInWithPassword({ email, password })

    // Verify MFA
    const { data: challenge, error: challengeError } = await adminSupabase.auth.mfa.challenge({
        factorId: enrollmentId
    })
    if(challengeError) throw challengeError

    const { error: verifyError } = await adminSupabase.auth.mfa.verify({
        factorId: enrollmentId,
        challengeId: challenge.id,
        code
    })
    if(verifyError) throw verifyError

    // Sign out to clear the session
    await adminSupabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
