# Content review: version 2.0 (October 2026)

How this plan compares with other published COPD action plans and the evidence, what was changed as a result,
and what still needs a human to check before the plan is offered to other providers.

> **Method note.** The source documents were found through web search. Several primary PDFs could not be opened
> directly from the build environment, so the items marked **[verify]** should be checked against the original
> before wide release.

## 1. How the plans compare

| Element | CTS (Canada) | Living Well with COPD (QC) | Lung Foundation Australia 2026 | Asthma + Lung UK | American Lung Assoc. | **This plan** |
|---|---|---|---|---|---|---|
| Green zone signs | usual cough/mucus, activity, appetite, sleep | usual symptoms, eat/sleep well | "normal for me" | usual sputum colour, **usual SpO₂** | activity, cough, sleep, appetite | breathing, activity, sleep/eating + **usual phlegm and SpO₂** |
| Yellow signs → action | breathless, sputum change ≥ 2 days | worse symptoms | breathless → steroid; infection signs → antibiotic | sputum change, **ankle swelling** | breathless, poor sleep, fever | each sign tied to steroid or antibiotic; fever and ankle swelling optional |
| Red signs | very breathless, drowsy, confused, chest pain | very breathless, confused, chest pain | worse quickly, can't talk, anxious, confused | — | + blue lips, coughing blood | **all of these** (7 items, 1 optional) |
| Tell the clinic after starting the rescue pack | start within 48 h | call if not better in 48 h; after 5 pm/weekends → ER | leave a message; same-day visit if not better in 2–3 days | tell clinician within 48 h | — | call **same or next working day**; urgent visit if not better in **2–3 days** (editable); **evenings/weekends** line; optional "clinic will call me within ___" |
| Ambulance information | — | — | address, contact, notes | — | emergency contact | address, contacts (unlimited), allergies, conditions, **target SpO₂, CO₂ retention, oxygen alert card**, goals of care, **substitute decision-maker** |
| Oxygen | — | — | yes/no | — | **flow at rest / exertion / sleep** | rest / activity / sleep / hours |
| Vaccines, rehab, smoking | 2026 Lung Assoc. version adds vaccines and rehab [verify] | — | — | **vaccine dates**, rehab | — | **My COPD care** checklist |
| Breathlessness self-help | — | — | page 2 | — | — | page 2 (own wording) |
| Accessibility | — | French version | **greyscale** version | **Easy Read** version | — | 7 languages, greyscale mode, words and faces on each zone (not colour alone) |

## 2. Evidence behind the main choices

- **Action plans work best with support.** Cochrane (Howcroft 2016, CD005074.pub4): action plans with brief education
  reduced hospital admission (OR 0.69) and ED visits (OR 0.55), but depend on ongoing support. Self-management including
  action plans (Lenferink 2017, CD011682): respiratory admissions OR 0.69. One VA trial (Fan 2012) stopped early
  with more deaths in the intervention arm. **The plan should not be handed out without follow-up**, which is why
  the "About" panel says so and there is a follow-up call field.
- **Prednisone 40 mg once daily × 5 days** is the editor's example dose (REDUCE trial, JAMA 2013; GOLD).
  "Prednisone" is used rather than "prednisolone" because it is the Canadian standard.
- **Antibiotics** are tied to signs of infection (more phlegm, thicker, or a change in colour), in line with GOLD and Anthonisen.
- **Target SpO₂ 88–92%** for people at risk of CO₂ retention, and an **oxygen alert card** (BTS emergency oxygen guidance).
- **When to call the clinic.** There is no RCT basis for a specific interval. Same or next working day, and
  2–3 days for review, sit within the CTS, LFA, UK and Living Well range.
- **Review interval.** At least yearly and after every flare-up. GOLD 2026 also recommends referring to pulmonary rehab
  within 4 weeks of a flare-up (optional green-zone item).

## 3. Health literacy and accessibility

- Plain wording, aiming for about grade 6: "flare-up" not "exacerbation", "phlegm", "puffer", first-person voice.
- The font is Atkinson Hyperlegible, designed for low-vision readers. Zones are named in words and shown with faces as well as colour
  (WCAG 1.4.1). Greyscale print mode is available.
