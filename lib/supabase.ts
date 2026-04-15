import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

// Anon-Client (für Lesezugriffe, unterliegt RLS)
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase-Umgebungsvariablen fehlen. Bitte .env.local konfigurieren.')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Admin-Client (Service Role Key — umgeht RLS, nur serverseitig verwenden!)
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt in den Umgebungsvariablen.')
    }
    _supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _supabaseAdmin
}

// Convenience export — wird nur in Funktionen aufgerufen, nie auf Top-Level
export { getSupabase as supabase }

export type Database = {
  sessions: {
    id: string
    participant_code: string
    date: string
    created_at: string
    sleep: number
    stress: number
    fatigue: number
    soreness: number
    hooper_total: number
  }
  rpe_entries: {
    id: string
    session_id: string
    apparatus: 'Boden' | 'Ringe' | 'Reck' | 'Barren' | 'Sprung'
    rpe: number
    created_at: string
  }
}
