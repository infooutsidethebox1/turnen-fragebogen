import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL fehlt' }, { status: 400 })
  }

  // URL-Validierung
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Ungültige URL' }, { status: 400 })
  }

  const pngBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: 800,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  })

  return new NextResponse(pngBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
