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

    // INSERT Test mit SERVICE ROLE KEY
    const testCode = `T${Date.now() % 100000000}`
    const { error: adminInsertError } = await admin
      .from('sessions')
      .insert({ participant_code: testCode, date: '2099-01-01', sleep: 1, stress: 1, fatigue: 1, soreness: 1 })
    const { data: adminCheck } = await admin.from('sessions').select('id').eq('participant_code', testCode)
    await admin.from('sessions').delete().eq('participant_code', testCode)

    return NextResponse.json({
      url: url?.substring(0, 40) + '...',
      sessionsError: sessionsError?.message ?? null,
      rpeError: rpeError?.message ?? null,
      totalSessions: allSessions?.length ?? 0,
      totalRpeEntries: allRpe?.length ?? 0,
      recentSessions: allSessions?.slice(0, 10).map(s => ({
        id: s.id?.substring(0, 8),
        code: s.participant_code,
        date: s.date,
        created_at: s.created_at,
      })),
      adminInsert: {
        error: adminInsertError?.message ?? null,
        worked: (adminCheck?.length ?? 0) > 0,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
