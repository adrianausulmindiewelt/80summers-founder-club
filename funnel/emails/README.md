# Email-Sequenz · Digital-Reality-Check

7 Emails über 7 Tage für Leads, die Stufe 1 abgeschlossen, aber nicht gekauft haben.

## Brevo-Setup

1. Im Brevo Dashboard → **Templates** → Für jede Email unten ein Template anlegen.
2. Template-IDs ermitteln und in der Marketing-Automation verwenden.
3. **Marketing Automation** → Workflow `quiz-no-purchase` erstellen:
   - Trigger: Custom Event `quiz_stage_1_complete`
   - Bedingung: Kontakt hat NICHT Tag `purchased`
   - Schritte: 7 Emails mit jeweiligen Wartezeiten
4. Stop-Conditions: Kontakt erhält Tag `purchased` (gesetzt vom Stripe-Webhook → `triggerEvent('plan_purchased')`)

Alle Templates nutzen die Brevo-Variablen:
- `{{ contact.FIRSTNAME }}` — Name des Kindes
- `{{ contact.QUIZ_PROFILE }}` — Profil-Typ
- `{{ contact.QUIZ_UUID }}` — UUID für Deep-Link

---

## Tag 0 · Email 1: „Hier ist {{FIRSTNAME}}s Report"

**Betreff:** {{ contact.FIRSTNAME }}s Realitäts-Report — wie versprochen

**Pre-Header:** Profil: {{ contact.QUIZ_PROFILE }}

**Body:**

Hallo,

danke für die 10 ehrlichen Antworten. Hier ist {{ contact.FIRSTNAME }}s vollständiger Report:

→ Report öffnen: https://jung-und-hungrig.com/check-ergebnis.html?uuid={{ contact.QUIZ_UUID }}

Im Report siehst du:
- Den Profil-Typ (bei dir: **{{ contact.QUIZ_PROFILE }}**)
- Drei charakteristische Eigenschaften
- Die 5-Jahres-Prognose mit konkreten Zahlen

Wenn du den 60-Tage-Plan generieren lassen möchtest (kostenlos, dauert 90 Sekunden) — der Button dafür ist im Report.

Bis bald,
Adrian

---

## Tag 1 · Email 2: Eltern-Stimme einer Mutter mit ähnlichem Profil

**Betreff:** „Wir hatten dasselbe Profil"

**Pre-Header:** Stefanie über {{ contact.FIRSTNAME }}s Profil-Typ

**Body:**

Hallo,

ich wollte dir kurz die Geschichte einer Mutter zeigen, deren Sohn dasselbe Profil hatte wie {{ contact.FIRSTNAME }}: **{{ contact.QUIZ_PROFILE }}**.

Stefanie schrieb uns vor 3 Monaten:

> „Mein Sohn ist 14, sehr lieb, aber irgendwie nicht greifbar. Der Test hat es auf den Punkt gebracht: er ist ein 'Stiller Beobachter'. Ich war geschockt, weil das einfach gestimmt hat — und gleichzeitig erleichtert, weil es einen Begriff dafür gab."

Heute, 12 Wochen später, hat ihr Sohn ein eigenes kleines Schreibprojekt — drei Geschichten, eine davon hat er einer Lokalzeitung geschickt. Sie wurde gedruckt.

Das ist das Muster: Beobachter werden Macher, sobald jemand den Anstoß gibt — ohne Druck.

→ Plan generieren: https://jung-und-hungrig.com/check-ergebnis.html?uuid={{ contact.QUIZ_UUID }}

Adrian

---

## Tag 2 · Email 3: Adrians persönliche Geschichte

**Betreff:** Mit 16 dachte ich, ich bin verloren

**Body:**

Hallo,

kurze Sache von mir persönlich.

Mit 16 saß ich in der 11. Klasse und hatte das Gefühl, dass alle anderen einen Plan hatten — nur ich nicht. Mein Vater fragte mich beim Essen: „Adrian, was willst du eigentlich mal werden?" Und ich hatte keine Antwort. Außer: „Ich weiß es nicht."

Was niemand wusste: Ich hatte schon Ideen. Sogar viele. Aber keinen Anlass, ihnen Bedeutung zu geben. Keinen Mentor. Keine Peers. Niemanden, der gesagt hätte: „Bau es einfach."

Sieben Jahre später leite ich Jung und Hungrig — den Club, den ich damals gebraucht hätte.

Wenn {{ contact.FIRSTNAME }} ähnlich aussieht wie ich damals: Ich kann dir sagen, was geholfen hätte.

Der Plan, den wir generieren, ist genau das.

→ Plan generieren: https://jung-und-hungrig.com/check-ergebnis.html?uuid={{ contact.QUIZ_UUID }}

Adrian

---

## Tag 3 · Email 4: Risiko-Verstärkung mit Anekdote

**Betreff:** Was passiert in 5 Jahren?

**Body:**

Hallo,

ich habe in den letzten Tagen mit Eltern gesprochen, deren Kinder 17 oder 18 sind — also genau am Punkt, an dem die Bildschirmzeit-Muster der letzten 5 Jahre sichtbar werden.

Das Muster, das mir am häufigsten begegnet:

Bis 14 wirkt alles normal. Mit 15 wird das Kind ruhiger. Mit 16 fragt man sich, ob das jetzt einfach Pubertät ist. Mit 17 merkt man: das ist keine Pubertät mehr. Das ist der neue Status.

