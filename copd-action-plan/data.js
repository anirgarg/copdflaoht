/* COPD Action Plan — content and settings.
 *
 * Providers hosting this tool: edit CLINIC_DEFAULTS and RESOURCE_DEFAULTS for your
 * clinic and region. Everything else can be changed in the browser and saved as a
 * clinic template file.
 */

const APP_VERSION = '2.3'; // also update the ?v= tags in index.html

// ---- Author credit (printed in the footer and shown in the tool) ----
const AUTHOR = {
  name: 'Dr Anirudha (Ani) Garg, MSc MD FRACGP CCFP',
  email: 'ani.garg.md@gmail.com',
};
const CONTENT_REVIEWED = '2026-11';

// ---- Clinic defaults (shown until a clinic template is loaded or edited) ----
const CLINIC_DEFAULTS = {
  name: 'Kingston Community Health Centre',
  program: 'Regional Lung Health Program',
  phone: '',
  afterHours: 'call Health811 (811) or go to the nearest emergency department',
  emergency: '911',
};

// ---- Resources printed on page 2 (editable in the browser) ----
const RESOURCE_DEFAULTS = [
  { label: 'KCHC Regional Lung Health Program (COPD education, STOP smoking program)', detail: 'kchc.ca/programs/regional-lung-health-program' },
  { label: 'Lung Health Foundation — Lung Health Line (respiratory educators)', detail: '1-888-344-5864 · lunghealth.ca' },
  { label: 'Health811 — free nurse advice 24/7, quit-smoking coaching (Ontario)', detail: 'Call 811' },
  { label: 'Living Well with COPD — videos and guides', detail: 'livingwellwithcopd.com' },
  { label: 'Canadian Lung Association helpline', detail: '1-866-717-2673' },
  { label: "Quit smoking — Canada's quitline", detail: '1-866-366-3667' },
];

// ---- Medication pick-lists ----
// Each option: [value, label, standard doses]. The first standard dose fills "Dose and how to take it"
// when the medicine is chosen (if "Fill in standard doses" is on); the others are offered as suggestions.
// [] = no standard dose (left blank for the prescriber). These are usual adult doses for COPD, given as a
// starting point for educators: the prescriber confirms the dose for each patient (kidney function,
// allergies, interactions). Clinical sign-off: see REVIEW.md.
const MED_CATEGORIES = {
  daily: {
    label: 'Daily COPD medicines', placeholder: 'e.g. 1 inhalation once a day',
    groups: [
      ['Inhalers', [
        ['advair', 'Advair', ['1 inhalation twice a day']],
        ['anoro', 'Anoro', ['1 inhalation once a day']],
        ['breo', 'Breo', ['1 inhalation once a day']],
        ['breztri', 'Breztri', ['2 puffs twice a day']],
        ['duaklir', 'Duaklir', ['1 inhalation twice a day']],
        ['incruse', 'Incruse', ['1 inhalation once a day']],
        ['inspiolto', 'Inspiolto', ['2 puffs once a day']],
        ['lupin', 'Lupin', []],
        ['seebri', 'Seebri', ['Inhale the contents of 1 capsule once a day']],
        ['serevent', 'Serevent', ['1 inhalation twice a day']],
        ['spiriva_handihaler', 'Spiriva (HandiHaler)', ['Inhale the contents of 1 capsule once a day (2 breaths from the capsule)']],
        ['spiriva_respimat', 'Spiriva (Respimat)', ['2 puffs once a day']],
        ['symbicort', 'Symbicort', ['2 inhalations twice a day']],
        ['trelegy', 'Trelegy', ['1 inhalation once a day']],
        ['tudorza', 'Tudorza', ['1 inhalation twice a day']],
        ['ultibro', 'Ultibro', ['Inhale the contents of 1 capsule once a day']],
        ['wixela', 'Wixela', ['1 inhalation twice a day']],
      ]],
      ['Tablets', [
        ['azithromycin', 'Azithromycin (Zithromax)', ['250 mg once a day', '250 mg three times a week (Mon/Wed/Fri)', '500 mg three times a week (Mon/Wed/Fri)']],
        ['erythromycin', 'Erythromycin', ['250 mg twice a day']],
        ['doxycycline', 'Doxycycline', []],
        ['roflumilast', 'Roflumilast (Daxas)', ['500 mcg once a day', '250 mcg once a day for 4 weeks, then 500 mcg once a day']],
      ]],
    ],
  },
  reliever: {
    label: 'Reliever', placeholder: 'e.g. 1–2 puffs every 4–6 hours if needed',
    groups: [['Relievers', [
      ['ventolin_mdi', 'Ventolin (puffer)', ['1–2 puffs every 4–6 hours if needed']],
      ['ventolin_diskus', 'Ventolin (Diskus)', ['1 inhalation every 4–6 hours if needed']],
      ['airomir', 'Airomir (puffer)', ['1–2 puffs every 4–6 hours if needed']],
      ['bricanyl', 'Bricanyl (Turbuhaler)', ['1 inhalation when needed (no more than 6 a day)']],
      ['atrovent', 'Atrovent', ['2 puffs four times a day if needed']],
      ['combivent', 'Combivent (Respimat)', ['1 puff four times a day (no more than 6 puffs a day)']],
    ]]],
  },
  rescueSteroid: {
    label: 'Flare-up steroid', placeholder: 'e.g. 40 mg once a day for 5 days',
    groups: [['Steroids', [
      ['prednisone', 'Prednisone', ['40 mg once a day for 5 days']],
      ['prednisolone', 'Prednisolone', ['40 mg once a day for 5 days']],
      ['medrol', 'Methylprednisolone (Medrol)', ['32 mg once a day for 5 days']],
    ]]],
  },
  rescueAbx: {
    label: 'Flare-up antibiotic', placeholder: 'e.g. 875 mg twice a day for 5 days',
    groups: [['Antibiotics', [
      ['amoxicillin', 'Amoxicillin', ['500 mg three times a day for 5 days', '1000 mg three times a day for 5 days']],
      ['augmentin', 'Amoxicillin-clavulanate (Clavulin)', ['875 mg twice a day for 5 days', '500 mg three times a day for 5 days']],
      ['doxycycline', 'Doxycycline', ['200 mg on day 1, then 100 mg once a day for 4 days', '100 mg twice a day for 5 days']],
      ['azithromycin', 'Azithromycin (Zithromax)', ['500 mg on day 1, then 250 mg once a day for 4 days', '500 mg once a day for 3 days']],
      ['clarithromycin', 'Clarithromycin (Biaxin)', ['500 mg twice a day for 5 days', '1000 mg (XL) once a day for 5 days']],
      ['cefuroxime', 'Cefuroxime', ['500 mg twice a day for 5 days']],
      ['sulfamethoxazole', 'Sulfamethoxazole-trimethoprim (Septra)', ['1 double-strength tablet (800/160 mg) twice a day for 5 days']],
      ['moxifloxacin', 'Moxifloxacin (Avelox)', ['400 mg once a day for 5 days']],
      ['levofloxacin', 'Levofloxacin', ['750 mg once a day for 5 days', '500 mg once a day for 7 days']],
    ]]],
  },
};

