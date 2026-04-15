import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function checkAuth(req: NextRequest): boolean {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

    // Zuerst prüfen wie viele Rows sichtbar sind
    const { data: visibleSessions } = await supabase.from('sessions').select('id')
    const { data: visibleRpe } = await supabase.from('rpe_entries').select('id')

    // IDs direkt löschen (nicht per filter)
    const sessionIds = (visibleSessions ?? []).map((s: { id: string }) => s.id)
    const rpeIds = (visibleRpe ?? []).map((r: { id: string }) => r.id)

    let rpeDeleted = 0
    let sessionsDeleted = 0

    if (rpeIds.length > 0) {
      const { error } = await supabase.from('rpe_entries').delete().in('id', rpeIds)
      if (!error) rpeDeleted = rpeIds.length
    }

    if (sessionIds.length > 0) {
      const { error } = await supabase.from('sessions').delete().in('id', sessionIds)
      if (!error) sessionsDeleted = sessionIds.length
    }

    return NextResponse.json({
      success: true,
      url: url.substring(0, 40),
      visibleBefore: { sessions: sessionIds.length, rpe: rpeIds.length },
      rpeDeleted,
      sessionsDeleted,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
