import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

    // Alle Sessions zählen (nicht nur limit 5)
    const { data: allSessions, error: sessionsError } = await admin
      .from('sessions')
      .select('id, participant_code, date, created_at')
      .order('created_at', { ascending: false })

    // RPE Entries zählen
    const { data: allRpe, error: rpeError } = await admin
      .from('rpe_entries')
      .select('id, session_id, apparatus, rpe')

    // INSERT Test — OHNE löschen, damit wir im SQL Editor prüfen können
    const testCode = 'PROBE_TEST'
    await admin.from('sessions').delete().eq('participant_code', testCode) // vorher aufräumen
    const { error: probeError } = await admin
      .from('sessions')
      .insert({ participant_code: testCode, date: '2099-01-01', sleep: 1, stress: 1, fatigue: 1, soreness: 1 })
    const { data: probeCheck } = await admin.from('sessions').select('id').eq('participant_code', testCode)

    return NextResponse.json({
      url: url?.substring(0, 50) + '...',
      sessionsError: sessionsError?.message ?? null,
      rpeError: rpeError?.message ?? null,
      totalSessions: allSessions?.length ?? 0,
      totalRpeEntries: allRpe?.length ?? 0,
      probe: {
        error: probeError?.message ?? null,
        inserted: (probeCheck?.length ?? 0) > 0,
        instruction: 'Jetzt im Supabase SQL Editor prüfen: SELECT * FROM sessions WHERE participant_code = \'PROBE_TEST\';',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
