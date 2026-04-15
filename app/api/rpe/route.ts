import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const VALID_APPARATUS = ['Boden', 'Ringe', 'Reck', 'Barren', 'Sprung']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, apparatus, rpe } = body

    if (!sessionId || !apparatus || rpe === undefined || rpe === null) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
    }

    if (!VALID_APPARATUS.includes(apparatus)) {
      return NextResponse.json({ error: 'Ungültiges Gerät' }, { status: 400 })
    }

    if (typeof rpe !== 'number' || rpe < 0 || rpe > 10) {
      return NextResponse.json({ error: 'RPE muss zwischen 0 und 10 liegen' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('rpe_entries')
      .upsert(
        { session_id: sessionId, apparatus, rpe },
        { onConflict: 'session_id,apparatus' }
      )
      .select('id')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
