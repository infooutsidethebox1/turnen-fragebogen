import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY fehlt' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { participantCode, date, sleep, stress, fatigue, soreness } = body

    if (!participantCode || !date || sleep == null || stress == null || fatigue == null || soreness == null) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

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

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Kein Ergebnis nach INSERT', code: error?.code },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: data.id, hooper_total: data.hooper_total })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
