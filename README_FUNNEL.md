# Digital-Reality-Check Funnel — Setup & Architektur

> **Was das ist:** Quiz-Funnel mit KI-Personalisierung für Eltern von 12–19-Jährigen, parallel zur bestehenden `index.html`. Ziel: 97 € Plan-Verkauf + 29 €/Mt Workshop-Up-Sell. Stand: Tag 1–7 implementiert, Mock-Modus läuft End-to-End ohne API-Keys.

---

## Stack

- **Frontend:** Vanilla HTML/CSS/JS in mehreren Dateien (`check*.html`), gleiche Brand-Tokens wie `index.html` (Tief-Schwarz `#141312`, Karmesin `#8b1a1a`, Poppins + Bitter Italic).
- **Backend:** Vercel Serverless Functions in `/api/*.js` (Node 20, kein SDK / Build-Step nötig — alle Calls per `fetch`).
- **State:** localStorage als Source of Truth fürs Frontend; Supabase optional für Server-Persistenz und Webhook-Sync.
- **Hosting:** Vercel statisches Deployment. Funktionen werden durch das Vorhandensein von `package.json` automatisch erkannt.

## Funnel-Flow

```
Meta-Ad / Direkt
   ↓
/check (check.html)                  Landing + Quiz Stufe 1 (10 Fragen)
   ↓ Email-Capture
/check/ergebnis?uuid=X               Profil + 5-Jahres-Prognose (Mock-Avatar)
   ↓ "Plan generieren"
/check/quiz-2?uuid=X                 Stufe 2 (4 Fragen + Foto-Upload)
   ↓ submit
/check/generieren?uuid=X             60s Lade-Animation, ruft /api/generate-plan
   ↓ Plan + Avatare ready
/check/plan?uuid=X                   Plan-Reveal + 97 € Checkout (+ 37 € Bump)
   ↓ Stripe Checkout
/check/upsell?uuid=X                 29 €/Mt Workshop-Community
   ↓
/check/danke?uuid=X                  Auslieferung + Login + Adrian-Video
```

Saubere URLs sind in `vercel.json` als Rewrites konfiguriert. Lokal (mit `open check.html`) nutze die `.html`-Dateinamen direkt.

## Dateien

```
check.html                          Landing + Quiz Stufe 1 (1 File mit View-Switch)
check-ergebnis.html                 Profil-Reveal + 5-Jahres-Prognose
check-quiz2.html                    Stufe 2 + Bild-Upload
check-generieren.html               Lade-Animation
check-plan.html                     Plan-Reveal + 97 € Sales-Page
check-upsell.html                   29 €/Mt Up-Sell
check-danke.html                    Thank-You + Auslieferung

funnel/
  profile-scoring.js                6-Profile-Algorithmus (UMD: Browser + Node)
  profile-scoring.test.js           13 Tests, lauf mit `npm run test:scoring`
  funnel-config.js                  window.JH_TRACKING (Pixel/GA4 IDs)
  funnel-init.js                    Cookie-Banner + Tracking-Loader (DSGVO-konform)
  emails/README.md                  7 Email-Templates für die Brevo-Sequenz
  lib/
    plan-generator.js               Claude API Wrapper + Mock-Plan
    avatar-generator.js             Replicate / fal.ai Wrapper
    supabase-store.js               Supabase REST Wrapper
    brevo-client.js                 Brevo REST Wrapper
    supabase-schema.sql             Postgres-Schema

api/
  quiz/stage-1-submit.js            POST → Profil berechnen + Brevo + Supabase
  quiz/stage-2-submit.js            POST → Stage-2-Daten persistieren
  generate-plan.js                  POST → Claude + Avatare parallel
  plan-status.js                    GET  → Polling für Lade-Animation
  create-checkout-session.js        POST → Stripe Checkout (97 € + Bump)
  create-upsell-session.js          POST → Stripe Subscription (29 €/Mt)
  stripe-webhook.js                 POST → Webhook (purchased / subscribed)

.env.example                        Template für API-Keys
package.json                        Nur Engines + Test-Script
vercel.json                         cleanUrls + /check/* Rewrites
```

