import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { participantCode, date, sleep, stress, fatigue, soreness } = body

    if (!participantCode || !date || sleep == null || stress == null || fatigue == null || soreness == null) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Hooper-Total in JS berechnen (DB hat generated column, aber wir verlassen uns nicht auf SELECT nach INSERT)
    const hooper_total = (sleep as number) + (stress as number) + (fatigue as number) + (soreness as number)

    // INSERT ohne .select().single() — vermeidet RLS-Probleme beim nachgelagerten SELECT
    const { error: insertError } = await supabase
      .from('sessions')
      .insert({
        participant_code: participantCode,
        date,
        sleep,
        stress,
        fatigue,
        soreness,
      })

    if (insertError) {
      console.error('Supabase INSERT error:', JSON.stringify(insertError))
      return NextResponse.json({ error: insertError.message, code: insertError.code }, { status: 500 })
    }

    // Alle Sessions laden und in JS die neueste für diesen Code+Datum finden
    const { data: allSessions, error: selectError } = await supabase
      .from('sessions')
      .select('id, participant_code, date, created_at')
      .order('created_at', { ascending: false })

    if (selectError || !allSessions) {
      console.error('SELECT after INSERT error:', selectError)
      // INSERT war erfolgreich — gib hooper_total zurück, aber ohne ID
      // Die ID wird beim nächsten Laden über die participant-API gefunden
      return NextResponse.json({ id: null, hooper_total })
    }

    // Eigene Session in JS finden (neueste für diesen Code+Datum)
    const found = allSessions.find(
      (s: { id: string; participant_code: string; date: string }) =>
        s.participant_code === participantCode && s.date === date
    )

    return NextResponse.json({ id: found?.id ?? null, hooper_total })
  } catch (err) {
    console.error('Unexpected error in /api/sessions:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
