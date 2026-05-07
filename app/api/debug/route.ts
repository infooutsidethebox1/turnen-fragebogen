import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

    const { data: sessions } = await admin
      .from('sessions')
      .select('id, participant_code, date')
      .order('created_at', { ascending: false })
      .limit(10)

    const { count: rpeCount } = await admin
      .from('rpe_entries')
      .select('id', { count: 'exact', head: true })

    const { count: sessionCount } = await admin
      .from('sessions')
      .select('id', { count: 'exact', head: true })

    const jwtRole = (token: string) => {
      try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).role } catch { return 'err' }
    }
    return NextResponse.json({
      totalSessions: sessionCount ?? 0,
      totalRpeEntries: rpeCount ?? 0,
      url: url?.slice(0, 30),
      keyRole: jwtRole(serviceKey),
      recentSessions: sessions?.map(s => ({
        id: s.id?.substring(0, 8),
        code: s.participant_code,
        date: s.date,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
