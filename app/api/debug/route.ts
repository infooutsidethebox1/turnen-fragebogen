import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return NextResponse.json({ error: 'Env vars missing', url: !!url, key: !!key })
    }

    const supabase = getSupabase()

    // Test SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('sessions')
      .select('id, participant_code, date')
      .order('created_at', { ascending: false })
      .limit(3)

    // Test INSERT mit Testdaten
    const { error: insertError } = await supabase
      .from('sessions')
      .insert({
        participant_code: 'TEST',
        date: '2099-01-01',
        sleep: 1,
        stress: 1,
        fatigue: 1,
        soreness: 1,
      })

    // Test-Eintrag löschen falls er erstellt wurde
    await supabase.from('sessions').delete().eq('participant_code', 'TEST').eq('date', '2099-01-01')

    return NextResponse.json({
      envOk: true,
      supabaseUrl: url?.substring(0, 30) + '...',
      selectError: selectError ? { message: selectError.message, code: (selectError as { code?: string }).code } : null,
      selectCount: selectData?.length ?? 0,
      recentSessions: selectData?.map(s => ({ id: s.id?.substring(0, 8), code: s.participant_code, date: s.date })),
      insertError: insertError ? { message: insertError.message, code: (insertError as { code?: string }).code } : null,
      insertSuccess: !insertError,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
