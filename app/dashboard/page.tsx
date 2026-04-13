'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts'

type Session = {
  id: string
  date: string
  hooper_total: number
  session_rpe: number | null
  sleep: number
  stress: number
  fatigue: number
  soreness: number
}

type RpeEntry = {
  session_id: string
  apparatus: string
  rpe: number
}

type ParticipantData = {
  exists: boolean
  count: number
  lastDate: string | null
  avgHooper: number | null
  stdDevHooper: number | null
  avgSessionRpe: number | null
  sessions: Session[]
  rpeEntries: RpeEntry[]
}

const APPARATUS_LIST = ['Boden', 'Ringe', 'Reck', 'Barren', 'Sprung']
const APPARATUS_COLORS: Record<string, string> = {
  Boden: '#8b5cf6',
  Ringe: '#06b6d4',
  Reck: '#f59e0b',
  Barren: '#22c55e',
  Sprung: '#ef4444',
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// Insights berechnen
function calcInsights(sessions: Session[], rpeEntries: RpeEntry[]): string[] {
  if (sessions.length < 5) return []
  const insights: string[] = []

  // 1. Anstrengendstes Gerät
  const avgRpePerApp = APPARATUS_LIST.map((app) => {
    const entries = rpeEntries.filter((r) => r.apparatus === app)
    if (entries.length === 0) return null
    const avg = entries.reduce((sum, r) => sum + r.rpe, 0) / entries.length
    return { app, avg: Math.round(avg * 10) / 10, count: entries.length }
  }).filter(Boolean) as { app: string; avg: number; count: number }[]

  if (avgRpePerApp.length > 0) {
    const hardest = avgRpePerApp.reduce((max, a) => (a.avg > max.avg ? a : max))
    insights.push(`Dein anstrengendstes Gerät: ${hardest.app} (Ø RPE ${hardest.avg})`)
  }

  // 2. Schlaf-Einfluss auf RPE
  const badSleep = sessions.filter((s) => s.sleep >= 5)
  const goodSleep = sessions.filter((s) => s.sleep < 5)
  if (badSleep.length >= 2 && goodSleep.length >= 2) {
    const diffs = APPARATUS_LIST.map((app) => {
      const bad = rpeEntries.filter((r) => badSleep.some((s) => s.id === r.session_id) && r.apparatus === app)
      const good = rpeEntries.filter((r) => goodSleep.some((s) => s.id === r.session_id) && r.apparatus === app)
      if (bad.length === 0 || good.length === 0) return null
      const badAvg = bad.reduce((sum, r) => sum + r.rpe, 0) / bad.length
      const goodAvg = good.reduce((sum, r) => sum + r.rpe, 0) / good.length
      return { app, diff: Math.round((badAvg - goodAvg) * 10) / 10 }
    }).filter(Boolean) as { app: string; diff: number }[]

    const maxDiff = diffs.length > 0 ? diffs.reduce((max, d) => (d.diff > max.diff ? d : max)) : null
    if (maxDiff && maxDiff.diff >= 0.5) {
      insights.push(
        `An Tagen mit schlechtem Schlaf ist deine RPE an ${maxDiff.app} im Schnitt ${maxDiff.diff} Punkte höher.`
      )
    }
  }

  // 3. Hooper-Trend
  const half = Math.floor(sessions.length / 2)
  const firstHalf = sessions.slice(0, half)
  const secondHalf = sessions.slice(half)
  const firstAvg = firstHalf.reduce((sum, s) => sum + s.hooper_total, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, s) => sum + s.hooper_total, 0) / secondHalf.length
  const diff = secondAvg - firstAvg
  // Niedrigerer Hooper = besseres Wohlbefinden
  if (diff < -1.5) insights.push('Dein Wohlbefinden hat sich über die letzten Einheiten verbessert. 📈')
  else if (diff > 1.5) insights.push('Dein Wohlbefinden hat sich über die letzten Einheiten leicht verschlechtert. Achte auf ausreichend Erholung.')
  else insights.push('Dein Wellness-Level ist über die letzten Einheiten stabil geblieben.')

  return insights
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<ParticipantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  const code = searchParams.get('code') ?? ''

  useEffect(() => {
    if (!code) { router.push('/'); return }

    fetch(`/api/participant?code=${code}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => setLoading(false))
  }, [code, router])

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--muted)', borderTopColor: '#7c3aed' }}
        />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Lade deine Daten...</p>
      </div>
    )
  }

  if (!data || !data.exists) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-4 text-center">
        <p className="text-white text-lg font-bold mb-2">Keine Daten gefunden</p>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Für Code <span className="font-mono text-white">{code}</span> existieren noch keine Einheiten.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Zurück zum Start
        </button>
      </div>
    )
  }

  const { sessions, rpeEntries, avgHooper, avgSessionRpe, stdDevHooper } = data
  const insights = calcInsights(sessions, rpeEntries)

  // Hooper-Chart Daten
  const hooперChartData = sessions.map((s) => ({
    date: formatDateShort(s.date),
    Hooper: s.hooper_total,
  }))

  // RPE-Chart Daten (eine Zeile pro Session, Werte pro Gerät)
  const rpeChartData = sessions.map((s) => {
    const row: Record<string, string | number> = { date: formatDateShort(s.date) }
    APPARATUS_LIST.forEach((app) => {
      const entry = rpeEntries.find((r) => r.session_id === s.id && r.apparatus === app)
      if (entry) row[app] = entry.rpe
    })
    if (s.session_rpe !== null && s.session_rpe !== undefined) {
      row['Gesamt'] = s.session_rpe
    }
    return row
  })

  // Welche Geräte haben überhaupt Daten?
  const apparatusWithData = APPARATUS_LIST.filter((app) =>
    rpeEntries.some((r) => r.apparatus === app)
  )
  const hasSessionRpe = sessions.some((s) => s.session_rpe !== null)

  const avgLine = avgHooper ?? undefined
  const upperBand = avgHooper !== null && stdDevHooper !== null ? avgHooper + stdDevHooper : undefined

  return (
    <div
      className="flex flex-col flex-1 px-4 py-8 max-w-lg mx-auto w-full transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/')}
          className="text-2xl"
          style={{ color: 'var(--muted)' }}
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Mein Dashboard</h1>
          <p className="text-sm font-mono" style={{ color: 'var(--muted)' }}>
            Code: {code} · {data.count} Einheit{data.count !== 1 ? 'en' : ''}
          </p>
        </div>
      </div>

      {/* Stats-Karten */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Einheiten', value: data.count, unit: '' },
          {
            label: 'Letztes Training',
            value: data.lastDate ? formatDateLong(data.lastDate) : '—',
            unit: '',
            small: true,
          },
          {
            label: 'Ø Hooper-Score',
            value: avgHooper?.toFixed(1) ?? '—',
            unit: '/28',
          },
          {
            label: 'Ø Session-RPE',
            value: avgSessionRpe?.toFixed(1) ?? '—',
            unit: '/10',
          },
        ].map(({ label, value, unit, small }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              {label.toUpperCase()}
            </p>
            <p className={`font-bold text-white ${small ? 'text-base' : 'text-2xl'}`}>
              {value}
              {unit && (
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--muted)' }}>
                  {unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Hooper-Chart */}
      {sessions.length >= 2 && (
        <div
          className="rounded-xl p-4 mb-5"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--muted)' }}>
            WELLNESS-VERLAUF (HOOPER-SCORE)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hooперChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              {/* Farbige Zonen */}
              <ReferenceArea y1={4} y2={10} fill="rgba(34,197,94,0.08)" />
              <ReferenceArea y1={10} y2={16} fill="rgba(234,179,8,0.08)" />
              <ReferenceArea y1={16} y2={28} fill="rgba(239,68,68,0.08)" />
              {/* Durchschnittslinie */}
              {avgLine !== undefined && (
                <ReferenceLine
                  y={avgLine}
                  stroke="#8b5cf6"
                  strokeDasharray="4 4"
                  label={{ value: `Ø ${avgLine}`, fill: '#8b5cf6', fontSize: 10, position: 'right' }}
                />
              )}
              {upperBand !== undefined && (
                <ReferenceLine
                  y={upperBand}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                />
              )}
              <XAxis
                dataKey="date"
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={{ stroke: '#30363d' }}
                tickLine={false}
              />
              <YAxis
                domain={[4, 28]}
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 8 }}
                labelStyle={{ color: '#8b949e', fontSize: 12 }}
                itemStyle={{ color: '#e6edf3' }}
              />
              <Line
                type="monotone"
                dataKey="Hooper"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs justify-center" style={{ color: 'var(--muted)' }}>
            <span style={{ color: '#22c55e' }}>▬ 4–10 gut</span>
            <span style={{ color: '#eab308' }}>▬ 11–16 mittel</span>
            <span style={{ color: '#ef4444' }}>▬ 17–28 hoch</span>
          </div>
        </div>
      )}

      {/* RPE-Chart */}
      {sessions.length >= 2 && (apparatusWithData.length > 0 || hasSessionRpe) && (
        <div
          className="rounded-xl p-4 mb-5"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--muted)' }}>
            RPE-VERLAUF PRO GERÄT
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rpeChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={{ stroke: '#30363d' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 8 }}
                labelStyle={{ color: '#8b949e', fontSize: 12 }}
                itemStyle={{ color: '#e6edf3' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#8b949e', paddingTop: 8 }}
              />
              {apparatusWithData.map((app) => (
                <Line
                  key={app}
                  type="monotone"
                  dataKey={app}
                  stroke={APPARATUS_COLORS[app]}
                  strokeWidth={2}
                  dot={{ fill: APPARATUS_COLORS[app], r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              ))}
              {hasSessionRpe && (
                <Line
                  type="monotone"
                  dataKey="Gesamt"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#ffffff', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>
            PERSÖNLICHE MUSTER
          </p>
          <div className="flex flex-col gap-2">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-3"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <p className="text-sm text-white">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length < 5 && (
        <div
          className="rounded-xl px-4 py-3 mb-5"
          style={{ backgroundColor: 'var(--card2)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Persönliche Muster erscheinen ab 5 Einheiten. Noch{' '}
            <span className="text-white font-semibold">{5 - sessions.length}</span> fehlend.
          </p>
        </div>
      )}

      <button
        onClick={() => router.push('/')}
        className="w-full py-4 rounded-xl font-bold text-lg text-white mt-2"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        Neue Einheit starten
      </button>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 items-center justify-center">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--muted)', borderTopColor: '#7c3aed' }}
          />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
