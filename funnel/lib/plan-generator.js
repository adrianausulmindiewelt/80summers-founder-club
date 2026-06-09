/**
 * plan-generator.js — Claude API Wrapper für den 60-Tage-Plan
 *
 * Falls ANTHROPIC_API_KEY nicht gesetzt ist, fällt das Modul auf einen
 * Mock-Plan zurück, sodass der Funnel End-to-End läuft.
 *
 * Modell: claude-sonnet-4-6 (Sonnet 4.6 — Stand 2026-05).
 * Wenn du Opus 4.7 nutzen willst, ändere PLAN_MODEL.
 */

const PLAN_MODEL = process.env.ANTHROPIC_PLAN_MODEL || 'claude-sonnet-4-6';

async function generatePlanWithClaude({ childname, age, gender, profile, answers, stage2, forecast }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      markdown: MOCK_PLAN(childname, (profile && profile.name) || 'Profil'),
      generatedBy: 'mock-no-api-key',
      model: null
    };
  }

  const prompt = buildPlanPrompt({ childname, age, gender, profile, answers, stage2, forecast });

  // SDK-frei via fetch — funktioniert in Vercel Node-Functions ohne externe Deps.
  // Falls @anthropic-ai/sdk installiert ist, kann das ersetzt werden.
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: PLAN_MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        system: SYSTEM_PROMPT
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${txt.slice(0, 200)}`);
    }
    const data = await response.json();
    const markdown = (data.content && data.content[0] && data.content[0].text) || '';
    if (!markdown) throw new Error('Empty response from Claude');

    return {
      markdown,
      generatedBy: 'claude',
      model: PLAN_MODEL,
      usage: data.usage || null
    };
  } catch (err) {
    console.error('[plan-generator] Claude call failed', err.message);
    return {
      markdown: MOCK_PLAN(childname, (profile && profile.name) || 'Profil'),
      generatedBy: 'mock-fallback-on-error',
      model: null,
      error: err.message
    };
  }
}

const SYSTEM_PROMPT = `Du bist Adrian Schimmelpfennig, Gründer von "Jung und Hungrig" — einem Berliner Förderclub für ambitionierte 15–18-jährige Teenager. Du sprichst Eltern direkt und persönlich an, mit warmer aber klarer Stimme. Deine Sprache ist nie klinisch, nie bewertend, immer respektvoll gegenüber dem Kind. Du machst keine falschen Versprechen. Du erwähnst Risiken ehrlich. Du schreibst wie ein älterer Bruder, nicht wie ein Coach.`;

function buildPlanPrompt({ childname, age, gender, profile, answers, stage2, forecast }) {
  const profileType = (profile && profile.name) || 'unbestimmt';
  const screenHours = answers.screenHours;
  const offlineHours = answers.offlineHours;
  const reaction = answers.reaction;
  const initiative = answers.initiative;
  const acts = (answers.activities || []).join(', ');
  const talents1 = (answers.talents || []).join(', ');
  const talents2 = [
    ...(stage2 && stage2.talents_specific || []),
    ...(stage2 && stage2.talents_custom || [])
  ].join(', ');
  const learningStyle = stage2 && stage2.learning_style;
  const dream = stage2 && stage2.dream;
  const worry = answers.worry;
  const connection = answers.connection;
  const parentTime = stage2 && stage2.parent_time;
  const pronoun = gender === 'Mädchen' ? 'sie' : (gender === 'Junge' ? 'er' : 'es');

  return `Erstelle einen vollständig personalisierten 60-Tage-Plan für ${childname} (${age} Jahre, ${gender || 'divers'}):

**Profil-Typ:** ${profileType}
**Bildschirmzeit:** ${screenHours}h täglich
**Aktivitäten:** ${acts || '—'}
**Reaktion auf Handy-Entzug:** ${reaction || '—'}
**Eigeninitiative-Frequenz:** ${initiative || '—'}
**Offline-Sozialkontakte:** ${offlineHours}h/Woche
**Talente (Stufe 1):** ${talents1 || '—'}
**Konkrete Talente (Stufe 2):** ${talents2 || '—'}
**Lernweise:** ${learningStyle || '—'}
**Traum:** ${dream || '—'}
**Größte Eltern-Sorge:** ${worry || '—'}
**Eltern-Kind-Verbundenheit:** ${connection}/10
**Verfügbare Eltern-Zeit:** ${parentTime || '—'}

Struktur des Plans:

# ${childname}s 60-Tage-Plan: Vom Profil "${profileType}" zur strukturierten Entfaltung

## Persönliche Einleitung (200 Wörter)
Sprich ${childname}s Eltern direkt an. Nimm die Sorge ernst. Mache keine falschen Versprechen.

## Phase 1 — Wochen 1–2: "Die Grundlage"
Konkretes Wochenziel + 3–5 spezifische Schritte für ${childname}. Was Eltern tun und nicht tun sollten. Berücksichtige Talente und Lernstil.

## Phase 2 — Wochen 3–4: "Die Entdeckung"
Erste konkrete Projekte. Verknüpft mit ${childname}s Traum.

## Phase 3 — Wochen 5–6: "Die Vertiefung"
Output-Qualität. Erste eigene Werke.

## Phase 4 — Wochen 7–8: "Die Integration"
Alltagsintegration ohne Belastung.

