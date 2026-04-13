import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const excludeId = req.nextUrl.searchParams.get('excludeSessionId')

  if (!code) {
    return NextResponse.json({ error: 'Code fehlt' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Debug: alle Codes lesen um zu sehen was in der DB ist
  const { data: allCodes } = await supabase
    .from('sessions')
    .select('participant_code')

  let query = supabase
    .from('sessions')
    .select('*')
    .eq('participant_code', code)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data: sessions, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message, _debug: { code, allCodes } }, { status: 500 })
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({
      exists: false,
      count: 0,
      lastDate: null,
      avgHooper: null,
      stdDevHooper: null,
      avgSessionRpe: null,
      sessions: [],
      rpeEntries: [],
      _debug: { receivedCode: code, allCodesInDb: allCodes },
    })
  }

  const sessionIds = sessions.map((s) => s.id)

  const { data: rpeEntries } = await supabase
    .from('rpe_entries')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true })

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
    rpeEntries: rpeEntries ?? [],
  })
}
