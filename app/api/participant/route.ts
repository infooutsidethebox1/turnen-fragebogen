import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const excludeId = req.nextUrl.searchParams.get('excludeSessionId')

  if (!code) {
    return NextResponse.json({ error: 'Code fehlt' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: allSessions, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sessions = (allSessions ?? []).filter(
    (s) => s.participant_code === code
  )

  if (excludeId) {
    sessions = sessions.filter((s) => s.id !== excludeId)
  }

  if (sessions.length === 0) {
    return NextResponse.json({
      exists: false,
      count: 0,
      lastDate: null,
      avgHooper: null,
      stdDevHooper: null,
      avgSessionRpe: null,
      sessions: [],
      rpeEntries: [],
    })
  }

  const sessionIds = sessions.map((s) => s.id)

  const { data: allRpe } = await supabase
    .from('rpe_entries')
    .select('*')
    .order('created_at', { ascending: true })

  const rpeEntries = (allRpe ?? []).filter((r) =>
    sessionIds.includes(r.session_id)
  )

  const hoopers = sessions.map((s) => s.hooper_total as number)
  const avgHooper = hoopers.reduce((a, b) => a + b, 0) / hoopers.length
  const stdDevHooper = Math.sqrt(
    hoopers.reduce((sum, h) => sum + Math.pow(h - avgHooper, 2), 0) / hoopers.length
  )

  const sessionRpes = sessions
    .filter((s) => s.session_rpe !== null && s.session_rpe !== undefined)
    .map((s) => s.session_rpe as number)
  const avgSessionRpe =
    sessionRpes.length > 0
      ? sessionRpes.reduce((a, b) => a + b, 0) / sessionRpes.length
      : null

  const lastDate = sessions[sessions.length - 1].date

  return NextResponse.json({
    exists: true,
    count: sessions.length,
    lastDate,
    avgHooper: Math.round(avgHooper * 10) / 10,
    stdDevHooper: Math.round(stdDevHooper * 10) / 10,
    avgSessionRpe: avgSessionRpe !== null ? Math.round(avgSessionRpe * 10) / 10 : null,
    sessions,
    rpeEntries,
  })
}
