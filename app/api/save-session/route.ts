import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json({ error: `Env fehlt: url=${!!url} key=${!!serviceKey}` }, { status: 500 })
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const body = await req.json()
  const { participantCode, date, sleep, stress, fatigue, soreness } = body

  if (!participantCode || !date || sleep == null || stress == null || fatigue == null || soreness == null) {
    return NextResponse.json({ error: `Fehlende Felder: ${JSON.stringify(body)}` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({ participant_code: participantCode, date, sleep, stress, fatigue, soreness })
    .select('id, hooper_total')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Kein Ergebnis', code: error?.code }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, hooper_total: data.hooper_total })
}
