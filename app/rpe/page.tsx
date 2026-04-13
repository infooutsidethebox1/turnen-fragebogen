'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '../components/ProgressBar'

type Apparatus = 'Boden' | 'Ringe' | 'Reck' | 'Barren' | 'Sprung'

const APPARATUS_LIST: Apparatus[] = ['Boden', 'Ringe', 'Reck', 'Barren', 'Sprung']

const APPARATUS_EMOJI: Record<Apparatus, string> = {
  Boden: '🤸',
  Ringe: '⭕',
  Reck: '🏋️',
  Barren: '🔛',
  Sprung: '🦘',
}

const BORG_SCALE: { value: number; label: string }[] = [
  { value: 0, label: 'Ruhe' },
  { value: 1, label: 'Sehr leicht' },
  { value: 2, label: 'Leicht' },
  { value: 3, label: 'Moderat' },
  { value: 4, label: 'Etwas anstrengend' },
  { value: 5, label: 'Anstrengend' },
  { value: 6, label: 'Schwer' },
  { value: 7, label: 'Sehr schwer' },
  { value: 8, label: '—' },
  { value: 9, label: '—' },
  { value: 10, label: 'Maximal' },
]

function getRpeColor(rpe: number): string {
  if (rpe <= 2) return '#22c55e'
  if (rpe <= 4) return '#84cc16'
  if (rpe <= 6) return '#f59e0b'
  if (rpe <= 8) return '#f97316'
  return '#ef4444'
}

