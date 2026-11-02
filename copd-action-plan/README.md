# COPD Action Plan Builder

**Created by Dr Anirudha (Ani) Garg, MSc MD FRACGP CCFP** · ani.garg.md@gmail.com
Kingston Community Health Centre, Regional Lung Health Program

A browser tool that clinicians fill in with a patient to make a two-page COPD action plan, then print it or
save it as a PDF. No server, build step or account.

**Live:** https://anirgarg.github.io/copdflaoht/copd-action-plan/
**Offline / USB copy:** [`download/COPD-Action-Plan-Builder.zip`](download/COPD-Action-Plan-Builder.zip). Unzip it and double-click the `.html` file; no internet needed.

## The printed plan (portrait, Letter or A4)

**Page 1: the action plan.** It has a clinic header band and a patient strip, then three zones laid out as
*Zone | What I notice | What I do*:

| Zone | What I notice | What I do |
|---|---|---|
| **Green zone**: I feel well | Usual signs; **To stay well I will** | Daily medicines (with inhaler pictures), reliever, home oxygen, my usual phlegm and oxygen level |
| **Yellow zone**: I am having a flare-up | Signs of a flare-up; **When to start** (if still worse after *24 to 48 hours* of more reliever; one bad day that gets better is not a flare-up) | **1** breathing techniques + more reliever → *Do I have a flare-up prescription?* → **2** steroid / antibiotic, call the clinic (**clinic name and phone printed here**) → **3** not better in 2–3 days: urgent appointment |
| **Red zone**: I need help now | Signs of an emergency | Call an ambulance (dial 911), then a **numbered** "while I wait" list: reliever as often as needed until help arrives, tripod position, pursed-lip breathing, plan and medicines ready |

**Back pages**, in the same colour order as page 1 (each section can be switched off):
- **Blue: My COPD care.** Vaccine dates, pulmonary rehab, puffer technique check, smoking.
- **Green: Breathing easier.** The 4 Ps in teaching order (**Prioritize, Plan, Pace, Position**), pursed-lip breathing, stay calm.
- **Yellow: When I am short of breath.** Use the reliever whenever needed (no waiting); when to check the yellow or red zone.
- **Red: For paramedics and hospital staff.**
- **Help and information**, then the edit code.

### Type size
- Page 1 starts at 10.5 pt and steps down only as far as it must (a typical plan prints at about 10 pt).
  The back pages print at 10.5 pt and flow onto as many pages as they need (usually 3 pages in all).
- **Large print** (Layout panel, per patient): 14 pt, one zone per page (about 6 pages).

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
- **Standard doses:** choosing a medicine fills in its usual adult COPD dose; other common regimens are offered as
  suggestions in the dose box. The box can always be cleared or typed over, and a typed dose is never replaced.
  Switch it off with "Fill in standard doses" (Layout). Doses are listed in `data.js`, and the prescriber confirms each one.
- **Rows:** every list can be changed. You can add, remove or reorder medicines (several per category, or "Other" with any name), zone signs, actions, emergency contacts and resources. A few extra items start unticked: fever, ankle swelling, "my medicines are not helping" and pulmonary rehab.
- **Fit to one sheet:** if a page gets crowded, its text steps down slightly, to no smaller than 8 pt. If it still doesn't fit, the editor shows a warning.
- **Languages:** English, French (Canadian), Spanish, Simplified Chinese, Traditional Chinese (Cantonese readers), Arabic (right-to-left) and Hindi.
- **Layout:** Letter or A4, inhaler pictures, tick boxes or bullets, and a greyscale mode for black-and-white printers.

## Offline copy (USB stick, shared drive, email)

`download/COPD-Action-Plan-Builder.html` is the whole tool in **one file** (about 3 MB): styles, fonts,
translations, inhaler pictures and the PDF/QR readers are all inside it. Copy it anywhere and double-click
it. It runs in Chrome, Edge, Firefox or Safari with no internet connection and makes no network requests.
The `.zip` (about 1 MB) contains the same file plus "How to use.txt" and licences, which is handy for email,
since some mail systems block bare `.html` attachments.

- Clinic settings are remembered by the browser on each computer; move them with **Save/Load template**.
- The top bar shows "Offline copy, version … (date)" so people know which copy they have.
- **Rebuild after any change:** `python3 copd-action-plan/tools/build_offline.py` (Python 3, no packages
  needed), then commit the updated `download/` files.

## Privacy

- Everything runs in the browser. **Nothing typed into the form is sent anywhere.**
- Patient information is **never stored** by the tool: not in the browser, not in clinic templates.
- To edit a plan later, open its PDF or a photo (see *edit code* above). The optional **Save plan file** writes a
  `.json` file to the clinician's computer; store it as you would any health record.
- Only the clinic template (clinic details, default wording, resources, layout, default language) is remembered in
  the browser and included in template files.
- All code and fonts are served from this site (libraries in `vendor/`, font in `fonts/`). The tool makes
  no requests to any other server.

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
| `fonts/` | Atkinson Hyperlegible font files (SIL Open Font License) |
| `tools/build_offline.py` | Builds the single-file offline copy |
| `download/` | The offline copy (`.html`) and its `.zip` |
| `REVIEW.md` | Comparison with other COPD plans and the evidence, open items |

## Acknowledgements

Content follows Canadian Thoracic Society and GOLD 2026 guidance. Breathing skills follow those taught in Canadian
pulmonary rehabilitation. The yellow-zone step approach was informed by Lung Foundation Australia's *My COPD Action
Plan* (2026). This tool reproduces none of its text, artwork or logo and is not endorsed by Lung Foundation Australia.
See `REVIEW.md` for sources.
