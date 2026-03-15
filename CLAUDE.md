# 80 Summers Founder Club — Landingpage

Du arbeitest am Projekt **80 Summers Founder Club** (ehemals "Von Wien bis Berlin" / "Eltern Medien Akademie").

Single-page Landingpage (deutsch). Pure HTML + CSS + Vanilla JS, keine Frameworks. Alles in einer Datei: `index.html`.

## Bevor du anfaengst

- Lies `context/brand.md` fuer CI, Farben, Fonts, Design-Regeln
- Lies `context/tone.md` fuer Schreibstil und Tonalitaet
- Lies `context/persona-traumkundin.md` fuer die Zielgruppe
- Logo-Dateien liegen in `context/logos/`

## Verzeichnisstruktur

```
index.html                      ← Komplette Landingpage (HTML + eingebettetes CSS + JS)
OUTLINE.md                      ← Seitenstruktur & Sektions-Map mit Zeilennummern
CLAUDE.md                       ← Diese Datei
context/
  brand.md                      ← Ausfuehrlicher Brand Guide
  tone.md                       ← Ausfuehrliche Copy-Guidelines
  persona-traumkundin.md        ← Zielgruppe Dr. Christina Neuber
  logos/                        ← Schwan-Logo, Stern-Logo, Website-Referenz
```

## Tech-Stack

- **HTML/CSS/JS** — kein Build-Tool, kein Framework, kein Bundler
- **Fonts:** Google Fonts — Poppins (400, 600, 700, 800, 900) + Bitter (400, 400i, 700, 700i)
- **Animationen:** Vanilla IntersectionObserver (`.anim` → `.visible` Klasse)
- **Deployment:** Statisches Hosting (HTML-Datei direkt ausliefern)

## Kernregeln

1. **Schriftarten:** Poppins Semi Bold (Ueberschriften) + Bitter Italic (Akzente, Zitate, Sublines)
2. **Farben:** Weiss (#FFFFFF), Dunkelrot (#8B1A1A), Schwarz (#1A1A1A), Hellgrau (#F5F5F5)
3. **Design:** Apple-Style, minimalistisch, Premium-Look, stylische Schlagschatten
4. **Spacing:** Viel Weissraum. Jede Sektion braucht Platz zum Atmen.
5. **Zielgruppe:** Wohlhabende, gebildete Eltern (180k+/Jahr). Kein Buzzword-Marketing. Wissenschaftlich fundiert, klar, serioes.
6. **Tonalitaet:** Direkt, kompetent, warmherzig aber nicht soft. Keine Verkaufsmaschen. Keine leeren Versprechen.

## Vorschau / Testen

```bash
open index.html                    # Im Browser oeffnen
open -a "Cursor" index.html        # In Cursor oeffnen
```

## Brand System (CSS Custom Properties)

```css
--ink: #111010          /* Textfarbe dunkel */
--ink-mid: #3a3a3a      /* Textfarbe mittel */
--ink-soft: #6b6b6b     /* Textfarbe gedaempft */
--bg: #f7f7f5           /* Hintergrund creme (warm) */
--bg-dark: #141312      /* Hintergrund dunkel (Hero, CTA, Footer) */
--surface: #ffffff      /* Hintergrund weiss */
--red: #8b1a1a          /* Primaerfarbe Karmesin */
--orange: #e07b39       /* Akzentfarbe (Alert-Boxen, Lever-Nummern, Insider-Cards) */
--fh: 'Poppins'         /* Headline-Font */
--fb: 'Bitter'          /* Body-Font */
--radius: 16px          /* Standard Border-Radius */
--card-shadow: 0 2px 16px rgba(0,0,0,.07)  /* Karten-Schatten */
```

## Sektions-Hintergruende (alternierend)

| Klasse   | Farbe         | Verwendung                        |
|----------|---------------|-----------------------------------|
| `.cream` | `--bg`        | Sektionen 2, 4, 6, 8, 10, 14, 16 |
| `.white` | `--surface`   | Sektionen 3, 5, 9, 11, 13, 15    |
| `.dark`  | `--bg-dark`   | Hero, Interlude, Selektion, Final CTA, Footer |

## Architektur-Entscheidungen

- **Eine Datei:** Alles (CSS + HTML + JS) bleibt in `index.html`. Kein Aufsplitten in separate Dateien — die Seite ist ein statisches Deployment ohne Build-Schritt.
- **Max-Width 860px:** `.wrap` hat `max-width: 860px` (enger als ueblich, orientiert am Original-Wix-Design).
- **Schatten max 0.14 Alpha:** Keine harten Schatten. Subtil und weich.
- **Animationsklasse `.anim`:** Nicht `.fade-up` oder andere Namen. IntersectionObserver togglet `.visible`.
- **Kein externer State:** Keine Cookies, kein LocalStorage, kein JS-Framework.
- **Orange Akzente statt Rot:** `.alert-box` hat `border-left: 4px solid var(--orange)`, nicht rot. `.lever-num` nutzt ebenfalls `--orange`.

## Konventionen beim Editieren

- Sektionen sind durch HTML-Kommentare getrennt (`<!-- ══ SEKTION X ... ══ -->`)
- CSS steht im `<style>`-Block im `<head>` (Zeile 11 ff.)
- JS steht am Ende vor `</body>` (IntersectionObserver)
- Responsive Breakpoints: `@media (max-width: 800px)` und `@media (max-width: 480px)`
- Aenderungen an einer Sektion: immer OUTLINE.md konsultieren fuer aktuelle Zeilennummern

## Haeufige Fehler (Gotchas)

- **Nicht Sektionen weglassen:** Die Seite hat 17 Sektionen + Interlude + Footer. Bei Aenderungen an einzelnen Sektionen niemals andere Sektionen entfernen.
- **Wix nicht fetchbar:** Die Original-Wix-Seite (eltern-medien-akademie.de) rendert per JS — WebFetch liefert leere Shells.
- **Zeilennummern in OUTLINE.md:** Nach groesseren Edits koennen die Zeilennummern driften. Bei Bedarf aktualisieren.
