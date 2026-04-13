'use client'

import { useState } from 'react'

export default function QrPage() {
  const [url, setUrl] = useState('')
  const [generated, setGenerated] = useState(false)

  // QR-Code wird serverseitig über die API generiert
  function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerated(true)
  }

  const qrUrl = url ? `/api/qr?url=${encodeURIComponent(url)}` : ''

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h1 className="text-xl font-bold text-white mb-1">QR-Code Generator</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Gib die Vercel-URL deiner App ein
        </p>

        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              APP-URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setGenerated(false) }}
              placeholder="https://deine-app.vercel.app"
              required
              className="w-full rounded-xl px-4 py-3 text-white outline-none"
              style={{
                backgroundColor: 'var(--card2)',
                border: '1px solid var(--border)',
                fontSize: 16,
              }}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            QR-Code generieren
          </button>
        </form>

        {generated && url && (
          <div className="mt-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR-Code"
              className="mx-auto rounded-xl"
              style={{ backgroundColor: 'white', padding: 16, width: 240, height: 240 }}
            />
            <a
              href={qrUrl}
              download="fragebogen-qr.png"
              className="block mt-4 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ backgroundColor: '#16a34a' }}
            >
              Als PNG herunterladen
            </a>
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
              Drucke den QR-Code aus und hänge ihn im Gym auf.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
