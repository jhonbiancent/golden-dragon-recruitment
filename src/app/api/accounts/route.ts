import { NextResponse } from 'next/server'
import { adminSupabase } from '@/utils/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const { data: { users }, error } = await adminSupabase.auth.admin.listUsers()
    if (error) throw error
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized or error' }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const { email, password, name, role } = await request.json()

    // 1. Create User
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
      app_metadata: { role }
    })
    if (createError) throw createError

    // 2. Start MFA Enrollment for the user
    // We need to sign in as the user to start enrollment. 
    // Using a separate client to not mess with the admin's session.
    const { data: sessionData, error: signInError } = await adminSupabase.auth.signInWithPassword({
        email,
        password
    })
    if(signInError) throw signInError

    const userClient = adminSupabase // This is service role so it acts as the user
    
    // Enroll MFA
    const { data: enrollment, error: enrollError } = await userClient.auth.mfa.enroll({
        factorType: 'totp'
    })
    if(enrollError) throw enrollError

    return NextResponse.json({ 
        userId: newUser.user.id,
        enrollmentId: enrollment.id,
        qrCode: enrollment.totp.qr_code 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing account ID' }, { status: 400 })

    const { error } = await adminSupabase.auth.admin.deleteUser(id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
