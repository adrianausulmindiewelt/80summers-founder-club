-- Jung und Hungrig — Digital-Reality-Check Funnel
-- Supabase / Postgres Schema

-- Extension für UUIDs (in Supabase oft schon aktiv)
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────
-- quiz_submissions
-- Eine Zeile pro Quiz-Durchlauf (UUID = Funnel-Session)
-- ────────────────────────────────────────────
create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  uuid text unique not null,                    -- Frontend-generated UUID
  contact_email text,
  contact_name text,                             -- Name des Kindes
  contact_phone text,
  answers jsonb,                                 -- Stage 1: 10 Antworten
  stage2 jsonb,                                  -- Stage 2: 4 Antworten + photo metadata
  profile jsonb,                                 -- {key, name}
  forecast jsonb,                                -- 5-Jahres-Prognose-Werte
  plan jsonb,                                    -- {markdown, generatedBy, model, usage}
  avatars jsonb,                                 -- {current, future, generatedBy}
  status text default 'in_progress',             -- in_progress | stage-1-complete | stage-2-complete | done | purchased
  stripe_customer_id text,
  stripe_session_id text,
  purchased_at timestamptz,
  upsell_subscribed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_quiz_submissions_email on public.quiz_submissions(contact_email);
create index if not exists idx_quiz_submissions_status on public.quiz_submissions(status);
create index if not exists idx_quiz_submissions_created on public.quiz_submissions(created_at desc);

-- ────────────────────────────────────────────
-- quiz_events
-- Granulare Events für Funnel-Analytics (Drop-off pro Frage etc.)
-- ────────────────────────────────────────────
create table if not exists public.quiz_events (
  id bigserial primary key,
  uuid text,                                     -- FK auf quiz_submissions.uuid (locker)
  event text not null,                           -- z.B. "stage_1_submit", "view_ergebnis", "click_stage2"
  props jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_quiz_events_uuid on public.quiz_events(uuid);
create index if not exists idx_quiz_events_event on public.quiz_events(event);

-- ────────────────────────────────────────────
-- Storage Bucket für Foto-Uploads (24h Auto-Löschung via Edge Function / Cron)
-- Manuell anlegen im Supabase Dashboard:
--    bucket: "quiz-photos"  (private)
--    Policy: nur service_role darf write
-- ────────────────────────────────────────────

-- ────────────────────────────────────────────
-- RLS — Submissions sind privat, nur service_role kann lesen/schreiben.
-- ────────────────────────────────────────────
alter table public.quiz_submissions enable row level security;
alter table public.quiz_events enable row level security;

-- Keine public policies — nur service_role (über Server-API) hat Zugriff.

-- Ende.
