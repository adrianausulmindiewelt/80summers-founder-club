# 80 Summers – Brand & Corporate Design

## Markenname
**80 Summers Founder Club**

Vormals: "Von Wien bis Berlin – Mitgliederclub" / "Eltern Medien Akademie"

## Logo
- Primär: Schwan-Logo (zwei Schwäne, die ein Herz bilden) – Lineart, dunkelrot auf weiß
- Stern-Logo (8-zackiger Stern, rot/weiß/schwarz) – für Badges, Favicons, Akzente
- Logo-Dateien: `context/logos/`

## Farbpalette

| Rolle | Farbe | Hex | Verwendung |
|-------|-------|-----|------------|
| Primär | Dunkelrot | #8B1A1A | Headlines, CTAs, Akzente, Hintergründe |
| Sekundär | Weiß | #FFFFFF | Haupthintergrund, Text auf Dunkelrot |
| Text | Schwarz | #1A1A1A | Fließtext |
| Akzent hell | Hellgrau | #F5F5F5 | Sektions-Hintergründe, Karten |
| Akzent warm | Gold/Ocker | #C8A960 | Sublines, besondere Akzente (sparsam) |

## Typografie

| Element | Font | Gewicht | Verwendung |
|---------|------|---------|------------|
| Überschriften (H1-H3) | Poppins | Semi Bold (600) | Headlines, Section-Titel |
| Sublines, Zitate, Akzente | Bitter | Italic | Taglines, Testimonials, Hervorhebungen |
| Fließtext | Poppins | Regular (400) | Body Copy |
| Buttons / CTAs | Poppins | Semi Bold (600) | Call-to-Actions |

Google Fonts Import:
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Bitter:ital,wght@1,400;1,500&display=swap" rel="stylesheet">
```

Tailwind Config Erweiterung:
```js
fontFamily: {
  'heading': ['Poppins', 'sans-serif'],
  'accent': ['Bitter', 'serif'],
  'body': ['Poppins', 'sans-serif'],
}
```

## Design-Prinzipien

### Apple-Style Minimalismus
- Klare Linien, keine überladenen Layouts
- Maximal 2-3 Elemente pro Viewport
- Große Typografie als Gestaltungselement
- Bilder: authentisch, warm, hochwertig – keine Stock-Fotos-Ästhetik

### Spacing & Atmung
- Sektionen: mindestens `py-20` (80px) bis `py-32` (128px) Padding
- Zwischen Elementen: großzügig `gap-8` bis `gap-16`
- Headlines brauchen Luft: `mb-6` bis `mb-10` nach Überschriften
- Container: `max-w-6xl` oder `max-w-4xl` zentriert

### Schlagschatten (Premium)
- Karten: `shadow-lg` oder custom `shadow-[0_8px_30px_rgba(0,0,0,0.08)]`
- Hover-Effekt: `hover:shadow-xl transition-shadow duration-300`
- Bilder/Avatare: `shadow-[0_4px_20px_rgba(0,0,0,0.12)]`
- Keine harten Schatten. Immer weich und diffus.

### Emojis
- ✅ Erlaubt in: Überschriften, Listenpunkten, Feature-Highlights
- ❌ Verboten in: Fließtext, CTAs, Footern
- Max 1 Emoji pro Überschrift
- Bevorzugte Emojis: ✨ 🎯 🧠 💡 🔑 🌱 ⚡ 🏆
- Stil: Unterstützend, nicht dominant

### Buttons & CTAs
- Primär: Dunkelrot Hintergrund, weiße Schrift, abgerundete Ecken (`rounded-xl`)
- Hover: Leicht aufhellen + Schatten verstärken
- Padding: großzügig `px-8 py-4`
- Font: Poppins Semi Bold, leicht getracktes Spacing

### Bildsprache
- Authentische Familien, echte Momente
- Warme Farbtemperatur, natürliches Licht
- Zurückhaltende, gedeckte Farben
- Keine lauten Werbefotos, kein übertriebenes Lächeln
- Runde Avatare mit leichtem Schatten für Mitglieder-Fotos

## Referenz-Marken (Design-Orientierung)
- Montblanc (Premium, clean, edel)
- Hermès (Zurückhaltende Eleganz)
- Apple (Minimalismus, Spacing, Typografie)
