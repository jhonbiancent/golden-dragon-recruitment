import { NextResponse } from 'next/server'
import { adminSupabase } from '@/utils/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'positions') {
      const { data, error } = await adminSupabase
        .from('jobs_position')
        .select('*, category:jobs_category(*)')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (error) throw error
      return NextResponse.json({ data })
    } else {
      const { data, error } = await adminSupabase
        .from('jobs_category')
        .select('*');

      if (error) throw error
      return NextResponse.json({ data })
    }
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    
    if (body.type === 'category') {
        const { name, description, location } = body;
        const { data: newCat, error: createCatError } = await adminSupabase
            .from('jobs_category')
            .insert({ name, description, location })
            .select('id')
            .single()
        if (createCatError) throw createCatError
        return NextResponse.json({ success: true, category: newCat }, { status: 201 })
    }

    const { categoryId, position, salaryRange } = body;
    const { data: job, error: jobError } = await adminSupabase
      .from('jobs_position')
      .insert({
        category_id: categoryId,
        position,
        salary_range: salaryRange,
        status: 'active'
      })
      .select()
      .single()

    if (jobError) throw jobError
    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
    try {
      await requireAdmin()
      const body = await request.json()
      
      if (body.type === 'category') {
          const { id, name, description, location } = body;
          const { data, error } = await adminSupabase
            .from('jobs_category')
            .update({ name, description, location })
            .eq('id', id)
            .select()
            .single();
          if (error) throw error
          return NextResponse.json({ success: true, category: data })
      }
      
      const { id, position, categoryId, salaryRange, status } = body
      const { data: job, error } = await adminSupabase
        .from('jobs_position')
        .update({
          position,
          category_id: categoryId,
          salary_range: salaryRange,
          status
        })
        .eq('id', id)
        .select()
        .single()
  
      if (error) throw error
      return NextResponse.json({ success: true, job })
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }
  }
  
  export async function DELETE(request: Request) {
    try {
      await requireAdmin()
      const { id, type } = await request.json()
      
      if (type === 'category') {
          const { error } = await adminSupabase.from('jobs_category').delete().eq('id', id)
          if (error) throw error
          return NextResponse.json({ success: true })
      }

      const { error } = await adminSupabase
        .from('jobs_position')
        .update({ status: 'closed', deleted_at: new Date().toISOString() })
        .eq('id', id)
  
      if (error) throw error
      return NextResponse.json({ success: true })
    } catch (error: any) {
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
    }
  }
