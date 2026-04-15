import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { session_rpe } = body

    if (session_rpe === undefined || session_rpe === null) {
      return NextResponse.json({ error: 'session_rpe fehlt' }, { status: 400 })
    }

    if (typeof session_rpe !== 'number' || session_rpe < 0 || session_rpe > 10) {
      return NextResponse.json(
        { error: 'session_rpe muss zwischen 0 und 10 liegen' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('sessions')
      .update({ session_rpe })
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
