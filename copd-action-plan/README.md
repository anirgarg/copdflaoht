# COPD Action Plan Builder

A single-page tool for building a patient's COPD action plan (green / yellow / red zones)
and printing it on one Letter page. No server, build step or account needed.

**Live URL (GitHub Pages):** `https://anirgarg.github.io/copdflaoht/copd-action-plan/`

## What it does

- **Editor (left)** — patient, medications, zone wording, clinic details, notes, layout options.
- **Plan (right)** — a true-to-size preview of exactly what prints. Use **Print / Save PDF**.
- **7 languages** for the printed plan: English, French, Spanish, Mandarin, Cantonese, Arabic (right-to-left), Hindi.

### Customizing

| You can… | Where |
|---|---|
| Pick from the medication lists or type any other medication ("Other…") | Medications |
| Add more than one medication per category | Medications → "+ Add another" |
| Untick, reword, delete or add symptoms and actions in each zone | Zones |
| Set clinic name, phone, provider and emergency number (used in "Call 911") | Clinic details |
| Show/hide inhaler pictures, tick boxes, zone faces; large print; write-in lines for a blank form | Layout & printing |
| Share a clinic setup with colleagues | Save & load → template file (.json) |

Rescue steroid and antibiotic appear inside the Yellow Zone so the patient sees them exactly
when they need them. Reworded items stay as typed and are not translated.

### Privacy

Settings are remembered in the browser (localStorage). **Patient name and date are never saved**
and are not included in template files.

## Files

- `index.html` — page structure
- `styles.css` — screen + print styles
- `app.js` — editor, rendering, save/load
- `data.js` — medication lists, default zone wording and all translations (edit this to change content)
- `medications/` — inhaler pictures

## Hosting

Served as static files. To enable the URL above: repository **Settings → Pages → Build and deployment →
Deploy from a branch**, choose `main` and `/ (root)`. To run locally, open `index.html` in a browser
or run `python3 -m http.server` in the repository root.
