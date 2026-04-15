import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

function checkAuth(req: NextRequest): boolean {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    // RPE-Einträge werden durch ON DELETE CASCADE automatisch mitgelöscht
    const { error } = await supabase
      .from('sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Alle Daten wurden gelöscht.' })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 })
  }
}