## Eltern-Anleitung
3–5 konkrete Gespräche mit Beispiel-Sätzen.

## Risiko-Faktoren spezifisch für ${childname}
Was kann schiefgehen. Wie reagieren.

## Was nach den 60 Tagen kommt
Realistische nächste Schritte.

REGELN:
- Nutze ${childname}s Namen mindestens 8x
- Sei konkret, nie generisch
- Keine Floskeln
- ${childname} ist ein Mensch, kein Projekt
- Erwähne Risiken ehrlich
- Schreibe wie ein älterer Bruder, nicht wie ein Coach
- Nutze das Pronomen "${pronoun}" wenn das Geschlecht eindeutig ist
- Format: Sauberes Markdown`;
}

function MOCK_PLAN(childname, profileName) {
  return `# ${childname}s 60-Tage-Plan: Vom Profil "${profileName}" zur strukturierten Entfaltung

## Persönliche Einleitung

Liebe Eltern von ${childname},

ihr habt euch die Mühe gemacht, 14 Fragen ehrlich zu beantworten — und das ist mehr, als 90 % der Familien tun, die zu mir kommen. Ich verspreche euch nichts, was wir nicht halten können. Der Plan, den ihr in den nächsten Wochen umsetzt, ist auf ${childname} zugeschnitten — auf ${childname}s Profil, ${childname}s Talente, ${childname}s aktuelle Realität.

Bevor ihr weiterlest: Das hier ist kein Verhalten-Modifikations-Programm. ${childname} ist kein Projekt. Das hier ist eine Roadmap, die euch hilft, mit ${childname} gemeinsam einen Schritt zu gehen — und dann den nächsten.

## Phase 1 — Wochen 1–2: Die Grundlage

In den ersten zwei Wochen geht es nicht um Veränderung, sondern um Beobachtung. Wir setzen Anker, an denen sich später Veränderung festmachen kann.

**Wochenziel:** Beobachten ohne zu bewerten. Daten sammeln, nicht Druck machen.

- 30 Minuten ${childname}-Zeit täglich, ohne Bildschirm, ohne Agenda. Spazieren, kochen, Auto fahren — egal was, Hauptsache präsent.
- Ein konkretes "Mini-Projekt" zu einem Talent, das ${childname} schon hat. Klein. Sichtbar in 7 Tagen.
- Tagesreflexion: zwei Fragen, drei Minuten, schriftlich. "Was war heute schwer?" "Was war heute gut?"

**Was Eltern NICHT tun sollten:** Nicht über Bildschirmzeit reden. Nicht moralisieren. Diese zwei Wochen sind heilig — Beziehung vor Veränderung.

## Phase 2 — Wochen 3–4: Die Entdeckung

Erste echte Outputs. Klein, sichtbar, eigen.

${childname} entscheidet selbst, was das Mini-Projekt aus Phase 1 wird. Eltern stellen nur die Frage: "Was brauchst du, um den nächsten Schritt zu machen?" — und liefern, was möglich ist (Werkzeug, Zeit, eine Person, die ${childname} kennenlernen sollte).

## Phase 3 — Wochen 5–6: Die Vertiefung

Output-Qualität steigt. Erste Außenwirkung.

In dieser Phase geht ${childname}s Arbeit zum ersten Mal nach draußen — gezeigt, geteilt, getestet. Das ist die Phase, in der Identität entsteht: nicht durch Konsum, sondern durch Resonanz auf etwas Eigenes.

## Phase 4 — Wochen 7–8: Die Integration

Alltagsintegration ohne Belastung.

Was sich gut angefühlt hat, wird zum Rhythmus. Was sich nicht gut angefühlt hat, fliegt raus. ${childname} bestimmt den Schnitt — Eltern moderieren.

## Eltern-Anleitung

Drei Gespräche, die in den nächsten 60 Tagen passieren sollten:

1. **Das Anfangs-Gespräch (Tag 1):** "Wir haben einen Test gemacht. Wir möchten dir nichts vorschreiben — aber etwas mit dir teilen. Hast du Lust?"
2. **Das Mittel-Gespräch (Tag 30):** "Was hat sich für dich verändert? Was nicht? Was sollten wir lassen?"
3. **Das Abschluss-Gespräch (Tag 60):** "Was nehmen wir mit?"

## Risiko-Faktoren spezifisch für ${childname}

Was schiefgehen kann: Frust in Woche 3, Rückfall in Woche 5, Streit in Woche 7. Alles normal. Nicht persönlich nehmen. Beziehung halten, nicht Programm.

## Was nach den 60 Tagen kommt

Wenn die 60 Tage gut waren, ist der nächste Schritt nicht "noch mehr Plan" — sondern Peers. Andere Teenager, die in dieselbe Richtung gehen. Eine Mentor-Beziehung. Ein konkretes nächstes Projekt mit höherem Anspruch.

Das ist der Moment, in dem der Jung-und-Hungrig-Club ins Spiel kommt — aber nur, wenn ${childname} es selbst will. Niemals als Pflicht.

— Adrian

---
*Dies ist ein automatisch generierter Mustertext. Mit aktivierter Anthropic-API erscheint hier ein vollständig auf eure Antworten zugeschnittener Plan.*
`;
}

module.exports = { generatePlanWithClaude, MOCK_PLAN };
