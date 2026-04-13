import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

function checkAuth(req: NextRequest): boolean {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })

    if (sessionsError) throw sessionsError

    const { data: rpeEntries, error: rpeError } = await supabase
      .from('rpe_entries')
      .select('*')

    if (rpeError) throw rpeError

    // SPSS-kompatibles CSV (Semikolon-getrennt, UTF-8)
    const header = 'Code;Datum;Timestamp;Schlaf;Stress;Muedigkeit;Muskelkater;Hooper_Total;Session_RPE;Geraet;RPE'
    const rows: string[] = [header]

    for (const session of sessions ?? []) {
      const sessionRpe = (rpeEntries ?? []).filter((r) => r.session_id === session.id)

      if (sessionRpe.length === 0) {
        rows.push(
          [
            session.participant_code,
            session.date,
            session.created_at,
            session.sleep,
            session.stress,
            session.fatigue,
            session.soreness,
            session.hooper_total,
            session.session_rpe ?? '',
            '',
            '',
          ].join(';')
        )
      } else {
        for (const rpe of sessionRpe) {
          rows.push(
            [
              session.participant_code,
              session.date,
              session.created_at,
              session.sleep,
              session.stress,
              session.fatigue,
              session.soreness,
              session.hooper_total,
              session.session_rpe ?? '',
              rpe.apparatus,
              rpe.rpe,
            ].join(';')
          )
        }
      }
    }

    const csv = '\uFEFF' + rows.join('\n') // BOM für Excel-Kompatibilität
    const timestamp = new Date().toISOString().split('T')[0]

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="geraetturnen_daten_${timestamp}.csv"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ error: 'Export fehlgeschlagen' }, { status: 500 })
  }
}
