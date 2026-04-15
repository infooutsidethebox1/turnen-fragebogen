'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from './components/ProgressBar'

type Phase = 'idle' | 'checking' | 'new' | 'hooper' | 'rpe' | 'done'

type TodaySession = {
  id: string
  sleep: number
  stress: number
  fatigue: number
  soreness: number
  hooper_total: number
  session_rpe: number | null
  date: string
}

export default function StartPage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [code, setCode] = useState('')
  const [date, setDate] = useState(today)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [sessionCount, setSessionCount] = useState(0)
  const [lastDate, setLastDate] = useState<string | null>(null)
  const [todaySession, setTodaySession] = useState<TodaySession | null>(null)
  const [visible, setVisible] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setVisible(true) }, [])

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCode(val)
    setError('')
    setPhase('idle')
    setTodaySession(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.length === 4) {
      setPhase('checking')
      debounceRef.current = setTimeout(() => checkCode(val), 400)
    }
  }

  async function checkCode(val: string) {
    try {
      const res = await fetch(`/api/participant?code=${val}`)
      const data = await res.json()

      if (!data.exists) {
        setPhase('new')
        return
      }

      setSessionCount(data.count)
      setLastDate(data.lastDate)

      // Server gibt pendingRpeSession zurück wenn eine Session der letzten 36h noch kein RPE hat
      if (data.pendingRpeSession) {
        setPhase('rpe')
        setTodaySession(data.pendingRpeSession)
        return
      }

      // Prüfen ob heute schon eine komplett abgeschlossene Session existiert
      const sessionToday = (data.sessions as TodaySession[]).find(
        (s) => s.date === today
      )
      if (sessionToday && sessionToday.session_rpe !== null) {
        setPhase('done')
      } else {
        setPhase('hooper')
      }
    } catch {
      setPhase('idle')
    }
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  function goToHooper() {
    sessionStorage.setItem('turnen_session', JSON.stringify({ participantCode: code, date }))
    router.push('/hooper')
  }

  function goToRpe() {
    if (!todaySession) return
    sessionStorage.setItem('turnen_session', JSON.stringify({
      participantCode: code,
      date: todaySession.date,
      sessionId: todaySession.id,
      hooperData: {
        sleep: todaySession.sleep,
        stress: todaySession.stress,
        fatigue: todaySession.fatigue,
        soreness: todaySession.soreness,
        hooper_total: todaySession.hooper_total,
      },
      rpeEntries: {},
    }))
    router.push('/rpe')
  }

  function goToDashboard() {
    sessionStorage.setItem('turnen_session', JSON.stringify({ participantCode: code, date }))
    router.push(`/dashboard?code=${code}`)
  }

  const isReturning = phase === 'hooper' || phase === 'rpe' || phase === 'done'
  const canSubmit = code.length === 4 && !!date && phase !== 'checking'

  return (
    <div
      className="flex flex-col flex-1 px-4 py-8 max-w-lg mx-auto w-full transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <ProgressBar step={1} />

      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Trainings-Fragebogen</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Gerätturnen · Masterarbeit Sportwissenschaft
        </p>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {/* Code-Eingabe */}
        <div
          className="rounded-xl p-5 transition-all duration-300"
          style={{
            backgroundColor: 'var(--card)',
            border: `1px solid ${phase === 'rpe' ? '#eab308' : isReturning ? '#22c55e' : 'var(--border)'}`,
          }}
        >
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
            PERSÖNLICHER CODE (4 Ziffern)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={code}
              onChange={handleCodeChange}
              placeholder="z.B. 1234"
              className="flex-1 bg-transparent text-white text-2xl font-mono outline-none placeholder-gray-600 py-1 tracking-widest"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {phase === 'checking' && (
              <div className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
                style={{ borderColor: 'var(--muted)', borderTopColor: 'transparent' }} />
            )}
            {(phase === 'hooper' || phase === 'done') && <span className="text-xl shrink-0">✅</span>}
            {phase === 'rpe' && <span className="text-xl shrink-0">⏳</span>}
            {phase === 'new' && <span className="text-xl shrink-0">👋</span>}
          </div>

          {/* Status-Nachrichten */}
          {phase === 'hooper' && (
            <div className="mt-3 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                Willkommen zurück! Das ist deine {sessionCount + 1}. Einheit.
              </p>
              {lastDate && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Zuletzt dabei am {formatDate(lastDate)}
                </p>
              )}
            </div>
          )}

          {phase === 'rpe' && todaySession && (
            <div className="mt-3 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
              <p className="text-sm font-semibold" style={{ color: '#eab308' }}>
                Hooper bereits ausgefüllt ✓
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Hooper-Score: {todaySession.hooper_total}/28 · RPE noch ausstehend
              </p>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-3 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                Einheit für heute bereits abgeschlossen ✓
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Du kannst das Dashboard ansehen oder eine neue Einheit starten.
              </p>
            </div>
          )}

          {phase === 'new' && (
            <div className="mt-3 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <p className="text-sm font-semibold" style={{ color: '#a78bfa' }}>
                Erste Einheit — willkommen!
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Verwende diesen Code bei jeder Einheit.
              </p>
            </div>
          )}

          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            Letzte 4 Ziffern deiner Matrikelnr. · nur für dich sichtbar
          </p>
        </div>

        {/* Datum — nur zeigen wenn Hooper noch nicht ausgefüllt */}
        {phase !== 'rpe' && phase !== 'done' && (
          <div className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              DATUM DER TRAININGSEINHEIT
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setError('') }}
              className="w-full bg-transparent text-white text-lg outline-none py-1"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div className="flex-1" />

        {/* Dashboard Button */}
        {isReturning && (
          <button
            onClick={goToDashboard}
            className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-150"
            style={{ backgroundColor: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            📊 Mein Dashboard ansehen
          </button>
        )}

        {/* Haupt-Aktion */}
        {phase === 'rpe' ? (
          <button
            onClick={goToRpe}
            className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all duration-150"
            style={{ backgroundColor: '#eab308' }}
          >
            RPE nach dem Training erfassen →
          </button>
        ) : (
          <button
            onClick={goToHooper}
            disabled={!canSubmit}
            className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all duration-150"
            style={{
              backgroundColor: canSubmit ? 'var(--accent)' : 'var(--card2)',
              color: canSubmit ? 'white' : 'var(--muted)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {phase === 'done' ? 'Neue Einheit starten' : 'Weiter zum Hooper-Index →'}
          </button>
        )}
      </div>
    </div>
  )
}
