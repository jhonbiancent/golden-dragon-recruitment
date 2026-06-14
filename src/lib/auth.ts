import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  return user
}
