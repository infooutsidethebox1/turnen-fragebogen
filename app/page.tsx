'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from './components/ProgressBar'

type CodeStatus = 'idle' | 'checking' | 'returning' | 'new'

type ParticipantSummary = {
  count: number
  lastDate: string | null
}

export default function StartPage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [code, setCode] = useState('')
  const [date, setDate] = useState(today)
  const [error, setError] = useState('')
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('idle')
  const [participantInfo, setParticipantInfo] = useState<ParticipantSummary | null>(null)
  const [visible, setVisible] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setVisible(true)
  }, [])

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Nur Ziffern, max 4 Stellen
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCode(val)
    setError('')
    setParticipantInfo(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.length === 4) {
      setCodeStatus('checking')
      debounceRef.current = setTimeout(() => checkCode(val), 400)
    } else {
      setCodeStatus('idle')
    }
  }

  async function checkCode(val: string) {
    try {
      const res = await fetch(`/api/participant?code=${val}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.exists) {
        setCodeStatus('returning')
        setParticipantInfo({ count: data.count, lastDate: data.lastDate })
      } else {
        setCodeStatus('new')
        setParticipantInfo(null)
      }
    } catch {
      setCodeStatus('idle')
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 4) {
      setError('Bitte gib deinen 4-stelligen Code ein.')
      return
    }
    if (!date) {
      setError('Bitte wähle ein Datum.')
      return
    }
    sessionStorage.setItem(
      'turnen_session',
      JSON.stringify({ participantCode: code, date })
    )
    router.push('/hooper')
  }

  function goToDashboard() {
    sessionStorage.setItem(
      'turnen_session',
      JSON.stringify({ participantCode: code, date })
    )
    router.push(`/dashboard?code=${code}`)
  }

  const canSubmit = code.length === 4 && !!date
  const isReturning = codeStatus === 'returning'

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        {/* Persönlicher Code */}
        <div
          className="rounded-xl p-5 transition-all duration-300"
          style={{
            backgroundColor: 'var(--card)',
            border: `1px solid ${isReturning ? '#22c55e' : 'var(--border)'}`,
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
            {codeStatus === 'checking' && (
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
                style={{ borderColor: 'var(--muted)', borderTopColor: 'transparent' }}
              />
            )}
            {codeStatus === 'returning' && (
              <span className="text-xl shrink-0">✅</span>
            )}
            {codeStatus === 'new' && (
              <span className="text-xl shrink-0">👋</span>
            )}
          </div>

          {/* Code-Status Nachricht */}
          {codeStatus === 'returning' && participantInfo && (
            <div
              className="mt-3 rounded-lg px-3 py-2.5 transition-all duration-300"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                Willkommen zurück! Das ist deine {participantInfo.count + 1}. Einheit.
              </p>
              {participantInfo.lastDate && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Zuletzt dabei am {formatDate(participantInfo.lastDate)}
                </p>
              )}
            </div>
          )}

          {codeStatus === 'new' && (
            <div
              className="mt-3 rounded-lg px-3 py-2.5 transition-all duration-300"
              style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}
            >
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

        {/* Datum */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
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

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <div className="flex-1" />

        {/* Dashboard Button (nur für zurückkehrende Teilnehmer) */}
        {isReturning && (
          <button
            type="button"
            onClick={goToDashboard}
            className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-150"
            style={{
              backgroundColor: 'var(--card2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            📊 Mein Dashboard ansehen
          </button>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all duration-150"
          style={{
            backgroundColor: canSubmit ? 'var(--accent)' : 'var(--card2)',
            color: canSubmit ? 'white' : 'var(--muted)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          Weiter zum Hooper-Index →
        </button>
      </form>
    </div>
  )
}
