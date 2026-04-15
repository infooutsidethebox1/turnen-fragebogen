import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

function checkAuth(req: NextRequest): boolean {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (sessionsError) throw sessionsError

    const { data: rpeEntries, error: rpeError } = await supabase
      .from('rpe_entries')
      .select('*')
      .order('created_at', { ascending: true })

    if (rpeError) throw rpeError

    const participantSet = new Set(sessions?.map((s) => s.participant_code) ?? [])

    return NextResponse.json({
      stats: {
        totalSessions: sessions?.length ?? 0,
        totalParticipants: participantSet.size,
        totalRpeEntries: rpeEntries?.length ?? 0,
      },
      sessions: sessions ?? [],
      rpeEntries: rpeEntries ?? [],
    })
  } catch (err) {
    console.error('Admin data error:', err)
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }
}
