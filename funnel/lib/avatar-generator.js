/**
 * avatar-generator.js — Replicate / fal.ai Wrapper für Teenager-Avatare
 *
 * Generiert zwei Bilder:
 *   1. "current"  — gegenwärtiger Zustand (gedämpft, Bildschirm-Ermüdung)
 *   2. "future"   — 60 Tage später (energetisch, Talent-Setting)
 *
 * Wenn weder REPLICATE_API_TOKEN noch FAL_KEY gesetzt sind, fallen wir auf
 * Stock-Platzhalter zurück. Wenn das User-Foto fehlt, generieren wir generische
 * Avatare ohne Gesichts-Konsistenz (nur Style + Setting).
 *
 * Default-Provider: Replicate (Stable Diffusion XL + InstantID).
 * Wechsle via AVATAR_PROVIDER=fal in den Env-Vars.
 */

const PROVIDER = (process.env.AVATAR_PROVIDER || 'replicate').toLowerCase();

// Stock-Fallback (keine echten URLs — Frontend rendert dann einen stylisierten Placeholder)
const STOCK_AVATARS = {
  current: null,
  future: null,
  generatedBy: 'mock-no-api-key'
};

async function generateAvatars({ photoBase64, skipped, age, gender, primaryTalent }) {
  if (skipped || !photoBase64) {
    // Kein User-Foto → wir liefern Style-Hints für das Frontend, kein generiertes Bild.
    return {
      current: null,
      future: null,
      generatedBy: skipped ? 'skipped' : 'no-photo',
      hints: {
        currentMood: 'thoughtful, slightly tired, neutral',
        futureMood: `engaged in ${primaryTalent || 'creative work'}, warm light, confident`
      }
    };
  }

  if (PROVIDER === 'fal') return generateViaFal({ photoBase64, age, gender, primaryTalent });
  return generateViaReplicate({ photoBase64, age, gender, primaryTalent });
}

async function generateViaReplicate({ photoBase64, age, gender, primaryTalent }) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return { ...STOCK_AVATARS, generatedBy: 'mock-no-replicate-token' };

  const promptCurrent = buildPromptCurrent({ age, gender });
  const promptFuture = buildPromptFuture({ age, gender, primaryTalent });

  // Replicate model: lucataco/sdxl-instantid (oder eigener gepinnter Hash)
  const model = process.env.REPLICATE_INSTANTID_MODEL || 'lucataco/sdxl-instantid:af5ddc...';

  try {
    const [current, future] = await Promise.all([
      runReplicate(token, model, { prompt: promptCurrent, image: photoBase64, num_steps: 30 }),
      runReplicate(token, model, { prompt: promptFuture, image: photoBase64, num_steps: 30 })
    ]);
    return {
      current: current.url || null,
      future: future.url || null,
      generatedBy: 'replicate',
      model
    };
  } catch (err) {
    console.error('[avatar-generator] Replicate failed', err.message);
    return { ...STOCK_AVATARS, generatedBy: 'mock-fallback-on-error', error: err.message };
  }
}

async function runReplicate(token, model, input) {
  // Synchrones Replicate-Pattern: POST → predictions, dann Polling.
  // Vereinfacht: wir nutzen den /predictions Endpoint mit "wait" Header.
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=60'  // Bis zu 60s warten, dann Polling-Token zurück
    },
    body: JSON.stringify({ version: model.split(':')[1] || model, input })
  });
  if (!res.ok) throw new Error(`Replicate ${res.status}`);
  const data = await res.json();
  if (data.status === 'succeeded' && data.output) {
    return { url: Array.isArray(data.output) ? data.output[0] : data.output };
  }
  // Falls noch nicht fertig — pollen
  return pollReplicate(token, data.urls && data.urls.get);
}

async function pollReplicate(token, statusUrl) {
  if (!statusUrl) return { url: null };
  const start = Date.now();
  while (Date.now() - start < 60_000) {
    await new Promise(r => setTimeout(r, 2500));
    const res = await fetch(statusUrl, { headers: { 'Authorization': `Token ${token}` } });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === 'succeeded') return { url: Array.isArray(data.output) ? data.output[0] : data.output };
    if (data.status === 'failed' || data.status === 'canceled') throw new Error('Prediction ' + data.status);
  }
  throw new Error('Replicate timeout');
}

async function generateViaFal({ photoBase64, age, gender, primaryTalent }) {
  const key = process.env.FAL_KEY;
  if (!key) return { ...STOCK_AVATARS, generatedBy: 'mock-no-fal-key' };

  // fal.ai equivalent — TODO bei Bedarf implementieren
  return { ...STOCK_AVATARS, generatedBy: 'fal-not-implemented' };
}

function buildPromptCurrent({ age, gender }) {
  const subject = (gender === 'Mädchen') ? 'teenage girl' : (gender === 'Junge') ? 'teenage boy' : 'teenager';
  return `Realistic portrait of a ${age}-year-old ${subject}, looking thoughtful and slightly tired, contemporary German indoor setting, photographic style, natural lighting, slight blue light reflection on face suggesting screen exposure, neutral expression, high detail, 4k`;
}

function buildPromptFuture({ age, gender, primaryTalent }) {
  const subject = (gender === 'Mädchen') ? 'teenage girl' : (gender === 'Junge') ? 'teenage boy' : 'teenager';
  const setting = mapTalentToSetting(primaryTalent);
  return `Realistic portrait of the same ${age}-year-old ${subject}, looking energetic and engaged, ${setting}, photographic style, natural warm lighting, confident expression, high detail, 4k`;
}

function mapTalentToSetting(talent) {
  if (!talent) return 'in inspiring environment, workshop or creative space';
  const t = talent.toLowerCase();
  if (t.includes('cod') || t.includes('tech') || t.includes('ki')) return 'sitting at a modern minimalist desk with a laptop, focused';
  if (t.includes('musik')) return 'in a small home music studio with instruments visible';
  if (t.includes('kunst') || t.includes('schreib')) return 'in a bright art studio or by a window with notebook';
  if (t.includes('sport')) return 'in athletic training environment, outdoor or modern gym';
  if (t.includes('wirtschaft') || t.includes('unternehm')) return 'in a clean co-working space with notes and laptop';
  if (t.includes('wissenschaft')) return 'in a science lab or library setting';
  return `in inspiring environment matching ${talent}, workshop or creative space`;
}

module.exports = { generateAvatars };
