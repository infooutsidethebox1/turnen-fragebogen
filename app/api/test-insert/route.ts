import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY fehlt!' })
  }

  // Frischer Client (kein Singleton) um Caching-Probleme auszuschließen
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const testCode = 'DBTEST'
  const testDate = '2099-12-31'

  // 1. INSERT
  const { data: inserted, error: insertError } = await admin
    .from('sessions')
    .insert({
      participant_code: testCode,
      date: testDate,
      sleep: 3,
      stress: 3,
      fatigue: 3,
      soreness: 3,
    })
    .select('id, hooper_total')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({
      step: 'INSERT',
      success: false,
      error: insertError?.message,
      code: insertError?.code,
    })
  }

  // 2. Prüfen ob Row wirklich da ist
  const { data: allRows } = await admin
    .from('sessions')
    .select('id, participant_code')
    .eq('participant_code', testCode)

  const found = (allRows ?? []).length > 0

  // 3. Aufräumen
  await admin.from('sessions').delete().eq('participant_code', testCode)

  return NextResponse.json({
    step: 'DONE',
    insertedId: inserted.id,
    hooper_total: inserted.hooper_total,
    rowFoundAfterInsert: found,
    serviceKeyLength: serviceKey.length,
  })
}
