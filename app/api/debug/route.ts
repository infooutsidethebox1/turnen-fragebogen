import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const anon = createClient(url, anonKey, { auth: { persistSession: false } })
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

    // SELECT mit admin key
    const { data: allSessions } = await admin
      .from('sessions')
      .select('id, participant_code, date')
      .order('created_at', { ascending: false })
      .limit(5)

    // INSERT Test mit SERVICE ROLE KEY
    const { error: adminInsertError } = await admin
      .from('sessions')
      .insert({ participant_code: 'TEST_ADMIN', date: '2099-01-01', sleep: 1, stress: 1, fatigue: 1, soreness: 1 })
    const { data: adminCheck } = await admin.from('sessions').select('id').eq('participant_code', 'TEST_ADMIN')
    await admin.from('sessions').delete().eq('participant_code', 'TEST_ADMIN')

    // INSERT Test mit ANON KEY
    const { error: anonInsertError } = await anon
      .from('sessions')
      .insert({ participant_code: 'TEST_ANON', date: '2099-01-02', sleep: 1, stress: 1, fatigue: 1, soreness: 1 })
    const { data: anonCheck } = await admin.from('sessions').select('id').eq('participant_code', 'TEST_ANON')
    await admin.from('sessions').delete().eq('participant_code', 'TEST_ANON')

    return NextResponse.json({
      totalSessions: allSessions?.length ?? 0,
      recentSessions: allSessions?.map(s => ({ id: s.id?.substring(0, 8), code: s.participant_code, date: s.date })),
      adminInsert: {
        error: adminInsertError?.message ?? null,
        worked: (adminCheck?.length ?? 0) > 0,
      },
      anonInsert: {
        error: anonInsertError?.message ?? null,
        worked: (anonCheck?.length ?? 0) > 0,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