Und dann ist es spät. Nicht zu spät — aber spät.

Die Frage ist nicht, ob {{ contact.FIRSTNAME }} ein guter Mensch ist. Das ist {{ contact.FIRSTNAME }} sicher. Die Frage ist: hat {{ contact.FIRSTNAME }} mit 18 die Werkzeuge, die {{ contact.FIRSTNAME }} ab 18 brauchen wird?

Genau das ist das Ziel des 60-Tage-Plans.

→ Plan generieren: https://jung-und-hungrig.com/check-ergebnis.html?uuid={{ contact.QUIZ_UUID }}

Adrian

---

## Tag 4 · Email 5: Pause, kein Verkauf — 3 Gespräche

**Betreff:** 3 Gespräche, die du diese Woche mit {{ contact.FIRSTNAME }} führen kannst

**Body:**

Hallo,

heute kein Verkauf. Drei Gespräche, die du diese Woche mit {{ contact.FIRSTNAME }} führen kannst — auch ohne unseren Plan:

**1. „Was war heute schwer?"**
Beim Abendessen. Keine Folgefrage. Nur zuhören.

**2. „Wenn du in 5 Jahren irgendwo wärst — wo wäre das?"**
Ohne Bewertung. Sammle die Antwort innerlich. Schreib sie auf. Vergleiche mit dem, was du selbst denkst.

**3. „Welche eine Sache würdest du gerne mal probieren — wenn du wüsstest, dass du nicht versagst?"**
Das ist die wichtigste Frage. Antworten erst nach Tagen.

Wenn du sie nicht stellst, nimmt sie dir niemand ab.

Adrian

---

## Tag 5 · Email 6: Garantie + FAQ

**Betreff:** Falls du noch zweifelst

**Body:**

Hallo,

ich weiß, dass 97 € für einen Plan, den man im Internet kauft, nicht selbstverständlich ist. Drei Antworten auf die Fragen, die mich am häufigsten erreichen:

**„Was, wenn der Plan nicht passt?"**
30 Tage Geld-zurück-Garantie. Ohne Diskussion. Schreib mir eine Email — ich überweise zurück. Punkt.

**„Was, wenn {{ contact.FIRSTNAME }} nicht mitzieht?"**
Phase 1 (Wochen 1–2) ist für euch als Eltern, nicht für {{ contact.FIRSTNAME }}. Ihr macht Beobachtungs-Schritte, keine Aufgaben. Selbst wenn ihr nach den 60 Tagen abbrecht, habt ihr ein klareres Bild.

**„Ist das Therapie?"**
Nein. Wenn {{ contact.FIRSTNAME }} Anzeichen einer Depression, Angststörung oder Sucht zeigt, sucht eine Therapeut:in. Der Plan ergänzt das, ersetzt es nicht.

→ Plan generieren: https://jung-und-hungrig.com/check-ergebnis.html?uuid={{ contact.QUIZ_UUID }}

Adrian

---

## Tag 6 · Email 7: „Ich glaube, {{FIRSTNAME}} braucht das wirklich"

**Betreff:** Mein ehrlicher Eindruck

**Body:**

Hallo,

ich gehe normalerweise nicht so weit, aber bei {{ contact.FIRSTNAME }}s Profil ({{ contact.QUIZ_PROFILE }}) muss ich es sagen:

Das ist genau das Profil, bei dem strukturierte Begleitung den größten Unterschied macht.

Nicht jedes Kind braucht uns. Manche schaffen es allein. Manche brauchen Therapie. Manche brauchen einfach mehr Sport.

Aber Kinder mit diesem Profil brauchen drei Dinge:
1. Einen klaren Anstoß (= Plan)
2. Eine Person, die {{ contact.FIRSTNAME }} ernst nimmt (= du)
3. Peers, die in dieselbe Richtung gehen (= Workshop-Community, optional)

Punkt 1 und 2 könnt ihr selbst. Punkt 3 ist optional.

Wenn ich euch nichts geben darf außer einen Hinweis: tut Punkt 1 und 2. Egal mit oder ohne uns.

→ Plan generieren: https://jung-und-hungrig.com/check-ergebnis.html?uuid={{ contact.QUIZ_UUID }}

Adrian

---

## Tag 7 · Email 8: Letzte Erinnerung + Bonus

**Betreff:** Falls du den Plan doch noch willst

**Body:**

Hallo,

eine letzte Email. Falls du den Plan jetzt noch generierst:

Du bekommst zusätzlich 30 Minuten Zoom-Call mit mir persönlich, in den ersten 14 Tagen. Kein Verkaufsgespräch — wir gehen den Plan zusammen durch und ich beantworte deine Fragen direkt.

Das ist nicht skalierbar. Ich biete es nur Eltern an, die innerhalb der ersten 7 Tage nach dem Test kaufen.

→ Plan generieren: https://jung-und-hungrig.com/check-ergebnis.html?uuid={{ contact.QUIZ_UUID }}

Wenn du es nicht machst — auch ok. Ich melde mich nicht wieder. Du kannst {{ contact.FIRSTNAME }}s Report jederzeit nochmal aufrufen, der Link bleibt aktiv.

Alles Gute,
Adrian

---
