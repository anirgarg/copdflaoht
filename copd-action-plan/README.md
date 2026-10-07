# COPD Action Plan Builder

A browser tool that clinicians fill in with a patient to make a two-page COPD action plan
(green / yellow / red zones), then print it or save it as a PDF. No server, build step or account.

**Live URL (GitHub Pages):** `https://anirgarg.github.io/copdflaoht/copd-action-plan/`

## The printed plan

**Page 1, the action plan** (landscape)

| Zone | Left: how I feel | Right: my action plan |
|---|---|---|
| Green: *I feel well* | Normal-for-me signs; usual phlegm and oxygen level | Daily medicines (with inhaler pictures), reliever, home oxygen (rest / activity / sleep / hours), "To stay well I will" |
| Yellow: *I feel unwell* | Signs of a flare-up | **Step 1** breathing techniques + more reliever → **Rescue pack?** yes/no → **Step 2** steroid if breathing worse, antibiotic if signs of infection, call clinic the same or next working day → **Step 3** not better after 2–3 days: urgent same-day appointment, with evenings/weekends advice |
| Red: *I feel very unwell* | Signs of an emergency | Call an ambulance (dial 911), what to do while waiting, notes |

**Page 2, information and self-help** (each part can be switched off)
- *Information for the paramedics*: address, emergency contacts, allergies, other conditions, target SpO₂, CO₂ retention, oxygen alert card, goals of care, substitute decision-maker, notes.
- *My COPD care*: vaccine dates, pulmonary rehab, inhaler technique check, smoking status.
- *Managing breathlessness*: common triggers; Stop, Think, Position, Breathe, Air; the 10-minute check.
- *Help and information*: clinic and regional resources.

If no rescue medicines are entered, the plan ticks "No" and goes straight from step 1 to step 3. Empty fields print as grey
write-in boxes, so a blank plan can also be filled in by hand.

## Using it

- **Rows:** every list can be changed. You can add, remove or reorder medicines (several per category, or "Other" with any name), zone signs, actions, emergency contacts and resources. A few extra items start unticked (fever, ankle swelling, "my medicines are not helping", pulmonary rehab). Tick them to include them for a patient.
- **Fit check:** if a page gets crowded (long wording or a wordier language), its text steps down slightly, to no smaller than 7.9 pt, so it still fits. If it still doesn't fit, a warning appears in the editor.
- **Language:** the printed plan comes in English, French, Spanish, Simplified Chinese, Traditional Chinese (Cantonese readers), Arabic (right-to-left) and Hindi.
- **Layout:** Letter or A4 paper, inhaler pictures, tick boxes or bullets, and a greyscale mode for black-and-white printers.

## Privacy

- Everything runs in the browser. **Nothing typed into the form is sent anywhere.**
- Patient information is **never stored** by the tool. **Save plan file** writes a `.json` file to the clinician's
  computer so the plan can be reopened and updated at review. Store that file as you would any health record.
- Only the *clinic template* (clinic details, wording, resources, layout) is remembered in the browser (localStorage).
- The only outside request is the Atkinson Hyperlegible font from Google Fonts. To avoid it, download the font,
  put it in this folder, and change the `<link>` in `index.html` to a local `@font-face`.

## Hosting for another clinic or region

1. Copy this folder to any static web host (GitHub Pages, an intranet server, or open `index.html` locally).
2. Edit `data.js`:
   - `CLINIC_DEFAULTS`: clinic name, phone, after-hours advice, emergency number.
   - `RESOURCE_DEFAULTS`: local helplines and programs (the defaults are for Kingston, Ontario).
   - `MED_CATEGORIES`: medicines available in your region. Pictures go in `medications/` and `MED_IMAGES`.
3. Or skip the code: set things up in the **Clinic setup** panel and use **Save template** to share the
   `.json` file with colleagues, who use **Load template**.
4. Wording is in `i18n/<language>.js`. English is the source text. Keep keys identical across files.

## Files

| File | What it is |
|---|---|
| `index.html` | Editor layout |
| `app.js` | State, list editors, rendering, save/open |
| `data.js` | Clinic defaults, resources, medicine lists, default list items |
| `i18n/*.js` | Printed-plan wording per language |
| `styles.css` | Editor styles and true-size printed pages |
| `medications/` | Inhaler pictures |
| `REVIEW.md` | How the content compares with other COPD plans and the evidence, plus open items |

## Credits

The layout is informed by Lung Foundation Australia's *My COPD Action Plan* (2026). It is not endorsed by Lung
Foundation Australia, and no LFA text, artwork or logo is reproduced. The content follows Canadian Thoracic Society
and GOLD 2026 guidance. See `REVIEW.md` for sources.