## Mock-Modus (kein Setup nötig)

Ohne irgendwelche Env-Vars läuft der Funnel End-to-End klickbar:

- **Plan-Generierung:** lokaler Markdown-Mock (`mockPlanMarkdown` in check-generieren.html bzw. `MOCK_PLAN` in plan-generator.js)
- **Avatare:** Placeholder-Frames (kein Bild)
- **Stripe Checkout:** Direkt-Redirect zu /check/upsell?mock=1
- **Stripe Subscription:** Direkt-Redirect zu /check/danke?upsell=taken&mock=1
- **Brevo:** no-op (Logs in der Vercel-Konsole)
- **Supabase:** no-op, localStorage trägt alles

So kann der ganze Klick-Pfad gestestet werden, bevor irgendein Account angelegt wurde.

## Production-Setup (Schritt für Schritt)

### 1. Anthropic (Plan-Generierung)

1. https://console.anthropic.com → API Keys → neue Key erstellen
2. `.env` (oder Vercel Env-Vars): `ANTHROPIC_API_KEY=sk-ant-...`
3. Optional: `ANTHROPIC_PLAN_MODEL=claude-opus-4-7` für höhere Qualität

### 2. Replicate (Avatare)

1. https://replicate.com → Account → API Token
2. Setze `REPLICATE_API_TOKEN=...`
3. Optional: ein gepinnter SDXL-InstantID Modell-Hash in `REPLICATE_INSTANTID_MODEL`

Falls fal.ai bevorzugt wird: `AVATAR_PROVIDER=fal` + `FAL_KEY=...` (in `funnel/lib/avatar-generator.js` ist die fal-Branch noch zu implementieren).

### 3. Supabase (optional, aber empfohlen)

1. https://supabase.com → neues Projekt
2. SQL Editor → Inhalt von `funnel/lib/supabase-schema.sql` einfügen + ausführen
3. Settings → API → URL + Service Role Key kopieren
4. Setze `SUPABASE_URL=...` und `SUPABASE_SERVICE_KEY=...`
5. Storage → Bucket "quiz-photos" anlegen (private)

### 4. Brevo (Email-Sequenz)

1. https://app.brevo.com → API & Integration → SMTP & API → API Key generieren
2. Kontakte → Listen → neue Liste "Funnel Leads" anlegen, ID notieren
3. Setze `BREVO_API_KEY=...`, `BREVO_LIST_ID=<id>`
4. Templates für die 7 Emails aus `funnel/emails/README.md` anlegen
5. Marketing Automation → Workflow `quiz-no-purchase`:
   - Trigger: Custom Event `quiz_stage_1_complete`
   - Stop-Condition: Custom Event `plan_purchased`
   - 7 Schritte mit Email-Templates + Wartezeiten (24h, 48h, 72h, …)

### 5. Stripe

1. https://dashboard.stripe.com → API Keys → Secret Key
2. Setze `STRIPE_SECRET_KEY=sk_live_...`
3. **Produkte anlegen:**
   - "Digital-Reality-Check Plan" — einmalig 97 €
   - "Eltern-Gesprächsleitfaden Pro" — einmalig 37 €
   - "Workshop-Community" — recurring 49 €/Monat
4. **Coupon anlegen:** "Erster Monat 20 € Rabatt" — `amount_off: 2000`, `currency: eur`, `duration: once`
5. Setze `STRIPE_UPSELL_PRICE_ID=price_...` und `STRIPE_UPSELL_COUPON_ID=...`
6. **Webhook anlegen:** Endpoint `https://jung-und-hungrig.com/api/stripe-webhook`, Events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
7. Webhook signing secret kopieren → `STRIPE_WEBHOOK_SECRET=whsec_...`

### 6. Tracking (Meta Pixel + GA4)