// Inhaler pictures shown beside the medication on the plan.
const MED_IMAGES = {
  advair: 'medications/advair.jpg', anoro: 'medications/anoro.jpg', breo: 'medications/breo.jpg',
  breztri: 'medications/breztri.jpg', duaklir: 'medications/duaklir.jpg', incruse: 'medications/incruse.jpg',
  inspiolto: 'medications/inspiolto.jpg', lupin: 'medications/lupin.jpg', seebri: 'medications/seebri.jpg',
  serevent: 'medications/serevent.jpg', spiriva_handihaler: 'medications/spiriva_handihaler.jpg',
  spiriva_respimat: 'medications/spiriva_respimat.jpg', symbicort: 'medications/symbicort.jpg',
  trelegy: 'medications/trelegy.jpg', tudorza: 'medications/tudorza.jpg', ultibro: 'medications/ultibro.jpg',
  wixela: 'medications/wixela.jpg', atrovent: 'medications/atrovent.jpg', bricanyl: 'medications/bricanyl.jpg',
  combivent: 'medications/combivent.jpg', ventolin_diskus: 'medications/ventolin_diskus.jpg',
  ventolin_mdi: 'medications/ventolin_mdi.jpg',
};

// ---- Editable lists: default items reference translation keys ----
// Items listed in OPTIONAL_ITEMS start unticked; clinicians tick them for a patient as needed.
// Ticks and wording edits apply to the current plan; "Save as clinic default" keeps them for new patients.
const DEFAULT_LISTS = {
  greenSigns:   ['gSign1', 'gSign2', 'gSign3'],
  greenStayWell: ['gWell1', 'gWell2', 'gWell3', 'gWell4', 'gWell5', 'gWell6'],
  yellowSigns:  ['ySign1', 'ySign2', 'ySign3', 'ySign4', 'ySign5', 'ySign6', 'ySign7'],
  redSigns:     ['rSign1', 'rSign2', 'rSign3', 'rSign4', 'rSign5', 'rSign6', 'rSign7'],
  redWhileWaiting: ['rWait3', 'rWait1', 'rWait2', 'rWait4'], // printed as a numbered list in this order
  activities:   ['act1', 'act2', 'act3', 'act4', 'act5', 'act6'],
};
const OPTIONAL_ITEMS = ['gWell6', 'ySign6', 'ySign7', 'rSign7'];

// "My COPD care" checklist on page 2: [key, input placeholder]
const CARE_ITEMS = [
  ['careFlu', 'date'], ['careCovid', 'date'], ['carePneumo', 'date'], ['careRsv', 'date'],
  ['careRehab', 'referred / completed'], ['careTechnique', 'date checked'],
];

const LANGUAGES = [
  ['en', 'English'], ['fr', 'Français'], ['es', 'Español'], ['zh', '中文 (简体)'],
  ['yue', '粵語 (繁體)'], ['ar', 'العربية'], ['hi', 'हिन्दी'],
];
const RTL_LANGUAGES = ['ar'];