- Translations were drafted for this release. **Have a qualified medical translator review them before patient use** (forward and back
  translation is best practice). French uses Canadian terms (MPOC).

## 4. Hosting and legal

- **Privacy (PHIPA).** The form runs entirely in the browser. Patient data is not sent, stored or logged by the tool, and
  only a de-identified clinic template is kept in localStorage. *Confirm with your privacy officer.* This is a design
  choice, not legal advice.
- **Attribution.** Lung Foundation Australia's plan is © LFA, and no public terms permitting adaptation were found.
  This plan reproduces no LFA text, artwork or logo. Its own wording was written fresh, and the printed footer reads "Layout
  informed by … not endorsed by Lung Foundation Australia." **Consider emailing LFA to ask for their blessing**
  (lungfoundation.com.au/contact-us).
- **Versioning.** The version and content-review date print in the footer of page 2 (`APP_VERSION` and `CONTENT_REVIEWED` in `data.js`).

## 5. Resources: verification status

| Resource | Number / URL | Status |
|---|---|---|
| KCHC Regional Lung Health Program (incl. STOP) | kchc.ca/programs/regional-lung-health-program | URL found; **confirm the phone number to print internally** |
| Lung Health Foundation – Lung Health Line | 1-888-344-5864 | Confirmed on lunghealth.ca |
| Health811 (Ontario) | 811 | Confirmed. TTY number conflicting between sources, so it was left off |
| Canadian Lung Association helpline | 1-866-717-2673 | Confirmed on lung.ca |
| Canada's quitline | 1-866-366-3667 | Confirmed (Health Canada, May 2026) |
| Living Well with COPD | livingwellwithcopd.com | Confirmed |
| Smokers' Helpline 1-877-513-5333 | — | Not included: Ontario phone coaching appears to have moved to Health811 **[verify]** |

## 6. Open items before wider release

1. Clinical sign-off of default wording and example doses by the KCHC lung health team.
2. Medical-translator review of the 6 translations.
3. Confirm the KCHC Lung Health Program phone number and add it to `RESOURCE_DEFAULTS`.
4. Ask Lung Foundation Australia about attribution.
5. Confirm privacy approach with the privacy officer.
6. Consider an Easy Read / pictogram version (Asthma + Lung UK model).

## Sources

- CTS COPD Action Plan: cts-sct.ca/wp-content/uploads/2019/03/5491_THOR_COPDActionPlanUpdate_2019_Editable_Eng_v2.pdf
- CTS 2023 pharmacotherapy guideline: cts-sct.ca/wp-content/uploads/2023/09/2023-CTS-COPD-Pharmacotherapy-Guideline-1.pdf
- CHEST/CTS 2015 exacerbation prevention: pubmed.ncbi.nlm.nih.gov/25321320
- Lung Association 2026 self-management plan: lung.ca/wp-content/uploads/2026/05/COPD-self-management-action-plan.pdf
- Living Well with COPD plan of action: livingwellwithcopd.com/DATA/DOCUMENT/64_en~v~plan-of-action.pdf
- Lung Foundation Australia COPD Action Plan and HP guide: lungfoundation.com.au/support-resources/resource-hub/copd-action-plan-2/
- Asthma + Lung UK self-management plan: asthmaandlung.org.uk/conditions/copd-chronic-obstructive-pulmonary-disease/your-copd-self-management-plan
- American Lung Association COPD action plan: lung.org (fy20-ala-copd-action-plan.pdf)
- Howcroft 2016 Cochrane: pubmed.ncbi.nlm.nih.gov/27990628 · Lenferink 2017 Cochrane CD011682
- REDUCE trial: pmc.ncbi.nlm.nih.gov/articles/PMC3890440
- GOLD 2026 summary: pmc.ncbi.nlm.nih.gov/articles/PMC13109179
- BTS emergency oxygen: brit-thoracic.org.uk/quality-improvement/guidelines/emergency-oxygen
- WCAG 1.4.1 Use of Color: w3.org/WAI/WCAG22/Understanding/use-of-color.html
- Plain language "flare-up": bjgpopen.org/content/9/2/BJGPO.2024.0026
