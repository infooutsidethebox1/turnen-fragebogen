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

  const { error: insertError } = await supabase
    .from('sessions')
    .insert({ participant_code: participantCode, date, sleep, stress, fatigue, soreness })

  if (insertError) {
    return NextResponse.json({ error: insertError.message, code: insertError.code }, { status: 500 })
  }

  // Separate SELECT nach INSERT (vermeidet RLS-Probleme mit RETURNING)
  const { data, error: selectError } = await supabase
    .from('sessions')
    .select('id, hooper_total')
    .eq('participant_code', participantCode)
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (selectError || !data) {
    // INSERT war erfolgreich, aber SELECT schlug fehl — trotzdem OK
    const hooper_total = (sleep as number) + (stress as number) + (fatigue as number) + (soreness as number)
    return NextResponse.json({ id: null, hooper_total })
  }

  return NextResponse.json({ id: data.id, hooper_total: data.hooper_total })
}
