-- ============================================================
-- Fragebogen Gerätturnen — Supabase Schema
-- Führe dieses SQL in deinem Supabase-Projekt aus:
-- Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- Sessions-Tabelle (Hooper-Index pro Trainingseinheit)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  participant_code varchar(10) not null,
  date date not null,
  created_at timestamp with time zone default now(),
  sleep int not null check (sleep between 1 and 7),
  stress int not null check (stress between 1 and 7),
  fatigue int not null check (fatigue between 1 and 7),
  soreness int not null check (soreness between 1 and 7),
  hooper_total int generated always as (sleep + stress + fatigue + soreness) stored,
  session_rpe int check (session_rpe between 0 and 10)  -- Gesamt-Session-RPE (am Ende der Einheit)
);

-- RPE-Tabelle (ein Eintrag pro Gerät pro Einheit)
create table if not exists rpe_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  apparatus varchar(20) not null check (apparatus in ('Boden', 'Ringe', 'Reck', 'Barren', 'Sprung')),
  rpe int not null check (rpe between 0 and 10),
  created_at timestamp with time zone default now(),
  -- Jedes Gerät nur einmal pro Session (für Upsert)
  unique (session_id, apparatus)
);

-- Row Level Security deaktivieren (da kein Auth-System)
alter table sessions disable row level security;
alter table rpe_entries disable row level security;

-- Migration für bestehende Datenbanken:
-- alter table sessions add column if not exists session_rpe int check (session_rpe between 0 and 10);

-- Indexes für Admin-Abfragen
create index if not exists idx_sessions_participant_code on sessions(participant_code);
create index if not exists idx_sessions_date on sessions(date);
create index if not exists idx_rpe_entries_session_id on rpe_entries(session_id);
