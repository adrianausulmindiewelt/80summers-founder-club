/**
 * POST /api/quiz/stage-1-submit
 *
 * Body: { uuid, answers, contact, startedAt }
 *
 * 1. Berechnet das Profil serverseitig.
 * 2. Speichert die Submission in Supabase (best-effort).
 * 3. Legt den Brevo-Kontakt an + triggert das "stage-1-complete" Event
 *    (für die Email-Sequenz aus /funnel/emails/).
 */

const { calculateProfile, fiveYearForecast, profileNameForChild } = require('../../funnel/profile-scoring.js');
const { upsertSubmission, trackEvent } = require('../../funnel/lib/supabase-store.js');
const { upsertContact, triggerEvent } = require('../../funnel/lib/brevo-client.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const body = await readBody(req);
  const { uuid, answers, contact, startedAt } = body || {};
  if (!uuid || !answers || !contact || !contact.email || !contact.childname) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'uuid, answers, contact{email,childname} required' }));
  }

  // 1. Profil + Forecast berechnen
  const result = calculateProfile(answers);
  const profile = result.profile;
  const forecast = fiveYearForecast(answers, result.key);
  const profileName = profileNameForChild(profile, answers.gender);

  // 2. Persist (parallel, best-effort)
  const submittedAt = new Date().toISOString();
  await Promise.all([
    upsertSubmission({
      uuid, contact, answers,
      profile: { key: result.key, name: profileName },
      forecast,
      status: 'stage-1-complete',
      startedAt
    }).catch(e => console.warn('[stage-1] supabase fail', e.message)),
    upsertContact({
      email: contact.email,
      firstName: contact.childname,
      attrs: {
        QUIZ_UUID: uuid,
        QUIZ_PROFILE: profileName,
        QUIZ_PHONE: contact.phone || '',
        QUIZ_STAGE: 'stage-1-complete'
      }
    }).catch(e => console.warn('[stage-1] brevo upsert fail', e.message)),
    triggerEvent(contact.email, 'quiz_stage_1_complete', {
      uuid, profile: profileName, child: contact.childname
    }).catch(e => console.warn('[stage-1] brevo event fail', e.message)),
    trackEvent(uuid, 'stage_1_submit', { profile: result.key }).catch(() => {})
  ]);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    status: 'ok',
    uuid,
    profile: { key: result.key, name: profileName, slug: profile.slug },
    forecast,
    redirectTo: `/check-ergebnis.html?uuid=${encodeURIComponent(uuid)}`
  }));
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 2 * 1024 * 1024) { req.destroy(); resolve({}); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
