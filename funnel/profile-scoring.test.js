/**
 * Tests für profile-scoring.js
 *
 * Lauf: `node funnel/profile-scoring.test.js`
 * Keine externen Dependencies — pure Node.
 */

const { calculateProfile, fiveYearForecast, PROFILES, PROFILE_ORDER } = require('./profile-scoring.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.error('  ✗ ' + name + '\n      ' + e.message); failed++; }
}

function assertEq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || 'assertEq') + ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log('\n— Profile Scoring Tests —\n');

// ── Profil-Zuweisungen
test('Hohe Bildschirmzeit + wenig Soziales + keine Talente → silent_consumer', () => {
  const r = calculateProfile({
    age: 14, screenHours: 6, offlineHours: 2, connection: 5,
    reaction: 'Wird gereizt und frustriert',
    initiative: 'Schon länger als ein Jahr her',
    activities: ['YouTube / Streaming','TikTok / Instagram / Snapchat'],
    talents: ['Aktuell sehe ich keine sichtbaren Talente'],
    worry: 'Mehreres davon'
  });
  assertEq(r.key, 'silent_consumer');
});

test('Aggressiv beim Entzug + viel Gaming → reactive_gamer', () => {
  const r = calculateProfile({
    age: 15, screenHours: 6, offlineHours: 4, connection: 5,
    reaction: 'Wird aggressiv oder zieht sich völlig zurück',
    initiative: 'Vor 3–12 Monaten',
    activities: ['Gaming (Multiplayer / Online)','Gaming (Singleplayer)'],
    talents: ['Tech / Coden / Computer / KI','Gaming als Profession'],
    worry: 'Dass es psychisch nicht stabil bleibt'
  });
  assertEq(r.key, 'reactive_gamer');
});

test('Erstellt eigene Inhalte + Tech → hidden_creator', () => {
  const r = calculateProfile({
    age: 16, screenHours: 4, offlineHours: 8, connection: 7,
    reaction: 'Etwas unruhig, aber okay',
    initiative: 'Im letzten Monat',
    activities: ['Eigene Inhalte erstellen (Videos, Musik, Code)','Lernen / Schule'],
    talents: ['Tech / Coden / Computer / KI','Kreativität (Musik, Kunst, Schreiben)'],
    worry: 'Dass es im Beruf nicht mithalten kann (KI-Wirtschaft)'
  });
  assertEq(r.key, 'hidden_creator');
});

test('Hohe Sozialkontakte + Social Media → social_floater', () => {
  const r = calculateProfile({
    age: 15, screenHours: 5, offlineHours: 14, connection: 6,
    reaction: 'Etwas unruhig, aber okay',
    initiative: 'Vor 1–3 Monaten',
    activities: ['TikTok / Instagram / Snapchat','Chat mit Freunden'],
    talents: ['Soziales / Kommunikation','Mode'],
    worry: 'Dass es seine echte Identität verliert'
  });
  assertEq(r.key, 'social_floater');
});

test('Eigeninitiative diese Woche + klare Talente + hohe Verbundenheit → early_starter', () => {
  const r = calculateProfile({
    age: 17, screenHours: 2.5, offlineHours: 10, connection: 9,
    reaction: 'Bleibt entspannt',
    initiative: 'In den letzten 2 Wochen',
    activities: ['Lernen / Schule','Eigene Inhalte erstellen (Videos, Musik, Code)'],
    talents: ['Wirtschaft / Unternehmertum','Wissenschaft / Forschung'],
    worry: 'Dass es im Beruf nicht mithalten kann (KI-Wirtschaft)'
  });
  assertEq(r.key, 'early_starter');
});

test('Mittlere Werte + wenig Initiative → silent_observer', () => {
  const r = calculateProfile({
    age: 14, screenHours: 3.5, offlineHours: 7, connection: 6,
    reaction: 'Etwas unruhig, aber okay',
    initiative: 'Vor 3–12 Monaten',
    activities: ['YouTube / Streaming','Lernen / Schule'],
    talents: ['Kreativität (Musik, Kunst, Schreiben)'],
    worry: 'Dass es nie selbstständig wird'
  });
  assertEq(r.key, 'silent_observer');
});

// ── Determinismus
test('Gleiche Antworten geben gleichen Profil-Typ', () => {
  const a = { age: 15, screenHours: 4, offlineHours: 6, connection: 6,
    reaction: 'Etwas unruhig, aber okay', initiative: 'Im letzten Monat',
    activities: ['YouTube / Streaming'], talents: ['Sport / Bewegung'] };
  const r1 = calculateProfile(a);
  const r2 = calculateProfile({ ...a });
  assertEq(r1.key, r2.key);
});

// ── Forecast
test('Forecast: Hohe Bildschirmzeit → höherer Depressions-Faktor', () => {
  const fLow = fiveYearForecast({ age: 14, screenHours: 1, offlineHours: 12 }, 'early_starter');
  const fHigh = fiveYearForecast({ age: 14, screenHours: 7, offlineHours: 2 }, 'silent_consumer');
  if (!(fHigh.depressionMultiplier > fLow.depressionMultiplier)) {
    throw new Error(`expected depressionMultiplier high (${fHigh.depressionMultiplier}) > low (${fLow.depressionMultiplier})`);
  }
});

test('Forecast: Sozialkontakte 0 → max socialReductionPct', () => {
  const f = fiveYearForecast({ age: 14, screenHours: 4, offlineHours: 0 }, 'silent_consumer');
  if (f.socialReductionPct < 50) throw new Error('expected high reduction at offlineHours=0');
});

test('Forecast: Lebenszeit am Bildschirm linear in screenHours', () => {
  const f1 = fiveYearForecast({ age: 14, screenHours: 2, offlineHours: 8 }, 'silent_observer');
  const f2 = fiveYearForecast({ age: 14, screenHours: 4, offlineHours: 8 }, 'silent_observer');
  // f2 sollte ~ 2x von f1 sein
  if (Math.abs(f2.yearsAtScreen5y - 2 * f1.yearsAtScreen5y) > 0.3) {
    throw new Error(`expected linear scaling: ${f1.yearsAtScreen5y} vs ${f2.yearsAtScreen5y}`);
  }
});

// ── Sanity: alle 6 Profile haben Pflicht-Felder
test('Alle 6 Profile haben name, traits[3], shortDesc', () => {
  PROFILE_ORDER.forEach(k => {
    const p = PROFILES[k];
    if (!p.name) throw new Error(`${k}: name fehlt`);
    if (!p.shortDesc) throw new Error(`${k}: shortDesc fehlt`);
    if (!Array.isArray(p.traits) || p.traits.length !== 3) throw new Error(`${k}: traits muss 3 enthalten`);
    p.traits.forEach((t, i) => {
      if (!t.icon || !t.label || !t.body) throw new Error(`${k}.traits[${i}]: icon/label/body fehlt`);
    });
  });
});

// ── Edge Cases
test('Leere Antworten brechen nichts', () => {
  const r = calculateProfile({});
  if (!r || !r.key) throw new Error('Result should still have a key');
});

test('Slider-Werte können 0 sein', () => {
  const r = calculateProfile({ age: 14, screenHours: 0, offlineHours: 0, connection: 1 });
  if (!r || !r.key) throw new Error('Should not crash on zeros');
});

console.log(`\n${passed} passed · ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
