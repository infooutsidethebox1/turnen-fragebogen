'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SessionData = {
  participantCode: string
  date: string
  hooperData: {
    sleep: number
    stress: number
    fatigue: number
    soreness: number
    hooper_total: number
  }
  rpeEntries: Record<string, number>
  sessionRpe: number | null
}

const APPARATUS_EMOJI: Record<string, string> = {
  Boden: '🤸',
  Ringe: '⭕',
  Reck: '🏋️',
  Barren: '🔛',
  Sprung: '🦘',
}

function getRpeColor(rpe: number): string {
  if (rpe <= 2) return '#22c55e'
  if (rpe <= 4) return '#84cc16'
  if (rpe <= 6) return '#f59e0b'
  if (rpe <= 8) return '#f97316'
  return '#ef4444'
}

const HOOPER_LABELS: Record<string, string> = {
  sleep: '🌙 Schlafqualität',
  stress: '⚡ Stress',
  fatigue: '🔋 Müdigkeit',
  soreness: '💪 Muskelkater',
}

export default function DonePage() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('turnen_session')
    if (!stored) {
      router.push('/')
      return
    }
    setSessionData(JSON.parse(stored))
  }, [router])

  function handleNewSession() {
    sessionStorage.removeItem('turnen_session')
    router.push('/')
  }

  if (!sessionData) return null

  const { hooperData, rpeEntries, sessionRpe } = sessionData
  const rpeList = Object.entries(rpeEntries)

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-lg mx-auto w-full">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl"
          style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e' }}
        >
          ✓
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Danke für deine Teilnahme!
        </h1>
        <p style={{ color: 'var(--muted)' }} className="text-sm">
          Alle Daten wurden erfolgreich gespeichert.
        </p>
      </div>

      {/* Meta */}
      <div
        className="rounded-xl p-4 mb-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>CODE</p>
          <p className="text-white font-mono font-bold">{sessionData.participantCode}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>DATUM</p>
          <p className="text-white font-bold">
            {new Date(sessionData.date + 'T00:00:00').toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Hooper Summary */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            HOOPER-INDEX
          </p>
          <span
            className="font-bold text-lg px-3 py-0.5 rounded-lg"
            style={{ backgroundColor: 'rgba(124,58,237,0.2)', color: '#8b5cf6' }}
          >
            {hooperData.hooper_total} / 28
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['sleep', 'stress', 'fatigue', 'soreness'] as const).map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ backgroundColor: 'var(--card2)' }}
            >
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {HOOPER_LABELS[key]}
              </span>
              <span className="text-white font-bold ml-2">{hooperData[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RPE Summary */}
      {rpeList.length > 0 && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>
            RPE-WERTE ({rpeList.length} Gerät{rpeList.length !== 1 ? 'e' : ''})
          </p>
          <div className="flex flex-col gap-2">
            {rpeList.map(([app, rpe]) => (
              <div key={app} className="flex items-center justify-between">
                <span className="text-white">
                  {APPARATUS_EMOJI[app] || '🏅'} {app}
                </span>
                <span
                  className="font-bold px-3 py-0.5 rounded-lg text-white"
                  style={{ backgroundColor: getRpeColor(rpe) }}
                >
                  RPE {rpe}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session RPE */}
      {sessionRpe !== null && sessionRpe !== undefined && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center justify-between"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span className="text-white">📊 Gesamtbelastung der Einheit</span>
          <span
            className="font-bold px-3 py-0.5 rounded-lg text-white"
            style={{ backgroundColor: getRpeColor(sessionRpe) }}
          >
            RPE {sessionRpe}
          </span>
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={() => router.push(`/dashboard?code=${sessionData.participantCode}`)}
        className="w-full py-3.5 rounded-xl font-semibold text-base mb-3 transition-all duration-150"
        style={{ backgroundColor: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        📊 Mein Dashboard ansehen
      </button>

      <button
        onClick={handleNewSession}
        className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-150"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        Neue Einheit starten
      </button>
    </div>
  )
}
