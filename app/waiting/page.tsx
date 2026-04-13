'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WaitingPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [date, setDate] = useState('')
  const [hooperTotal, setHooperTotal] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('turnen_session')
    if (!stored) { router.push('/'); return }
    const parsed = JSON.parse(stored)
    if (!parsed.participantCode) { router.push('/'); return }
    setCode(parsed.participantCode)
    setDate(parsed.date)
    setHooperTotal(parsed.hooperData?.hooper_total ?? null)
    setTimeout(() => setVisible(true), 50)
  }, [router])

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('de-DE', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  return (
    <div
      className="flex flex-col flex-1 items-center justify-center px-4 py-8 max-w-lg mx-auto w-full transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
    >
      {/* Bestätigung */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 text-5xl"
        style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e' }}
      >
        ✓
      </div>

      <h1 className="text-2xl font-bold text-white mb-2 text-center">
        Hooper-Index gespeichert!
      </h1>
      <p className="text-center mb-8" style={{ color: 'var(--muted)' }}>
        Viel Erfolg beim Training heute.
      </p>

      {/* Info-Karte */}
      <div
        className="w-full rounded-2xl p-5 mb-6"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Dein Code</span>
          <span className="font-mono font-bold text-white text-lg">{code}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Datum</span>
          <span className="text-white text-sm">{date ? formatDate(date) : ''}</span>
        </div>
        {hooperTotal !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted)' }}>Hooper-Score</span>
            <span
              className="font-bold px-2 py-0.5 rounded-lg text-white"
              style={{ backgroundColor: 'rgba(124,58,237,0.3)', color: '#a78bfa' }}
            >
              {hooperTotal} / 28
            </span>
          </div>
        )}
      </div>

      {/* Hinweis */}
      <div
        className="w-full rounded-2xl p-5 mb-8"
        style={{ backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: '#eab308' }}>
          Nach dem Training
        </p>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          Öffne die App nach dem Training wieder, gib deinen Code{' '}
          <span className="font-mono font-bold text-white">{code}</span> ein und
          bewerte die RPE für jedes Gerät.
        </p>
      </div>

      <button
        onClick={() => router.push('/')}
        className="w-full py-4 rounded-xl font-bold text-lg text-white"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        App schließen
      </button>
    </div>
  )
}
