# COPD Action Plan Builder

**Created by Dr Anirudha (Ani) Garg, MSc MD FRACGP CCFP** · ani.garg.md@gmail.com
Kingston Community Health Centre, Regional Lung Health Program

A browser tool that clinicians fill in with a patient to make a two-page COPD action plan, then print it or
save it as a PDF. No server, build step or account.

**Live:** https://anirgarg.github.io/copdflaoht/copd-action-plan/

## The printed plan (portrait, Letter or A4)

**Page 1: action plan.** It has a clinic header band and a patient strip (name, date, review-by date, prepared with), then three zones laid out as
*Zone | What I notice | What I do*:

| Zone | What I notice | What I do |
|---|---|---|
| **Green zone**: I feel well | Usual signs, usual phlegm and oxygen level | Daily medicines (with inhaler pictures), reliever, home oxygen (rest / activity / sleep / hours), "To stay well I will" |
| **Yellow zone**: I am having a flare-up | Signs of a flare-up | **1** breathing techniques + more reliever → *Do I have a flare-up prescription?* → **2** steroid if breathing worse, antibiotic if signs of infection, call clinic the same or next working day → **3** not better in 2–3 days: urgent same-day appointment, evenings/weekends advice |
| **Red zone**: I need help now | Signs of an emergency | Call an ambulance (dial 911), what to do while waiting, notes |

**Page 2: information and self-help** (each section can be switched off)
- **For paramedics and hospital staff:** name, address, emergency contacts, allergies, conditions, target SpO₂, CO₂ retention, oxygen alert card, goals of care, substitute decision-maker, notes.
- **My COPD care:** vaccine dates, pulmonary rehab, puffer technique check, smoking status.
- **Breathing easier:** pursed-lip breathing, positions that help, pace / plan / prioritize, stay calm, plus when to move to the yellow or red zone.
- **Help and information:** KCHC and Ontario resources.

Empty fields print as write-in lines, so a blank plan can be filled in by hand.

## Re-opening an old plan: the edit code

The bottom corner of the last page carries a small **edit code** (a QR code). It holds this plan's form
data, compressed: the same information that is printed on the page. To update a plan at review:

1. Click **Open old plan**.
2. Choose the plan's **PDF**, or a **photo or scan** of the printed page with the code.
3. The form refills. Make your changes and print again.

There are no separate files to keep: the PDF already in the patient's chart is enough. Everything happens in the
browser; the file is never uploaded anywhere. Plans printed before version 2.2 have no edit code.
You can switch the code off in **Layout** ("Print an edit code"). **Save plan file** (.json) is still available as
an optional backup.

## Using it

- **Per plan vs. clinic default:** ticks and wording changes in the zone lists apply to the current plan only.
  **Save as clinic default** keeps them for future patients; **Use clinic default** brings the clinic wording back.
  The plan language and "Prepared with" are also per plan ("Prepared with" carries over to your next patient).
- **Rows:** every list can be changed. You can add, remove or reorder medicines (several per category, or "Other" with any name), zone signs, actions, emergency contacts and resources. A few extra items start unticked: fever, ankle swelling, "my medicines are not helping" and pulmonary rehab.
- **Fit to one sheet:** if a page gets crowded, its text steps down slightly, to no smaller than 8 pt. If it still doesn't fit, the editor shows a warning.
- **Languages:** English, French (Canadian), Spanish, Simplified Chinese, Traditional Chinese (Cantonese readers), Arabic (right-to-left) and Hindi.
- **Layout:** Letter or A4, inhaler pictures, tick boxes or bullets, and a greyscale mode for black-and-white printers.

## Privacy

- Everything runs in the browser. **Nothing typed into the form is sent anywhere.**
- Patient information is **never stored** by the tool: not in the browser, not in clinic templates.
- To edit a plan later, open its PDF or a photo (see *edit code* above). The optional **Save plan file** writes a
  `.json` file to the clinician's computer; store it as you would any health record.
- Only the clinic template (clinic details, default wording, resources, layout, default language) is remembered in
  the browser and included in template files.
- All code is served from this site (libraries are bundled in `vendor/`). The only outside request is the
  Atkinson Hyperlegible font from Google Fonts.

## Hosting for another clinic or region

1. Copy this folder to any static web host, or open `index.html` locally.
2. In `data.js`, change:
   - `CLINIC_DEFAULTS`: clinic name, program, phone, after-hours advice, emergency number.
   - `RESOURCE_DEFAULTS`: local resources.
   - `MED_CATEGORIES` and `MED_IMAGES`: the medicine lists and inhaler pictures.
3. Or set things up in **Clinic setup**, then **Save template** and share the file with colleagues.
4. Wording is in `i18n/<language>.js`. English is the source text.

**Please keep the author credit.** The printed footer and the tool both show "Plan template by" and the
`AUTHOR` set in `data.js`. If you adapt this tool, credit Dr Anirudha (Ani) Garg and Kingston Community Health Centre.

## Files

| File | What it is |
|---|---|
| `index.html` | Editor layout |
| `app.js` | State, list editors, rendering, edit code, save/open, fit-to-page |
| `data.js` | Author, clinic defaults, resources, medicine lists, default list items |
| `i18n/*.js` | Printed-plan wording per language |
| `styles.css` | Editor styles and true-size printed pages |
| `medications/` | Inhaler pictures |
| `vendor/` | Bundled open-source libraries (QR code, compression, PDF reading); see `vendor/README.md` |
| `REVIEW.md` | Comparison with other COPD plans and the evidence, open items |

## Acknowledgements

Content follows Canadian Thoracic Society and GOLD 2026 guidance. Breathing skills follow those taught in Canadian
pulmonary rehabilitation. The yellow-zone step approach was informed by Lung Foundation Australia's *My COPD Action
Plan* (2026). This tool reproduces none of its text, artwork or logo and is not endorsed by Lung Foundation Australia.
See `REVIEW.md` for sources.
