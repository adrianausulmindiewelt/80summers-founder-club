/**
 * POST /api/quiz/stage-2-submit
 *
 * Body: { uuid, stage2 }
 * Speichert die Stage-2-Antworten + Foto und triggert die Plan-Generierung.
 */

const { upsertSubmission, getSubmissionByUuid, trackEvent } = require('../../funnel/lib/supabase-store.js');
const { upsertContact, triggerEvent } = require('../../funnel/lib/brevo-client.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const body = await readBody(req);
  const { uuid, stage2 } = body || {};
  if (!uuid || !stage2) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'uuid and stage2 required' }));
  }

  // Foto separat behandeln (groß) — wir speichern es nicht 1:1 in Supabase,
  // sondern nur den Pfad zu einem Storage-Bucket. Für jetzt: foto bleibt im
  // Body und wird vom Avatar-Generator direkt gelesen.
  const stage2Sanitized = { ...stage2, photoBase64: stage2.photoBase64 ? '[present]' : null };

  await Promise.all([
    upsertSubmission({
      uuid,
      stage2: stage2Sanitized,
      status: 'stage-2-complete',
      contact: {} // wird durch on_conflict merge nicht überschrieben
    }).catch(e => console.warn('[stage-2] supabase fail', e.message)),
    trackEvent(uuid, 'stage_2_submit', {}).catch(() => {})
  ]);

  // Existing contact upgrade
  try {
    const row = await getSubmissionByUuid(uuid);
    if (row && row.contact_email) {
      await upsertContact({
        email: row.contact_email,
        firstName: row.contact_name,
        attrs: { QUIZ_STAGE: 'stage-2-complete' }
      });
      await triggerEvent(row.contact_email, 'quiz_stage_2_complete', { uuid });
    }
  } catch (e) { console.warn('[stage-2] brevo fail', e.message); }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ status: 'ok', uuid }));
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 12 * 1024 * 1024) { req.destroy(); resolve({}); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