export default function RpePage() {
  const router = useRouter()
  const [trained, setTrained] = useState<Set<Apparatus>>(new Set())
  const [rpeValues, setRpeValues] = useState<Partial<Record<Apparatus, number>>>({})
  const [sessionRpe, setSessionRpe] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('turnen_session')
    if (!stored) { router.push('/'); return }
    const parsed = JSON.parse(stored)
    if (!parsed.sessionId) { router.push('/'); return }
  }, [router])

  function toggleApparatus(app: Apparatus) {
    setTrained((prev) => {
      const next = new Set(prev)
      if (next.has(app)) {
        next.delete(app)
        // RPE-Wert für abgewähltes Gerät entfernen
        setRpeValues((r) => {
          const copy = { ...r }
          delete copy[app]
          return copy
        })
      } else {
        next.add(app)
      }
      return next
    })
  }

  // Submit ist aktiv wenn: ≥1 Gerät gewählt, alle gewählten Geräte haben RPE, Session-RPE gesetzt
  const trainedList = APPARATUS_LIST.filter((a) => trained.has(a))
  const allRated = trainedList.length > 0 && trainedList.every((a) => rpeValues[a] !== undefined)
  const canSubmit = allRated && sessionRpe !== null && !loading

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setError('')

    try {
      const stored = JSON.parse(sessionStorage.getItem('turnen_session') || '{}')
      const { sessionId } = stored

      // Alle Gerät-RPEs parallel speichern
      const rpePromises = trainedList.map((app) =>
        fetch('/api/rpe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, apparatus: app, rpe: rpeValues[app] }),
        }).then((r) => { if (!r.ok) throw new Error(`Fehler bei ${app}`) })
      )

      // Session-RPE speichern
      const sessionPatch = fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_rpe: sessionRpe }),
      }).then((r) => { if (!r.ok) throw new Error('Fehler bei Gesamt-RPE') })

      await Promise.all([...rpePromises, sessionPatch])

      sessionStorage.setItem(
        'turnen_session',
        JSON.stringify({ ...stored, rpeEntries: rpeValues, sessionRpe })
      )

      router.push('/done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-lg mx-auto w-full">
      <ProgressBar step={4} />

      <div className="mt-8 mb-2">
        <h1 className="text-2xl font-bold text-white mb-1">Wie anstrengend war jedes Gerät?</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Bewerte jetzt rückblickend die Belastung an jedem Gerät, das du heute trainiert hast.
        </p>
      </div>

      {/* Geräte-Liste */}
      <div className="flex flex-col gap-3 mt-5">
        {APPARATUS_LIST.map((app) => {
          const isOn = trained.has(app)
          const rpe = rpeValues[app]
          const hasRpe = rpe !== undefined

          return (
            <div
              key={app}
              className="rounded-xl overflow-hidden"
              style={{
                border: isOn ? '2px solid var(--accent)' : '2px solid var(--border)',
                backgroundColor: isOn ? 'rgba(124,58,237,0.08)' : 'var(--card)',
              }}
            >
              {/* Gerät-Header mit Toggle */}
              <button
                onClick={() => toggleApparatus(app)}
                className="w-full flex items-center gap-3 px-4 py-3.5"
              >
                <span className="text-2xl">{APPARATUS_EMOJI[app]}</span>
                <span className="font-semibold text-white flex-1 text-left">{app}</span>

                {/* Toggle-Pill */}
                <div
                  className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold transition-all duration-200"
                  style={{
                    backgroundColor: isOn ? 'var(--accent)' : 'var(--card2)',
                    color: isOn ? 'white' : 'var(--muted)',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isOn ? 'white' : 'var(--border)' }}
                  />
                  {isOn ? 'Trainiert' : 'Nicht trainiert'}
                </div>

                {/* RPE-Badge wenn bewertet */}
                {isOn && hasRpe && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-lg text-white ml-1"
                    style={{ backgroundColor: getRpeColor(rpe) }}
                  >
                    {rpe}
                  </span>
                )}
              </button>

              {/* Kompakte 0-10 Skala — nur wenn trainiert */}
              {isOn && (
                <div className="px-4 pb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                    RPE 0–10
                  </p>
                  <div className="grid grid-cols-11 gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                      const sel = rpe === val
                      return (
                        <button
                          key={val}
                          onClick={() =>
                            setRpeValues((prev) => ({ ...prev, [app]: val }))
                          }
                          className="flex items-center justify-center rounded-lg font-bold text-sm transition-all duration-100 select-none"
                          style={{
                            minHeight: 40,
                            backgroundColor: sel ? getRpeColor(val) : 'var(--card2)',
                            color: sel ? 'white' : 'var(--muted)',
                            border: sel ? `2px solid ${getRpeColor(val)}` : '2px solid transparent',
                          }}
                        >
                          {val}
                        </button>
                      )
                    })}
                  </div>
                  {/* Anker-Labels */}
                  <div className="flex justify-between text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                    <span>Ruhe</span>
                    <span>Maximal</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Gesamt-Session-RPE */}
      <div
        className="mt-5 rounded-xl overflow-hidden"
        style={{ border: '2px solid var(--border)', backgroundColor: 'var(--card)' }}
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📊</span>
            <span className="font-bold text-white">Gesamtbelastung der Einheit</span>
            {sessionRpe !== null && (
              <span
                className="ml-auto text-sm font-bold px-2 py-0.5 rounded-lg text-white"
                style={{ backgroundColor: getRpeColor(sessionRpe) }}
              >
                RPE {sessionRpe}
              </span>
            )}
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            Wie anstrengend war das gesamte Training?
          </p>

          {/* Ausführliche Borg-Liste für Session-RPE */}
          <div className="flex flex-col gap-1.5">
            {BORG_SCALE.map(({ value, label }) => {
              const sel = sessionRpe === value
              return (
                <button
                  key={value}
                  onClick={() => setSessionRpe(value)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-100"
                  style={{
                    backgroundColor: sel ? 'rgba(124,58,237,0.15)' : 'var(--card2)',
                    border: sel ? `2px solid ${getRpeColor(value)}` : '2px solid transparent',
                    minHeight: 48,
                  }}
                >
                  <span
                    className="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                    style={{
                      backgroundColor: sel ? getRpeColor(value) : 'var(--border)',
                      color: sel ? 'white' : 'var(--muted)',
                    }}
                  >
                    {value}
                  </span>
                  <span className="text-sm" style={{ color: sel ? 'white' : 'var(--text)' }}>
                    {label}
                  </span>
                  {sel && <span className="ml-auto" style={{ color: '#8b5cf6' }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mt-4">{error}</p>
      )}

      {/* Validierungshinweis */}
      {trainedList.length > 0 && !allRated && (
        <p className="text-xs text-center mt-3" style={{ color: 'var(--muted)' }}>
          Bitte alle markierten Geräte bewerten, bevor du abschließt.
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-xl font-bold text-lg text-white mt-5 mb-2 transition-all duration-150"
        style={{
          backgroundColor: canSubmit ? '#16a34a' : 'var(--card2)',
          color: canSubmit ? 'white' : 'var(--muted)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Speichern...' : 'Einheit abschließen ✓'}
      </button>
    </div>
  )
}
