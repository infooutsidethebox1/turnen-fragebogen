import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase env vars fehlen' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { participantCode, date, sleep, stress, fatigue, soreness } = body

    if (!participantCode || !date || sleep == null || stress == null || fatigue == null || soreness == null) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
    }

    // Frischer Client (kein Singleton) — gleiche Methode wie der funktionierende test-insert
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

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
