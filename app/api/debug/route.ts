import { NextResponse } from 'next/server'
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase = getSupabase()
    const supabaseAdmin = getSupabaseAdmin()

    // SELECT mit anon key
    const { data: selectData, error: selectError } = await supabase
      .from('sessions')
      .select('id, participant_code, date')
      .order('created_at', { ascending: false })
      .limit(5)

    // INSERT mit service role key (wie die echten API-Routen)
    const { error: insertError } = await supabaseAdmin
      .from('sessions')
      .insert({
        participant_code: 'TEST',
        date: '2099-01-01',
        sleep: 1,
        stress: 1,
        fatigue: 1,
        soreness: 1,
      })

    // Prüfen ob der TEST-Eintrag wirklich da ist
    const { data: allAfterInsert } = await supabaseAdmin
      .from('sessions')
      .select('id, participant_code')
      .eq('date', '2099-01-01')

    const testRowExists = (allAfterInsert ?? []).some(
      (s: { participant_code: string }) => s.participant_code === 'TEST'
    )

    // Aufräumen
    await supabaseAdmin.from('sessions').delete().eq('participant_code', 'TEST').eq('date', '2099-01-01')

    return NextResponse.json({
      serviceKeyPresent: !!serviceKey,
      anonKeyPresent: !!anonKey,
      supabaseUrl: url?.substring(0, 30) + '...',
      selectError: selectError ? { message: selectError.message } : null,
      totalSessions: selectData?.length ?? 0,
      recentSessions: selectData?.map(s => ({ id: s.id?.substring(0, 8), code: s.participant_code, date: s.date })),
      insertError: insertError ? { message: insertError.message, code: (insertError as { code?: string }).code } : null,
      insertActuallyWorked: testRowExists,  // true = Daten wirklich in DB geschrieben
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
