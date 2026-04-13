# Gerätturnen Fragebogen — Masterarbeit

Mobile-first Fragebogen-App für die Erfassung von Hooper-Index und RPE im Gerätturnen.

## Deployment in 4 Schritten

### Schritt 1: Supabase einrichten

1. Gehe zu [supabase.com](https://supabase.com) → "Start your project" → kostenloses Konto erstellen
2. Neues Projekt erstellen (Region: EU West)
3. Im Dashboard: **SQL Editor** → **New query** → den Inhalt von `supabase/schema.sql` einfügen → **Run**
4. **Project Settings** → **API** → folgende Werte notieren:
   - `Project URL` → wird zu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` Key → wird zu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Schritt 2: GitHub Repository erstellen

```bash
cd /Users/julianhurm/Desktop/Master
git init
git add .
git commit -m "Initial commit: Gerätturnen Fragebogen"
```

Dann auf github.com ein neues (leeres) Repository erstellen und:

```bash
git remote add origin https://github.com/DEIN-USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

### Schritt 3: Vercel deployen

1. Gehe zu [vercel.com](https://vercel.com) → Mit GitHub anmelden
2. "Add New Project" → dein Repository auswählen → "Import"
3. **Environment Variables** hinzufügen:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | deine Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dein Supabase anon Key |
| `ADMIN_PASSWORD` | selbst gewähltes Passwort (z.B. `turnen2026`) |

4. "Deploy" klicken → in ~2 Minuten ist die App live

### Schritt 4: QR-Code generieren

1. Öffne `https://deine-app.vercel.app/qr`
2. Gib die Vercel-URL ein
3. QR-Code als PNG herunterladen und ausdrucken

---

## Routen

| Route | Beschreibung |
|-------|-------------|
| `/` | Fragebogen Start (Teilnehmercode + Datum) |
| `/hooper` | Hooper-Index (Screen 2) |
| `/rpe` | RPE-Bewertung pro Gerät (Screen 3) |
| `/done` | Bestätigung & Zusammenfassung (Screen 4) |
| `/admin` | Admin-Dashboard (passwortgeschützt) |
| `/qr` | QR-Code Generator |

## Lokale Entwicklung

```bash
# .env.local erstellen
cp .env.local.example .env.local
# Werte aus Supabase eintragen

# Dev-Server starten
npm run dev
# → http://localhost:3000
```

## CSV-Export Struktur (SPSS-kompatibel)

```
Code;Datum;Timestamp;Schlaf;Stress;Muedigkeit;Muskelkater;Hooper_Total;Geraet;RPE
1234;2026-04-15;2026-04-15T14:30:00Z;3;2;4;2;11;Boden;6
1234;2026-04-15;2026-04-15T14:30:00Z;3;2;4;2;11;Ringe;8
```

- **Trennzeichen:** Semikolon (SPSS-Standard)
- **Encoding:** UTF-8 mit BOM (Excel-kompatibel)
- **Eine Zeile pro Gerät** (Session-Daten werden wiederholt)
