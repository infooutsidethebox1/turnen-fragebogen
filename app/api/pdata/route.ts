import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    const excludeId = req.nextUrl.searchParams.get('excludeSessionId')

    if (!code) {
      return NextResponse.json({ error: 'Code fehlt' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    }

    const sessionsRes = await fetch(
      `${supabaseUrl}/rest/v1/sessions?select=id,participant_code,date,created_at,sleep,stress,fatigue,soreness,hooper_total,session_rpe&order=created_at.asc`,
      { headers }
    )
    if (!sessionsRes.ok) {
      const text = await sessionsRes.text()
      return NextResponse.json({ error: text, step: 'sessions-http', status: sessionsRes.status }, { status: 500 })
    }
    const allSessionsRaw = await sessionsRes.json()

    let sessions = (allSessionsRaw as Record<string, unknown>[]).filter(
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
        pendingRpeSession: null,
      })
    }

    const pendingRpeSession = sessions
      .filter((s) => s.session_rpe === null || s.session_rpe === undefined)
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())[0] ?? null

    const sessionIds = sessions.map((s) => s.id as string)

    const rpeRes = await fetch(
      `${supabaseUrl}/rest/v1/rpe_entries?select=id,session_id,apparatus,rpe,created_at&order=created_at.asc`,
      { headers }
    )
    const allRpeRaw = rpeRes.ok ? await rpeRes.json() : []

    const rpeEntries = (allRpeRaw as Record<string, unknown>[]).filter((r) =>
      sessionIds.includes(r.session_id as string)
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
      pendingRpeSession,
    })
  } catch (err) {
    return NextResponse.json({
      error: String(err),
      step: 'unhandled',
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) ?? 'MISSING',
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }, { status: 500 })
  }
}
