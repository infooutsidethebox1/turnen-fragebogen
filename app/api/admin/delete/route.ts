import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function checkAuth(req: NextRequest): boolean {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // RPE-Einträge zuerst löschen, dann Sessions
    const { data: deletedRpe, error: rpeError, count: rpeCount } = await supabase
      .from('rpe_entries')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('id')

    const { data: deletedSessions, error: sessionsError, count: sessionCount } = await supabase
      .from('sessions')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('id')

    return NextResponse.json({
      success: !rpeError && !sessionsError,
      rpeError: rpeError?.message ?? null,
      sessionsError: sessionsError?.message ?? null,
      rpeDeleted: rpeCount ?? deletedRpe?.length ?? 0,
      sessionsDeleted: sessionCount ?? deletedSessions?.length ?? 0,
    })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
