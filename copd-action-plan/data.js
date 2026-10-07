/* COPD Action Plan — content and settings.
 *
 * Providers hosting this tool: edit CLINIC_DEFAULTS and RESOURCE_DEFAULTS for your
 * clinic and region. Everything else can be changed in the browser and saved as a
 * clinic template file.
 */

const APP_VERSION = '2.1';

// ---- Author credit (printed in the footer and shown in the tool) ----
const AUTHOR = {
  name: 'Dr Anirudha (Ani) Garg, MSc MD FRACGP CCFP',
  email: 'ani.garg.md@gmail.com',
};
const CONTENT_REVIEWED = '2026-10';

// ---- Clinic defaults (shown until a clinic template is loaded or edited) ----
const CLINIC_DEFAULTS = {
  name: 'Kingston Community Health Centre',
  program: 'Regional Lung Health Program',
  phone: '',
  afterHours: 'call Health811 (811) or go to the nearest emergency department',
  emergency: '911',
  provider: '',
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
// Each option: [value, label]. Groups render as <optgroup>.
const MED_CATEGORIES = {
  daily: {
    labelKey: 'medDaily', placeholder: 'e.g. 1 inhalation once a day',
    groups: [
      ['Inhalers', [
        ['advair', 'Advair'], ['anoro', 'Anoro'], ['breo', 'Breo'], ['breztri', 'Breztri'],
        ['duaklir', 'Duaklir'], ['incruse', 'Incruse'], ['inspiolto', 'Inspiolto'], ['lupin', 'Lupin'],
        ['seebri', 'Seebri'], ['serevent', 'Serevent'], ['spiriva_handihaler', 'Spiriva (HandiHaler)'],
        ['spiriva_respimat', 'Spiriva (Respimat)'], ['symbicort', 'Symbicort'], ['trelegy', 'Trelegy'],
        ['tudorza', 'Tudorza'], ['ultibro', 'Ultibro'], ['wixela', 'Wixela'],
      ]],
      ['Tablets', [
        ['azithromycin', 'Azithromycin (Zithromax)'], ['erythromycin', 'Erythromycin'],
        ['doxycycline', 'Doxycycline'], ['roflumilast', 'Roflumilast (Daxas)'],
      ]],
    ],
  },
  reliever: {
    labelKey: 'medReliever', placeholder: 'e.g. 1–2 puffs every 4–6 hours if needed',
    groups: [['Relievers', [
      ['ventolin_mdi', 'Ventolin (puffer)'], ['ventolin_diskus', 'Ventolin (Diskus)'],
      ['airomir', 'Airomir (puffer)'], ['bricanyl', 'Bricanyl (Turbuhaler)'],
      ['atrovent', 'Atrovent'], ['combivent', 'Combivent (Respimat)'],
    ]]],
  },
  rescueSteroid: {
    labelKey: 'medSteroid', placeholder: 'e.g. 40 mg once a day for 5 days',
    groups: [['Steroids', [
      ['prednisone', 'Prednisone'], ['prednisolone', 'Prednisolone'], ['medrol', 'Methylprednisolone (Medrol)'],
    ]]],
  },
  rescueAbx: {
    labelKey: 'medAntibiotic', placeholder: 'e.g. 875 mg twice a day for 5 days',
    groups: [['Antibiotics', [
      ['amoxicillin', 'Amoxicillin'], ['augmentin', 'Amoxicillin-clavulanate (Clavulin)'],
      ['doxycycline', 'Doxycycline'], ['azithromycin', 'Azithromycin (Zithromax)'],
      ['clarithromycin', 'Clarithromycin (Biaxin)'], ['cefuroxime', 'Cefuroxime'],
      ['sulfamethoxazole', 'Sulfamethoxazole-trimethoprim (Septra)'],
      ['moxifloxacin', 'Moxifloxacin (Avelox)'], ['levofloxacin', 'Levofloxacin'],
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
// Items listed in OPTIONAL_ITEMS start unticked: clinicians can switch them on per patient.
const DEFAULT_LISTS = {
  greenSigns:   ['gSign1', 'gSign2', 'gSign3'],
  greenStayWell: ['gWell1', 'gWell2', 'gWell3', 'gWell4', 'gWell5', 'gWell6'],
  yellowSigns:  ['ySign1', 'ySign2', 'ySign3', 'ySign4', 'ySign5', 'ySign6', 'ySign7'],
  redSigns:     ['rSign1', 'rSign2', 'rSign3', 'rSign4', 'rSign5', 'rSign6', 'rSign7'],
  redWhileWaiting: ['rWait1', 'rWait2', 'rWait3', 'rWait4'],
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
