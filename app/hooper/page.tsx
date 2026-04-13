'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '../components/ProgressBar'

type HooperKey = 'sleep' | 'stress' | 'fatigue' | 'soreness'

const ITEMS: {
  key: HooperKey
  emoji: string
  label: string
  leftAnchor: string
  rightAnchor: string
}[] = [
  {
    key: 'sleep',
    emoji: '🌙',
    label: 'Schlafqualität',
    leftAnchor: 'Sehr gut',
    rightAnchor: 'Sehr schlecht',
  },
  {
    key: 'stress',
    emoji: '⚡',
    label: 'Stress',
    leftAnchor: 'Sehr wenig',
    rightAnchor: 'Sehr viel',
  },
  {
    key: 'fatigue',
    emoji: '🔋',
    label: 'Müdigkeit',
    leftAnchor: 'Sehr erholt',
    rightAnchor: 'Sehr müde',
  },
  {
    key: 'soreness',
    emoji: '💪',
    label: 'Muskelkater',
    leftAnchor: 'Keiner',
    rightAnchor: 'Sehr stark',
  },
]

export default function HooperPage() {
  const router = useRouter()
  const [values, setValues] = useState<Partial<Record<HooperKey, number>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('turnen_session')
    if (!stored) router.push('/')
  }, [router])

  const allAnswered = ITEMS.every((item) => values[item.key] !== undefined)

  async function handleSubmit() {
    if (!allAnswered) return
    setLoading(true)
    setError('')

    try {
      const stored = JSON.parse(sessionStorage.getItem('turnen_session') || '{}')
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantCode: stored.participantCode,
          date: stored.date,
          sleep: values.sleep,
          stress: values.stress,
          fatigue: values.fatigue,
          soreness: values.soreness,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Speichern')
      }

      const { id, hooper_total } = data

      sessionStorage.setItem(
        'turnen_session',
        JSON.stringify({
          ...stored,
          sessionId: id,
          hooperData: { ...values, hooper_total },
          rpeEntries: {},
        })
      )

      router.push('/ampel')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 px-4 py-8 max-w-lg mx-auto w-full">
      <ProgressBar step={2} />

      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Wie fühlst du dich heute?</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Hooper-Index · vor dem Training · Skala 1–7
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{item.emoji}</span>
              <span className="font-semibold text-white">{item.label}</span>
              {values[item.key] !== undefined && (
                <span
                  className="ml-auto text-sm font-bold px-2 py-0.5 rounded-lg"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  {values[item.key]}
                </span>
              )}
            </div>

            {/* Anker-Labels */}
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--muted)' }}>
              <span>{item.leftAnchor}</span>
              <span>{item.rightAnchor}</span>
            </div>

            {/* 1-7 Buttons */}
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                const selected = values[item.key] === val
                return (
                  <button
                    key={val}
                    onClick={() => setValues((prev) => ({ ...prev, [item.key]: val }))}
                    className="scale-btn text-sm"
                    style={{
                      backgroundColor: selected ? 'var(--accent)' : 'var(--card2)',
                      color: selected ? 'white' : 'var(--muted)',
                      border: selected
                        ? '2px solid var(--accent)'
                        : '2px solid transparent',
                    }}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mt-4">{error}</p>
      )}

      {/* Hooper-Summe Vorschau */}
      {allAnswered && (
        <div
          className="mt-4 rounded-xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--card2)', border: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--muted)' }}>Hooper-Gesamtscore</span>
          <span className="text-xl font-bold" style={{ color: '#8b5cf6' }}>
            {Object.values(values).reduce((a, b) => (a as number) + (b as number), 0) as number}
            <span className="text-sm font-normal ml-1" style={{ color: 'var(--muted)' }}>
              / 28
            </span>
          </span>
        </div>
      )}

      <div className="flex-1 mt-4" />

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || loading}
        className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all duration-150 mt-4"
        style={{
          backgroundColor: allAnswered && !loading ? 'var(--accent)' : 'var(--card2)',
          color: allAnswered && !loading ? 'white' : 'var(--muted)',
          cursor: allAnswered && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Speichern...' : 'Weiter zur RPE →'}
      </button>
    </div>
  )
}
