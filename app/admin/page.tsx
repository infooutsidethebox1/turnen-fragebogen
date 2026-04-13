'use client'

import { useState, useEffect, useCallback } from 'react'

type Session = {
  id: string
  participant_code: string
  date: string
  created_at: string
  sleep: number
  stress: number
  fatigue: number
  soreness: number
  hooper_total: number
  session_rpe: number | null
}

type RpeEntry = {
  id: string
  session_id: string
  apparatus: string
  rpe: number
  created_at: string
}

type AdminData = {
  stats: {
    totalSessions: number
    totalParticipants: number
    totalRpeEntries: number
  }
  sessions: Session[]
  rpeEntries: RpeEntry[]
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterCode, setFilterCode] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [sortField, setSortField] = useState<'date' | 'participant_code'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchData = useCallback(async (pw: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-password': pw },
      })
      if (res.status === 401) {
        setAuthError('Falsches Passwort')
        setAuthed(false)
        return
      }
      if (!res.ok) throw new Error('Datenbankfehler')
      const json = await res.json()
      setData(json)
      setAuthed(true)
    } catch {
      setAuthError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    await fetchData(password)
  }

  async function handleExport() {
    const res = await fetch('/api/admin/export', {
      headers: { 'x-admin-password': password },
    })
    if (!res.ok) return alert('Export fehlgeschlagen')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gerätturnen_daten_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDeleteAll() {
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      if (!res.ok) throw new Error('Fehler')
      setShowDeleteConfirm(false)
      setData(null)
      fetchData(password)
    } catch {
      alert('Löschen fehlgeschlagen')
    } finally {
      setDeleteLoading(false)
    }
  }

  function toggleSort(field: 'date' | 'participant_code') {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div
          className="w-full max-w-sm rounded-2xl p-8"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h1 className="text-xl font-bold text-white mb-1">Admin-Dashboard</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Gerätturnen · Masterarbeit
          </p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                PASSWORT
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-white outline-none"
                style={{
                  backgroundColor: 'var(--card2)',
                  border: '1px solid var(--border)',
                  fontSize: 16,
                }}
                autoComplete="current-password"
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loading ? 'Laden...' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const sessions = data?.sessions ?? []
  const rpeEntries = data?.rpeEntries ?? []

  // Filter + Sort
  const filtered = sessions
    .filter((s) => {
      const matchCode = filterCode
        ? s.participant_code.toLowerCase().includes(filterCode.toLowerCase())
        : true
      const matchDate = filterDate ? s.date === filterDate : true
      return matchCode && matchDate
    })
    .sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin-Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Gerätturnen · Masterarbeit Sportwissenschaft
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ backgroundColor: '#16a34a' }}
          >
            CSV exportieren
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ backgroundColor: '#dc2626' }}
          >
            Alle Daten löschen
          </button>
          <button
            onClick={() => fetchData(password)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: 'var(--card2)', color: 'var(--muted)' }}
          >
            ↻ Aktualisieren
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Einheiten', value: data?.stats.totalSessions ?? 0 },
          { label: 'Teilnehmer', value: data?.stats.totalParticipants ?? 0 },
          { label: 'RPE-Einträge', value: data?.stats.totalRpeEntries ?? 0 },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="text-3xl font-bold" style={{ color: '#8b5cf6' }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div
        className="rounded-xl p-4 mb-4 flex flex-wrap gap-3"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex-1 min-w-32">
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
            NACH CODE FILTERN
          </label>
          <input
            type="text"
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            placeholder="Code eingeben..."
            className="w-full bg-transparent text-white outline-none"
            style={{ borderBottom: '1px solid var(--border)', paddingBottom: 4 }}
          />
        </div>
        <div className="flex-1 min-w-32">
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
            NACH DATUM FILTERN
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-transparent text-white outline-none w-full"
            style={{ colorScheme: 'dark', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}
          />
        </div>
        {(filterCode || filterDate) && (
          <button
            onClick={() => { setFilterCode(''); setFilterDate('') }}
            className="text-sm self-end pb-1"
            style={{ color: 'var(--accent)' }}
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
        {filtered.length} von {sessions.length} Einheiten angezeigt
      </p>

      {/* Table — Desktop */}
      <div
        className="rounded-xl overflow-hidden hidden md:block"
        style={{ border: '1px solid var(--border)' }}
      >
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--card2)' }}>
              {[
                { label: 'Code', field: 'participant_code' as const },
                { label: 'Datum', field: 'date' as const },
                { label: 'Schlaf', field: null },
                { label: 'Stress', field: null },
                { label: 'Müdigkeit', field: null },
                { label: 'Muskelkater', field: null },
                { label: 'Hooper', field: null },
                { label: 'Session-RPE', field: null },
                { label: 'Geräte & RPE', field: null },
              ].map(({ label, field }) => (
                <th
                  key={label}
                  className="text-left px-4 py-3 font-semibold"
                  style={{ color: 'var(--muted)', cursor: field ? 'pointer' : 'default' }}
                  onClick={() => field && toggleSort(field)}
                >
                  {label}
                  {field && (
                    <span className="ml-1">
                      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((session, i) => {
              const sessionRpe = rpeEntries.filter((r) => r.session_id === session.id)
              return (
                <tr
                  key={session.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'var(--card)' : 'rgba(33,38,45,0.5)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <td className="px-4 py-3 font-mono text-white font-bold">
                    {session.participant_code}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>
                    {new Date(session.date + 'T00:00:00').toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--text)' }}>
                    {session.sleep}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--text)' }}>
                    {session.stress}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--text)' }}>
                    {session.fatigue}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--text)' }}>
                    {session.soreness}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="font-bold px-2 py-0.5 rounded-lg text-white text-xs"
                      style={{ backgroundColor: 'rgba(124,58,237,0.3)', color: '#a78bfa' }}
                    >
                      {session.hooper_total}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {session.session_rpe !== null && session.session_rpe !== undefined ? (
                      <span
                        className="font-bold px-2 py-0.5 rounded-lg text-white text-xs"
                        style={{ backgroundColor: getRpeColor(session.session_rpe) }}
                      >
                        {session.session_rpe}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {sessionRpe.length === 0 ? (
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      ) : (
                        sessionRpe.map((r) => (
                          <span
                            key={r.id}
                            className="text-xs px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: getRpeColor(r.rpe) }}
                          >
                            {r.apparatus} {r.rpe}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
            Keine Einheiten gefunden.
          </div>
        )}
      </div>

      {/* Cards — Mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.map((session) => {
          const sessionRpe = rpeEntries.filter((r) => r.session_id === session.id)
          return (
            <div
              key={session.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-white">{session.participant_code}</span>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  {new Date(session.date + 'T00:00:00').toLocaleDateString('de-DE')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs">
                {[
                  { label: 'Schlaf', val: session.sleep },
                  { label: 'Stress', val: session.stress },
                  { label: 'Müdigkeit', val: session.fatigue },
                  { label: 'Muskelkater', val: session.soreness },
                ].map(({ label, val }) => (
                  <div key={label} style={{ color: 'var(--muted)' }}>
                    <div className="text-white font-bold">{val}</div>
                    {label}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex flex-wrap gap-1 flex-1">
                  {sessionRpe.map((r) => (
                    <span
                      key={r.id}
                      className="text-xs px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: getRpeColor(r.rpe) }}
                    >
                      {r.apparatus} {r.rpe}
                    </span>
                  ))}
                  {sessionRpe.length === 0 && (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      Keine RPE-Daten
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {session.session_rpe !== null && session.session_rpe !== undefined && (
                    <span
                      className="font-bold text-xs px-2 py-0.5 rounded-lg text-white"
                      style={{ backgroundColor: getRpeColor(session.session_rpe) }}
                    >
                      Gesamt: {session.session_rpe}
                    </span>
                  )}
                  <span
                    className="font-bold text-xs px-2 py-0.5 rounded-lg"
                    style={{ backgroundColor: 'rgba(124,58,237,0.3)', color: '#a78bfa' }}
                  >
                    Hooper: {session.hooper_total}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
            Keine Einheiten gefunden.
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4 z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-lg font-bold text-white mb-2">Alle Daten löschen?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Diese Aktion ist unwiderruflich. Alle Sessions und RPE-Einträge werden permanent
              gelöscht.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: 'var(--card2)', color: 'var(--muted)' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl font-semibold text-white"
                style={{ backgroundColor: '#dc2626' }}
              >
                {deleteLoading ? 'Löschen...' : 'Ja, löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getRpeColor(rpe: number): string {
  if (rpe <= 2) return '#16a34a'
  if (rpe <= 4) return '#65a30d'
  if (rpe <= 6) return '#d97706'
  if (rpe <= 8) return '#ea580c'
  return '#dc2626'
}