In `funnel/funnel-config.js` die IDs eintragen:

```js
window.JH_TRACKING = {
  metaPixelId: '1234567890',           // Meta Business Manager → Pixel
  ga4MeasurementId: 'G-XXXXXXXXXX'     // GA4 Property → Web-Datenstream
};
```

Cookie-Banner ist DSGVO-konform: Pixel + GA4 laden **nur nach Consent**. Vor Consent landen Events nur in `window.dataLayer` (lokal, ohne externes Tracking) und werden nach Consent nachgespielt.

## Testen

```bash
# Profile-Scoring Tests
npm run test:scoring

# Lokale Vorschau (kein Build)
open check.html
```

End-to-End-Test (Mock-Modus, ohne irgendwelche Env-Vars):

1. `open check.html`
2. Quiz durchklicken → Email-Capture
3. Submit → Redirect zu /check-ergebnis.html
4. "Plan generieren" → /check-quiz2.html
5. Stufe 2 + Bild-Upload (oder Skip) → /check-generieren.html
6. ~60 s Lade-Animation → /check-plan.html mit Mock-Plan
7. "Plan freischalten" → Mock-Stripe → /check-upsell.html
8. "Ja" oder "Nein, danke" → /check-danke.html

## DSGVO-Punkte

- ✅ Cookie-Banner mit "Nur essenziell" Option (`funnel/funnel-init.js`)
- ✅ Tracking lädt nur nach Consent
- ✅ Bild-Upload mit explizitem Hinweis (24h-Auto-Löschung)
- ✅ Datenschutz-Link auf jeder Funnel-Seite (`/datenschutz`)
- ✅ Impressum-Link auf jeder Funnel-Seite (`/impressum`)
- ⚠ **Noch zu tun:** Datenschutzerklärung um den Funnel ergänzen (Brevo, Supabase, Replicate, Anthropic, Stripe als Auftragsverarbeiter nennen)
- ⚠ **Noch zu tun:** AGB für 97 € Einmalprodukt + 29 €/Mt Subscription
- ⚠ **Noch zu tun:** Widerrufsbelehrung im Checkout-Footer

## Bekannte Limitierungen / Open Items

- **Avatar-Provider:** fal.ai-Branch ist nur Stub. Wenn fal bevorzugt wird, in `funnel/lib/avatar-generator.js` ausimplementieren.
- **Plan-PDF:** Aktuell wird der Markdown-Plan als `.md` ausgeliefert. Für echte PDF-Generation: Backend-Function mit React-PDF oder Puppeteer hinzufügen.
- **Bild-Upload-Storage:** Aktuell wandert das Foto im POST-Body direkt zum Avatar-Generator. Für DSGVO-konforme 24h-Löschung: Supabase Storage + Cron-Edge-Function einrichten.
- **Foto-Skip + Avatar:** Wenn der User das Foto skippt, generieren wir generische Stock-Avatare ohne Gesichts-Konsistenz. Optional: künstlerischer Style-Avatar (kein photorealistisches Bild).
- **Resume-Feature:** Aktuell startet das Quiz bei jedem Page-Load von vorn. In `check.html` ist die Resume-Logik vorbereitet, aber auskommentiert.

## Architektur-Entscheidungen (warum so)

- **Vanilla, kein Next.js:** Konsistent mit dem bestehenden Repo. Kein Build, schneller Deploy. Funktionen kommen durch `package.json` automatisch hinzu.
- **localStorage als Source of Truth im Frontend:** Erlaubt Quiz-Resume und reduziert API-Calls. UUID koordiniert Front/Back.
- **Mock-Fallback überall:** Jede API hat einen Mock-Pfad. So kann der Funnel auch ohne Setup demonstriert werden — und einzelne Provider können nachträglich aktiviert werden, ohne dass der Rest bricht.
- **Separate HTML-Files statt SPA:** Jede Stage hat einen klaren URL-State, einfacher fürs Tracking, einfacher fürs Email-Linking, einfacher fürs Caching.
