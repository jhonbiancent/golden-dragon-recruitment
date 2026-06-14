import { NextResponse } from 'next/server'
import { adminSupabase } from '@/utils/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const { data, error } = await adminSupabase
      .from('jobs_category')
      .select('*');

    if (error) throw error
    return NextResponse.json({ categories: data })
  } catch (error: any) {
    console.error("API Error fetching categories:", error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
