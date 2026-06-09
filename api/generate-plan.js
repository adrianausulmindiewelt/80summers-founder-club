/**
 * POST /api/generate-plan
 *
 * Generiert den 60-Tage-Plan via Claude (Anthropic) und 2 Avatare via Replicate
 * (oder fal.ai). Schreibt das Ergebnis nach Supabase.
 *
 * Body: { uuid, answers, stage2, contact, profile, forecast }
 *
 * Antwort:
 *  - {status:'done', plan:{...}, avatars:{...}}  bei synchroner Verarbeitung (kurzer Lauf)
 *  - {status:'queued'}                            bei langem Job → Frontend pollt /api/plan-status
 *
 * Mock-Fallback: wenn ANTHROPIC_API_KEY fehlt, antwortet der Endpoint mit einem
 * deterministischen Mock-Plan, sodass das Frontend ohne Setup End-to-End läuft.
 */

const { generatePlanWithClaude, MOCK_PLAN } = require('../funnel/lib/plan-generator.js');
const { generateAvatars } = require('../funnel/lib/avatar-generator.js');
const { upsertSubmission } = require('../funnel/lib/supabase-store.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  } else if (!body) {
    body = await readJson(req);
  }

  const { uuid, answers, stage2, contact, profile, forecast } = body || {};
  if (!uuid || !answers || !contact) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'uuid, answers, contact required' }));
  }

  const childname = (contact.childname || '').trim() || 'dein Kind';
  const age = parseInt(answers.age) || 14;
  const gender = answers.gender || '';

  try {
    // Plan + Avatare parallel
    const [planResult, avatarResult] = await Promise.all([
      generatePlanWithClaude({ childname, age, gender, profile, answers, stage2, forecast }),
      generateAvatars({
        photoBase64: stage2 && stage2.photoBase64,
        skipped: !!(stage2 && stage2.photoSkipped),
        age, gender,
        primaryTalent: pickPrimaryTalent(answers, stage2)
      })
    ]);

    // Persist (best-effort — wir blockieren nicht bei Supabase-Ausfall)
    try {
      await upsertSubmission({
        uuid,
        contact,
        answers,
        stage2,
        profile,
        forecast,
        plan: planResult,
        avatars: avatarResult,
        status: 'done',
        completedAt: new Date().toISOString()
      });
    } catch (e) { console.warn('[generate-plan] supabase upsert failed', e.message); }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      status: 'done',
      plan: planResult,
      avatars: avatarResult
    }));
  } catch (err) {
    console.error('[generate-plan] error', err);
    // Fallback: Mock-Plan, damit das Frontend nie ins Leere läuft
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      status: 'done',
      plan: { markdown: MOCK_PLAN(childname, (profile && profile.name) || 'Profil'), generatedBy: 'mock-fallback', error: err.message },
      avatars: { current: null, future: null, generatedBy: 'mock-fallback' }
    }));
  }
};

function pickPrimaryTalent(answers, stage2) {
  if (stage2 && Array.isArray(stage2.talents_specific) && stage2.talents_specific.length > 0) {
    return stage2.talents_specific[0];
  }
  if (Array.isArray(answers.talents) && answers.talents.length > 0) {
    return answers.talents[0];
  }
  return 'Wachstum';
}

function readJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 10 * 1024 * 1024) { req.destroy(); resolve({}); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
