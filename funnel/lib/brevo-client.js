/**
 * brevo-client.js — Brevo (ex-Sendinblue) Wrapper für Email-Sequenzen
 *
 * Wenn BREVO_API_KEY fehlt, no-op. Funnel läuft trotzdem.
 *
 * Listen-IDs / Template-IDs / Automation-Trigger müssen im Brevo-Dashboard
 * angelegt werden — siehe README_FUNNEL.md.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const LIST_ID_FUNNEL = parseInt(process.env.BREVO_LIST_ID || '0') || null;

function isConfigured() { return !!BREVO_API_KEY; }

async function upsertContact({ email, firstName, attrs = {}, listIds = [] }) {
  if (!isConfigured()) return null;
  const allLists = LIST_ID_FUNNEL ? [LIST_ID_FUNNEL, ...listIds] : listIds;

  // CREATE oder UPDATE in einem Schritt: POST /contacts mit updateEnabled=true
  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      email,
      attributes: {
        FIRSTNAME: firstName || '',
        ...attrs
      },
      listIds: allLists,
      updateEnabled: true
    })
  });
  if (!res.ok && res.status !== 204) {
    const t = await res.text();
    throw new Error(`Brevo upsert ${res.status}: ${t.slice(0, 200)}`);
  }
  return true;
}

async function triggerEvent(email, eventName, props = {}) {
  if (!isConfigured()) return null;
  // Brevo Marketing Automation triggert auf Custom Events:
  // POST /events
  const res = await fetch('https://in-automate.brevo.com/api/v2/trackEvent', {
    method: 'POST',
    headers: {
      'ma-key': process.env.BREVO_MA_KEY || BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      event: eventName,
      properties: props
    })
  });
  // Brevo MA gibt manchmal 204 zurück
  if (!res.ok && res.status !== 204) {
    const t = await res.text();
    console.warn(`[brevo] event ${eventName} failed: ${res.status} ${t.slice(0, 200)}`);
  }
  return true;
}

async function sendTransactional({ to, templateId, params = {} }) {
  if (!isConfigured()) return null;
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ to: [{ email: to }], templateId, params })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Brevo send ${res.status}: ${t.slice(0, 200)}`);
  }
  return true;
}

module.exports = { upsertContact, triggerEvent, sendTransactional, isConfigured };
