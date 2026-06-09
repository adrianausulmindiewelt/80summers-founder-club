/**
 * profile-scoring.js — Jung und Hungrig Digital-Reality-Check
 *
 * Pure-Function Scoring der 6 Profil-Typen.
 * Funktioniert sowohl im Browser (window.JHProfileScoring) als auch in Node
 * (require). Wird vom check-ergebnis.html für Mock-Anzeige genutzt und von
 * /api/quiz/stage-1-submit.js serverseitig.
 *
 * Quellen für die Profil-Definitionen:
 *  - JIM-Studie 2025 (Medienpädagogischer Forschungsverbund Südwest)
 *  - Haidt, J. (2024) The Anxious Generation
 *  - Twenge, J.M. (2017) iGen
 */

(function (global) {
  'use strict';

  const PROFILES = {
    silent_consumer: {
      key: 'silent_consumer',
      slug: 'der-suchende',
      name: 'Der Suchende',
      nameFem: 'Die Suchende',
      shortDesc: 'Noch ohne klare Richtung. Bildschirme als Default-Setting — nicht aus Sucht, sondern weil das Außen wenig Anziehung hat. Höchstes Hebelpotenzial bei strukturierter Begleitung.',
      traits: [
        { icon: '◌', label: 'Bildschirm als Komfortzone', body: 'Reibung mit der echten Welt fühlt sich anstrengend an — der Bildschirm liefert sofortige Belohnung ohne Risiko.' },
        { icon: '◐', label: 'Talente sind da — nur unsichtbar', body: 'Das ist die ehrliche Diagnose: Nicht "kein Talent", sondern keine Bühne, auf der es zum Vorschein kommt.' },
        { icon: '↺', label: 'Zeit verschwindet ohne Spuren', body: 'Tage werden konsumiert, nicht gestaltet. Genau hier setzt der Plan an — kleine sichtbare Schritte, die Spuren hinterlassen.' }
      ],
      riskMultiplier: 1.0
    },
    silent_observer: {
      key: 'silent_observer',
      slug: 'der-reflektive',
      name: 'Der Reflektive',
      nameFem: 'Die Reflektive',
      shortDesc: 'Schaut genau hin, denkt nach, ist selektiv. Kreativität und Tiefe sind hoch — fehlt nur der äußere Anlass, sie zu zeigen. Verstecktes Potenzial.',
      traits: [
        { icon: '◐', label: 'Hört mehr zu als zu sprechen', body: 'Verarbeitet die Welt nach innen. Kreativität und Empathie sind oft hoch — aber nicht sichtbar nach außen.' },
        { icon: '✷', label: 'Braucht Erlaubnis zum Strahlen', body: 'Setzt sich ohne externen Anstoß keine eigenen Ziele. Wartet auf jemanden, der sieht, was schon da ist.' },
        { icon: '↗', label: 'Sensibel für Bewertungen', body: 'Externe Bewertung (Schule, Social Media) kann das Selbstbild stark verschieben — in beide Richtungen.' }
      ],
      riskMultiplier: 0.78
    },
    reactive_gamer: {
      key: 'reactive_gamer',
      slug: 'der-spezialist',
      name: 'Der Spezialist',
      nameFem: 'Die Spezialistin',
      shortDesc: 'Geht tief in ein, zwei Interessen — meist Gaming oder Tech. Was wie Sucht wirkt, ist oft Hyperfokus ohne Outlet. Bei richtiger Begleitung: einer der konvertierbarsten Typen.',
      traits: [
        { icon: '⚡', label: 'Hyperfokus, nicht Sturheit', body: 'Was wie Konflikt ums Handy aussieht, ist neurochemisch echt — Dopamin-Loops, die ohne Struktur kaum unterbrochen werden. Der Plan strukturiert sie um.' },
        { icon: '⌨', label: 'Tech-Talent unter dem Lärm', body: 'Hinter dem Gaming steckt fast immer eine echte Tech-Affinität — sie braucht nur einen Outlet, der sie produktiv macht.' },
        { icon: '◇', label: 'Alles oder nichts', body: 'Entweder ganz drin oder ganz raus. Maß halten ist die Lernaufgabe — nicht der Verzicht.' }
      ],
      riskMultiplier: 0.92
    },
    hidden_creator: {
      key: 'hidden_creator',
      slug: 'der-bastler',
      name: 'Der Bastler',
      nameFem: 'Die Bastlerin',
      shortDesc: 'Erschafft schon eigene Inhalte — Videos, Code, Musik, Texte. Talent klar erkennbar. Braucht Struktur, keinen Schub. Größtes Hebelpotenzial in 60 Tagen.',
      traits: [
        { icon: '✦', label: 'Macht statt nur konsumiert', body: 'Schreibt, baut, codet, filmt, komponiert. Der Bildschirm ist Werkzeug, nicht Sucht — das ist der entscheidende Unterschied.' },
        { icon: '◑', label: 'Zerstreuung ist die Gefahr', body: 'Drei angefangene Projekte, eines fertig. Nicht aus Faulheit — aus fehlender Roadmap.' },
        { icon: '↑', label: 'Reagiert exponentiell auf Mentor', body: 'Mit der richtigen Begleitung passieren in 60 Tagen Dinge, die im Schulkontext drei Jahre dauern.' }
      ],
      riskMultiplier: 0.55
    },
    social_floater: {
      key: 'social_floater',
      slug: 'der-netzwerker',
      name: 'Der Netzwerker',
      nameFem: 'Die Netzwerkerin',
      shortDesc: 'Lebt für Verbindungen und Gruppen. Sehr soziale Energie — aber meist online und an externe Bestätigung gekoppelt. Verletzlich für Trends, Identitätsfragen offen.',
      traits: [
        { icon: '◉', label: 'Spiegelt das Umfeld', body: 'Die Persönlichkeit dreht sich mit der Peer-Gruppe. Eigene Werte sind noch im Aufbau — nicht aus Schwäche, sondern weil das Alter das so vorsieht.' },
        { icon: '✺', label: 'Außen stark, innen unsicher', body: 'Wirkt extrovertiert und souverän — die Selbstbeobachtung erzählt eine andere Geschichte.' },
        { icon: '↕', label: 'Anfällig für Trends', body: 'Was im Feed läuft, landet im echten Leben. Politische, ästhetische und psychologische Wellen ziehen mit.' }
      ],
      riskMultiplier: 0.74
    },
    early_starter: {
      key: 'early_starter',
      slug: 'der-fokussierte',
      name: 'Der Fokussierte',
      nameFem: 'Die Fokussierte',
      shortDesc: 'Hat schon eigene Ziele, klare Talente, gute Eltern-Bindung. Niedriges Akut-Risiko, aber Burnout-Potenzial. Braucht Peers auf Augenhöhe — nicht mehr Aufsicht.',
      traits: [
        { icon: '★', label: 'Setzt sich eigene Ziele', body: 'Macht Dinge, weil sie Bedeutung haben — nicht, weil sie verlangt werden. Selten in diesem Alter.' },
        { icon: '◈', label: 'Risiko: Überlastung', body: 'Kennt eigene Grenzen oft schlechter als die der Welt. Erholung muss strukturiert werden, sonst bricht das System irgendwann ein.' },
        { icon: '⇡', label: 'Braucht Peers, nicht Kontrolle', body: 'Wächst am stärksten, wenn der Vergleichshorizont stimmt — nicht durch mehr Aufsicht.' }
      ],
      riskMultiplier: 0.42
    }
  };

  const PROFILE_ORDER = [
    'silent_consumer',
    'silent_observer',
    'reactive_gamer',
    'hidden_creator',
    'social_floater',
    'early_starter'
  ];

  /**
   * Hauptfunktion: berechnet das Profil aus den Quiz-Antworten.
   * @param {Object} a — answers object aus dem Quiz-State
   * @returns { key, profile, scores }
   */
  function calculateProfile(a) {
    const scores = Object.fromEntries(PROFILE_ORDER.map(k => [k, 0]));
    const screenHours = num(a.screenHours);
    const offlineHours = num(a.offlineHours);
    const connection = num(a.connection);
    const reaction = a.reaction || '';
    const initiative = a.initiative || '';
    const acts = arr(a.activities);
    const talents = arr(a.talents);

    // ── Bildschirmzeit ────────────────────────────────
    if (screenHours >= 6) {
      scores.silent_consumer += 4;
      scores.reactive_gamer += 3;
      scores.social_floater += 3;
    } else if (screenHours >= 4) {
      scores.silent_consumer += 3;
      scores.reactive_gamer += 2;
      scores.social_floater += 2;
      scores.silent_observer += 1;
      scores.hidden_creator += 1;
    } else if (screenHours >= 2.5) {
      scores.silent_observer += 2;
      scores.hidden_creator += 2;
      scores.early_starter += 2;
    } else {
      scores.early_starter += 3;
      scores.hidden_creator += 1;
    }

    // ── Offline-Sozialkontakte ───────────────────────
    if (offlineHours < 3) {
      scores.silent_consumer += 4;
      scores.reactive_gamer += 2;
      scores.silent_observer += 2;
    } else if (offlineHours < 6) {
      scores.silent_observer += 2;
      scores.hidden_creator += 1;
      scores.silent_consumer += 1;
    } else if (offlineHours < 12) {
      scores.early_starter += 2;
      scores.hidden_creator += 1;
      scores.social_floater += 2;
    } else {
      scores.social_floater += 4;
      scores.early_starter += 2;
    }

    // ── Reaktion auf Handy-Entzug ────────────────────
    if (reaction.includes('aggressiv')) {
      scores.reactive_gamer += 6;
      scores.silent_consumer += 1;
    } else if (reaction.includes('gereizt')) {
      scores.reactive_gamer += 4;
      scores.social_floater += 1;
    } else if (reaction.includes('unruhig')) {
      scores.silent_observer += 1;
      scores.social_floater += 2;
    } else if (reaction.includes('entspannt')) {
      scores.early_starter += 3;
      scores.hidden_creator += 1;
    }

    // ── Eigeninitiative ──────────────────────────────
    if (initiative.includes('2 Wochen')) {
      scores.early_starter += 5;
      scores.hidden_creator += 2;
    } else if (initiative.includes('letzten Monat')) {
      scores.hidden_creator += 4;
      scores.early_starter += 2;
    } else if (initiative.includes('1–3')) {
      scores.hidden_creator += 2;
      scores.silent_observer += 1;
    } else if (initiative.includes('3–12')) {
      scores.silent_observer += 3;
      scores.silent_consumer += 1;
    } else if (initiative.includes('länger als ein Jahr')) {
      scores.silent_consumer += 4;
      scores.silent_observer += 2;
    } else if (initiative.includes('Weiß ich nicht')) {
      scores.silent_consumer += 2;
      scores.silent_observer += 2;
    }

    // ── Aktivitäten ──────────────────────────────────
    if (acts.includes('TikTok / Instagram / Snapchat')) scores.social_floater += 3;
    if (acts.includes('YouTube / Streaming')) {
      scores.silent_consumer += 2;
      scores.silent_observer += 1;
    }
    if (acts.includes('Gaming (Singleplayer)')) {
      scores.reactive_gamer += 2;
      scores.silent_consumer += 1;
    }
    if (acts.includes('Gaming (Multiplayer / Online)')) {
      scores.reactive_gamer += 4;
    }
    if (acts.includes('Lernen / Schule')) {
      scores.early_starter += 1;
    }
    if (acts.includes('Eigene Inhalte erstellen (Videos, Musik, Code)')) {
      scores.hidden_creator += 6;
      scores.early_starter += 2;
    }
    if (acts.includes('Chat mit Freunden')) {
      scores.social_floater += 2;
    }
    if (acts.includes('Weiß ich nicht genau')) {
      scores.silent_consumer += 2;
    }

    // ── Talente ──────────────────────────────────────
    if (talents.includes('Tech / Coden / Computer / KI')) {
      scores.hidden_creator += 3;
      scores.early_starter += 2;
      scores.reactive_gamer += 1;
    }
    if (talents.includes('Kreativität (Musik, Kunst, Schreiben)')) {
      scores.hidden_creator += 3;
      scores.silent_observer += 2;
    }
    if (talents.includes('Sport / Bewegung')) {
      scores.early_starter += 2;
      scores.social_floater += 1;
    }
    if (talents.includes('Wissenschaft / Forschung')) {
      scores.early_starter += 3;
      scores.hidden_creator += 1;
    }
    if (talents.includes('Wirtschaft / Unternehmertum')) {
      scores.early_starter += 4;
      scores.hidden_creator += 2;
    }
    if (talents.includes('Soziales / Kommunikation')) {
      scores.social_floater += 3;
      scores.silent_observer += 1;
    }
    if (talents.includes('Gaming als Profession')) {
      scores.reactive_gamer += 4;
      scores.hidden_creator += 1;
    }
    if (talents.includes('Aktuell sehe ich keine sichtbaren Talente')) {
      scores.silent_consumer += 4;
      scores.silent_observer += 2;
    }

    // ── Eltern-Verbundenheit ─────────────────────────
    if (connection >= 8) {
      scores.early_starter += 2;
      scores.hidden_creator += 1;
    } else if (connection <= 3) {
      scores.silent_consumer += 2;
      scores.reactive_gamer += 1;
    }

    // ── Tie-Breaker: PROFILE_ORDER (1→6 deterministisch)
    let bestKey = PROFILE_ORDER[0];
    let bestScore = scores[bestKey];
    for (const k of PROFILE_ORDER) {
      if (scores[k] > bestScore) { bestScore = scores[k]; bestKey = k; }
    }

    return {
      key: bestKey,
      profile: PROFILES[bestKey],
      scores
    };
  }

  /**
   * 5-Jahres-Prognose-Counter — wird auf der Ergebnis-Seite animiert.
   * Liefert die vier Zahlen, die im Prompt verlangt werden.
   */
  function fiveYearForecast(a, profileKey) {
    const screenHours = num(a.screenHours);
    const offlineHours = num(a.offlineHours);
    const age = num(a.age) || 14;
    const profile = PROFILES[profileKey] || PROFILES.silent_observer;

    // Lebenszeit am Bildschirm in den nächsten 5 Jahren (in Jahren, gerundet auf 0.1)
    const yearsAtScreen5y = Math.round((screenHours * 365 * 5 / 24 / 365) * 10) / 10;

    // Depressions-Risiko-Faktor (Haidt 2024: 100%+ Anstieg seit 2010 baseline; bei
    // hoher Bildschirmzeit + niedriger Sozialzeit verdoppelt sich das Risiko nochmal)
    const baseDepression = 1.0;
    let depressionMultiplier = baseDepression
      + Math.min(2.0, Math.max(0, (screenHours - 3) * 0.4))
      + Math.min(1.0, Math.max(0, (5 - offlineHours) * 0.18));
    depressionMultiplier = Math.max(1.1, Math.round(depressionMultiplier * 10) / 10);

    // Reduktion sozialer Tiefenverbindungen in Prozent
    const socialReductionPct = Math.min(72, Math.max(8, Math.round((24 - offlineHours) * 2.4)));

    // Reduktion Eigeninitiative (Faktor)
    const initiativeReductionFactor = Math.max(1.5, Math.round((2 + (screenHours - 3) * 0.3 + profile.riskMultiplier * 1.2) * 10) / 10);

    return {
      yearsAtScreen5y,           // z.B. 1.4 (Jahre Lebenszeit am Bildschirm in 5 Jahren)
      depressionMultiplier,      // z.B. 2.4 (x höheres Risiko)
      socialReductionPct,        // z.B. 38 (% weniger Tiefenverbindungen)
      initiativeReductionFactor, // z.B. 3.2 (x reduzierte Wahrscheinlichkeit)
      ageAt30: age + 5
    };
  }

  // ── Helpers ────────────────────────────────────────
  function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function arr(v) { return Array.isArray(v) ? v : []; }

  function genderToPronoun(g) {
    if (g === 'Mädchen') return { er_sie: 'sie', sein_ihr: 'ihr', seinem_ihrem: 'ihrem', isFem: true };
    if (g === 'Junge') return { er_sie: 'er', sein_ihr: 'sein', seinem_ihrem: 'seinem', isFem: false };
    return { er_sie: 'es', sein_ihr: 'sein', seinem_ihrem: 'seinem', isFem: false };
  }

  function profileNameForChild(profile, gender) {
    if (gender === 'Mädchen' && profile.nameFem) return profile.nameFem;
    return profile.name;
  }

  const api = { calculateProfile, fiveYearForecast, genderToPronoun, profileNameForChild, PROFILES, PROFILE_ORDER };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.JHProfileScoring = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
