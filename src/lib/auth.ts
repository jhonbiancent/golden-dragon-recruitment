import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
// Check both app_metadata and user_metadata for the 'admin' role
  const role = user?.app_metadata?.role || user?.user_metadata?.role;

  if (!user || role !== 'admin') {
    throw new Error('Unauthorized')
  }

  return user
}
