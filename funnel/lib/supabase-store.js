/**
 * supabase-store.js — minimaler Supabase-Wrapper für den Funnel
 *
 * Wenn SUPABASE_URL / SUPABASE_SERVICE_KEY fehlen, no-op (return null) — der
 * Funnel funktioniert dann mit localStorage als single source of truth.
 *
 * Tabellen-Schema siehe ./supabase-schema.sql
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function isConfigured() { return !!(SUPABASE_URL && SUPABASE_KEY); }

async function upsertSubmission(record) {
  if (!isConfigured()) return null;
  const url = `${SUPABASE_URL}/rest/v1/quiz_submissions?on_conflict=uuid`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({
      uuid: record.uuid,
      contact_email: record.contact && record.contact.email,
      contact_name: record.contact && record.contact.childname,
      contact_phone: record.contact && record.contact.phone,
      answers: record.answers,
      stage2: record.stage2,
      profile: record.profile,
      forecast: record.forecast,
      plan: record.plan,
      avatars: record.avatars,
      status: record.status || 'in_progress',
      started_at: record.startedAt || null,
      completed_at: record.completedAt || null,
      updated_at: new Date().toISOString()
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase upsert ${res.status}: ${t.slice(0, 200)}`);
  }
  return true;
}

async function getSubmissionByUuid(uuid) {
  if (!isConfigured()) return null;
  const url = `${SUPABASE_URL}/rest/v1/quiz_submissions?uuid=eq.${encodeURIComponent(uuid)}&limit=1`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(`Supabase get ${res.status}`);
  const arr = await res.json();
  return arr[0] || null;
}

async function trackEvent(uuid, event, props = {}) {
  if (!isConfigured()) return null;
  const url = `${SUPABASE_URL}/rest/v1/quiz_events`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ uuid, event, props, created_at: new Date().toISOString() })
  }).catch(() => {});
}

module.exports = { upsertSubmission, getSubmissionByUuid, trackEvent, isConfigured };
