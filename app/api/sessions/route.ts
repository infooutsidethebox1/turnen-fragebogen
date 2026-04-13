import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { participantCode, date, sleep, stress, fatigue, soreness } = body

    if (!participantCode || !date || !sleep || !stress || !fatigue || !soreness) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        participant_code: participantCode,
        date,
        sleep,
        stress,
        fatigue,
        soreness,
      })
      .select('id, hooper_total')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, hooper_total: data.hooper_total })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
