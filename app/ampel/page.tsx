'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '../components/ProgressBar'

type AmpelColor = 'green' | 'yellow' | 'red'

type AmpelResult = {
  color: AmpelColor
  avg: number | null
  stdDev: number | null
  prevCount: number
}

const AMPEL_CONFIG = {
  green: {
    bg: 'rgba(34,197,94,0.15)',
    border: '#22c55e',
    circle: '#22c55e',
    emoji: '🟢',
    title: 'Alles im grünen Bereich',
    text: 'Gute Voraussetzungen für das heutige Training.',
  },
  yellow: {
    bg: 'rgba(234,179,8,0.15)',
    border: '#eab308',
    circle: '#eab308',
    emoji: '🟡',
    title: 'Leicht erhöhte Belastung',
    text: 'Achte heute auf dein Körpergefühl und passe die Intensität bei Bedarf an.',
  },
  red: {
    bg: 'rgba(239,68,68,0.15)',
    border: '#ef4444',
    circle: '#ef4444',
    emoji: '🔴',
    title: 'Hohe Vorbelastung',
    text: 'Dein Körper signalisiert erhöhte Belastung — passe die Intensität heute bewusst an.',
  },
}

function calcAmpel(
  currentScore: number,
  sessions: { hooper_total: number }[]
): AmpelResult {
  if (sessions.length < 3) {
    let color: AmpelColor = 'green'
    if (currentScore >= 17) color = 'red'
    else if (currentScore >= 11) color = 'yellow'
    return { color, avg: null, stdDev: null, prevCount: sessions.length }
  }

  const hoopers = sessions.map((s) => s.hooper_total)
  const avg = hoopers.reduce((a, b) => a + b, 0) / hoopers.length
  const stdDev = Math.sqrt(
    hoopers.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hoopers.length
  )

  let color: AmpelColor = 'green'
  if (currentScore >= avg + stdDev) color = 'red'
  else if (currentScore > avg) color = 'yellow'

  return {
    color,
    avg: Math.round(avg * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    prevCount: sessions.length,
  }
}

export default function AmpelPage() {
  const router = useRouter()
  const [ampel, setAmpel] = useState<AmpelResult | null>(null)
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('turnen_session')
    if (!stored) { router.push('/'); return }

    const parsed = JSON.parse(stored)
    if (!parsed.hooperData || !parsed.participantCode) {
      router.push('/'); return
    }

    const score = parsed.hooperData.hooper_total as number
    setCurrentScore(score)

    // Historische Daten laden (aktuelle Session ausschließen, falls sessionId vorhanden)
    const excludeParam = parsed.sessionId ? `&excludeSessionId=${parsed.sessionId}` : ''
    fetch(`/api/participant?code=${parsed.participantCode}${excludeParam}`)
      .then((r) => r.json())
      .then((data) => {
        const result = calcAmpel(score, data.sessions ?? [])
        setAmpel(result)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => {
        // Fallback: feste Schwellwerte
        setAmpel(calcAmpel(score, []))
        setTimeout(() => setVisible(true), 50)
      })
  }, [router])

  function handleWeiter() {
    router.push('/waiting')
  }

  if (!ampel || currentScore === null) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--muted)', borderTopColor: '#7c3aed' }}
        />
      </div>
    )
  }

  const cfg = AMPEL_CONFIG[ampel.color]

  return (
    <div
      className="flex flex-col flex-1 px-4 py-8 max-w-lg mx-auto w-full transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
    >
      <ProgressBar step={3} />

      <div className="mt-8 mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Dein Wellness-Check</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Basierend auf deinem Hooper-Index von heute
        </p>
      </div>

      {/* Ampel-Karte */}
      <div
        className="rounded-2xl p-6 flex flex-col items-center text-center mb-5 transition-all duration-300"
        style={{ backgroundColor: cfg.bg, border: `2px solid ${cfg.border}` }}
      >
        {/* Großer farbiger Kreis */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-5 shadow-lg"
          style={{ backgroundColor: cfg.circle, boxShadow: `0 0 40px ${cfg.circle}60` }}
        >
          <span className="text-5xl font-black text-white">{currentScore}</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{cfg.title}</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text)' }}>
          {cfg.text}
        </p>

        {/* Score-Anzeige */}
        <div
          className="mt-4 rounded-xl px-5 py-3 w-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted)' }}>Dein Score heute</span>
            <span className="text-lg font-bold text-white">
              {currentScore}
              <span className="text-sm font-normal ml-1" style={{ color: 'var(--muted)' }}>/28</span>
            </span>
          </div>

          {ampel.avg !== null && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                Dein Durchschnitt ({ampel.prevCount} Einheiten)
              </span>
              <span className="text-base font-semibold" style={{ color: cfg.circle }}>
                {ampel.avg}
              </span>
            </div>
          )}

          {ampel.avg !== null && currentScore > ampel.avg && (
            <p className="text-xs mt-2 text-left" style={{ color: 'var(--muted)' }}>
              +{(currentScore - ampel.avg).toFixed(1)} über deinem persönlichen Durchschnitt
            </p>
          )}
          {ampel.avg !== null && currentScore <= ampel.avg && (
            <p className="text-xs mt-2 text-left" style={{ color: 'var(--muted)' }}>
              Innerhalb deines persönlichen Normalbereichs
            </p>
          )}

          {ampel.avg === null && (
            <p className="text-xs mt-2 text-left" style={{ color: 'var(--muted)' }}>
              {ampel.prevCount < 3
                ? `Noch ${3 - ampel.prevCount} weitere Einheit${3 - ampel.prevCount !== 1 ? 'en' : ''} für deinen persönlichen Vergleich`
                : 'Basiert auf deinem persönlichen Durchschnitt'}
            </p>
          )}
        </div>
      </div>

      {/* Hinweis */}
      <p className="text-xs text-center mb-6" style={{ color: 'var(--muted)' }}>
        Dies ist eine Orientierung, keine medizinische Empfehlung.
      </p>

      <div className="flex-1" />

      <div
        className="rounded-xl p-4 mb-5"
        style={{ backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: '#eab308' }}>
          Nach dem Training
        </p>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          Öffne die App nach dem Training erneut und trage die RPE für jedes Gerät ein.
        </p>
      </div>

      <button
        onClick={handleWeiter}
        className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-150"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        Zum Training →
      </button>
    </div>
  )
}
