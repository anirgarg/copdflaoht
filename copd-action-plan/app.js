/* COPD Action Plan — editor + printable two-page plan.
 *
 * State has two parts:
 *   template — clinic details, default wording, resources, layout. Remembered in this
 *              browser and shareable as a clinic template file.
 *   plan     — everything about this patient, including the plan language, who prepared
 *              it, and the wording/ticks used on this plan. Never stored by the app; the
 *              clinician can save it to a file on their own computer.
 * A new plan starts from the template's defaults ("Save as clinic default" updates them).
 * The printed pages are re-rendered from state on every change. */
(function () {
  'use strict';

  const TEMPLATE_KEY = 'copd-action-plan:template:v2';
  const $ = (sel, root = document) => root.querySelector(sel);
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------- defaults ----------
  const emptyMed = () => ({ med: '', other: '', instr: '' });
  const listFromKeys = keys => keys.map(key => ({ key, on: !OPTIONAL_ITEMS.includes(key) }));

  const has = (obj, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key);
  const isTextKey = key => has(TRANSLATIONS.en, key) && typeof TRANSLATIONS.en[key] === 'string';
  function builtInLists() {
    const lists = {};
    Object.keys(DEFAULT_LISTS).forEach(k => { lists[k] = listFromKeys(DEFAULT_LISTS[k]); });
    return lists;
  }

  function defaultTemplate() {
    return {
      defaultLang: 'en',
      clinic: { name: CLINIC_DEFAULTS.name, program: CLINIC_DEFAULTS.program, phone: CLINIC_DEFAULTS.phone,
                afterHours: CLINIC_DEFAULTS.afterHours, emergency: CLINIC_DEFAULTS.emergency, logo: '' },
      defaultLists: builtInLists(),
      texts: { days: '2–3', step2cDo: '', step3Do: '' },
      resources: clone(RESOURCE_DEFAULTS),
      opts: { page2: true, breathing: true, care: true, images: true, ticks: false, greyscale: false, editCode: true, paper: 'letter' },
    };
  }

  // A new plan starts from the clinic template's default language and wording.
  function defaultPlan(tpl) {
    return {
      lang: tpl ? tpl.defaultLang : 'en',
      patient: { name: '', date: todayISO(), review: addMonthsISO(todayISO(), 12), provider: '' },
      lists: tpl ? clone(tpl.defaultLists) : builtInLists(),
      meds: { daily: [emptyMed()], reliever: [emptyMed()], rescueSteroid: [emptyMed()], rescueAbx: [emptyMed()] },
      baseline: { phlegm: '', spo2: '' },
      oxygen: { use: '', rest: '', activity: '', sleep: '', hours: '' },
      flare: { technique: '', reliever: '', followUp: '' },
      redNotes: '',
      amb: { address: '', contacts: [{ name: '', rel: '', phone: '' }], allergies: '', conditions: '',
             spo2: '', co2: false, alertCard: false, acp: '', sdm: '', notes: '' },
      care: { flu: '', covid: '', pneumo: '', rsv: '', rehab: '', technique: '', smoking: '' },
    };
  }
  const TEMPLATE_FIELDS = Object.keys(defaultTemplate());
  const PLAN_FIELDS = Object.keys(defaultPlan());

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  function addMonthsISO(iso, months) {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y) return '';
    const dt = new Date(Date.UTC(y, m - 1 + months, d));
    return dt.toISOString().slice(0, 10);
  }

  // ---------- hydrate (merge saved data over defaults, by type) ----------
  function merge(base, saved) {
    if (saved == null) return base;
    if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
    if (typeof base === 'object') {
      if (typeof saved !== 'object' || Array.isArray(saved)) return base;
      const out = {};
      Object.keys(base).forEach(k => { out[k] = merge(base[k], saved[k]); });
      return out;
    }
    return typeof saved === typeof base ? saved : base;
  }
  const cleanList = items => (Array.isArray(items) ? items : [])
    .filter(i => i && typeof i === 'object' && (typeof i.text === 'string' || isTextKey(i.key)))
    .map(i => (isTextKey(i.key) ? { key: i.key, on: i.on !== false } : { text: i.text, on: i.on !== false }));
  const cleanLists = (lists, fallback) => {
    const out = {};
    Object.keys(DEFAULT_LISTS).forEach(k => {
      out[k] = lists && typeof lists === 'object' && Array.isArray(lists[k]) ? cleanList(lists[k]) : clone(fallback[k]);
    });
    return out;
  };
  const validLang = (lang, fallback) => (has(TRANSLATIONS, lang) && LANGUAGES.some(l => l[0] === lang) ? lang : fallback);
  const cleanRows = (rows, shape) => rows.filter(r => r && typeof r === 'object')
    .map(r => { const o = {}; Object.keys(shape).forEach(k => { o[k] = typeof r[k] === 'string' ? r[k] : shape[k]; }); return o; });

  function hydrateTemplate(saved) {
    saved = saved && typeof saved === 'object' ? saved : {};
    const t = merge(defaultTemplate(), saved);
    // Older templates (v2.0/2.1) stored the language as `lang` and the wording as `lists`.
    t.defaultLang = validLang(has(saved, 'defaultLang') ? saved.defaultLang : saved.lang, 'en');
    t.defaultLists = cleanLists(has(saved, 'defaultLists') ? saved.defaultLists : saved.lists, builtInLists());
    t.resources = cleanRows(t.resources, { label: '', detail: '' });
    if (!['letter', 'a4'].includes(t.opts.paper)) t.opts.paper = 'letter';
    if (typeof t.clinic.logo !== 'string' || !t.clinic.logo.startsWith('data:image/')) t.clinic.logo = '';
    return t;
  }
  // `tpl` supplies the language/wording for plan files saved before those moved into the plan.
  function hydratePlan(saved, tpl) {
    saved = saved && typeof saved === 'object' ? saved : {};
    const p = merge(defaultPlan(tpl), saved);
    p.lang = validLang(saved.lang, tpl.defaultLang);
    p.lists = cleanLists(saved.lists, tpl.defaultLists);
    Object.keys(p.meds).forEach(k => {
      p.meds[k] = cleanRows(p.meds[k], emptyMed()).map(r => {
        // A medicine no longer in the pick-list keeps its name as "Other".
        if (r.med && r.med !== '__other' && !medOptions(k).some(o => o[0] === r.med)) return { med: '__other', other: r.med, instr: r.instr };
        return r;
      });
      if (!p.meds[k].length) p.meds[k].push(emptyMed());
    });
    p.amb.contacts = cleanRows(p.amb.contacts, { name: '', rel: '', phone: '' });
    return p;
  }

  function pick(obj, keys) { const o = {}; keys.forEach(k => { o[k] = obj[k]; }); return clone(o); }

  // ---------- state ----------
  const initialTemplate = loadTemplate();
  let state = { ...initialTemplate, ...defaultPlan(initialTemplate) };
  let planDirty = false;
  let reviewTouched = false;

  function loadTemplate() {
    try {
      const raw = localStorage.getItem(TEMPLATE_KEY);
      return hydrateTemplate(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return defaultTemplate();
    }
  }
  let saveTimer = null;
  function saveTemplate() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(pick(state, TEMPLATE_FIELDS))); } catch (e) { /* storage unavailable */ }
    }, 250);
  }

  // ---------- text helpers ----------
  function t(key) {
    const dict = TRANSLATIONS[state.lang] || TRANSLATIONS.en;
    const s = dict[key] != null ? dict[key] : (TRANSLATIONS.en[key] || '');
    const emergency = state.clinic.emergency.trim() || '911';
    const days = state.texts.days.trim() || '2–3';
    return s.replaceAll('{emergency}', () => emergency).replaceAll('{days}', () => days);
  }
  const itemText = item => (item.key ? t(item.key) : item.text);

  function medOptions(cat) { return MED_CATEGORIES[cat].groups.flatMap(g => g[1]); }
  const medImage = med => (has(MED_IMAGES, med) ? MED_IMAGES[med] : '');
  function medName(cat, row) {
    if (row.med === '__other') return row.other.trim();
    const opt = medOptions(cat).find(o => o[0] === row.med);
    return opt ? opt[1] : '';
  }
  const filledMeds = cat => state.meds[cat].filter(r => medName(cat, r) || r.instr.trim());

  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj); }
  function setPath(obj, path, val) {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((o, k) => o[k], obj)[last] = val;
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v; // only used with static SVG below
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    children.flat(Infinity).forEach(c => {
      if (c == null || c === false || c === '') return;
      node.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return node;
  }

  // sticky: keep the message up (e.g. while a file is being read) until the next message
  function status(msg, isError, sticky) {
    const s = $('#status');
    s.textContent = msg;
    s.classList.toggle('error', !!isError);
    clearTimeout(status.timer);
    if (!sticky) status.timer = setTimeout(() => { s.textContent = ''; }, isError ? 9000 : 5000);
  }

  // ============================================================
  //  EDITOR
  // ============================================================

  // ---- simple bound fields: data-bind="path" (text, date, checkbox, radio, select) ----
  function syncBoundFields() {
    document.querySelectorAll('[data-bind]').forEach(input => {
      const v = getPath(state, input.dataset.bind);
      if (input.type === 'checkbox') input.checked = !!v;
      else if (input.type === 'radio') input.checked = input.value === v;
      else input.value = v == null ? '' : v;
    });
  }

  document.querySelectorAll('[data-bind]').forEach(input => {
    const ev = (input.type === 'checkbox' || input.type === 'radio' || input.tagName === 'SELECT') ? 'change' : 'input';
    input.addEventListener(ev, () => {
      const path = input.dataset.bind;
      const val = input.type === 'checkbox' ? input.checked : input.value;
      setPath(state, path, val);
      if (path === 'patient.date' && !reviewTouched && val) {
        state.patient.review = addMonthsISO(val, 12);
        $('#patient-review').value = state.patient.review;
      }
      if (path === 'patient.review') reviewTouched = true;
      if (path === 'lang') mountListEditors(); // default items show in the plan language
      changed(path);
    });
  });

  ['#lang-select', '#default-lang'].forEach(sel => {
    const select = $(sel);
    if (select) LANGUAGES.forEach(([code, label]) => select.append(el('option', { value: code, text: label })));
  });

  // ---- generic list editor: add / remove / reorder rows ----
  // cfg.path names the state it edits ('meds', 'lists', 'amb', 'resources') for change tracking.
  function mountList(container, cfg) {
    const draw = (focus) => {
      const items = cfg.items();
      container.replaceChildren();
      const ul = el('ol', { class: 'lrows', 'aria-label': cfg.label });
      items.forEach((item, i) => {
        const move = (dir) => {
          const j = i + dir;
          [items[i], items[j]] = [items[j], items[i]];
          draw({ index: j, control: dir < 0 ? 'up' : 'down' });
          changed(cfg.path);
        };
        const li = el('li', { class: 'lrow' + (item.on === false ? ' off' : '') },
          el('div', { class: 'lrow-fields' }, cfg.render(item, i)),
          el('div', { class: 'lrow-ctrl' },
            cfg.reorder !== false && el('button', { type: 'button', class: 'icon-btn', 'data-ctl': 'up', title: 'Move up', 'aria-label': 'Move up', disabled: i === 0, text: '↑', onclick: () => move(-1) }),
            cfg.reorder !== false && el('button', { type: 'button', class: 'icon-btn', 'data-ctl': 'down', title: 'Move down', 'aria-label': 'Move down', disabled: i === items.length - 1, text: '↓', onclick: () => move(1) }),
            el('button', {
              type: 'button', class: 'icon-btn del', title: 'Remove', 'aria-label': 'Remove row', text: '×',
              onclick: () => {
                items.splice(i, 1);
                if (cfg.keepOne && !items.length) items.push(cfg.create());
                draw({ index: Math.min(i, items.length - 1) });
                changed(cfg.path);
              },
            })));
        ul.append(li);
      });
      const addBtn = el('button', {
        type: 'button', class: 'add-btn', text: '+ ' + cfg.addLabel,
        onclick: () => { items.push(cfg.create()); draw({ index: items.length - 1 }); changed(cfg.path); },
      });
      container.append(ul, addBtn);
      if (focus) {
        const row = ul.children[focus.index];
        let target = null;
        if (row && focus.control) {
          // Keep focus on the move button so it can be pressed again; fall back to the other one at the ends.
          target = row.querySelector(`[data-ctl="${focus.control}"]:not(:disabled)`) || row.querySelector('[data-ctl]:not(:disabled)');
        }
        if (!target && row) target = row.querySelector('input[type="text"], select');
        (target || addBtn).focus();
      }
    };
    draw();
  }

  // Row renderers
  function medRow(cat) {
    return (row) => {
      const select = el('select', { 'aria-label': 'Medication' },
        el('option', { value: '', text: 'Choose…' }),
        MED_CATEGORIES[cat].groups.map(([g, opts]) =>
          el('optgroup', { label: g }, opts.map(([v, label]) => el('option', { value: v, text: label })))),
        el('option', { value: '__other', text: 'Other (type name)…' }));
      select.value = row.med;
      const other = el('input', { type: 'text', placeholder: 'Medication name and strength', 'aria-label': 'Medication name', value: row.other });
      other.hidden = row.med !== '__other';
      const instr = el('input', { type: 'text', placeholder: MED_CATEGORIES[cat].placeholder, 'aria-label': 'Dose and how to take it', value: row.instr });
      select.addEventListener('change', () => {
        row.med = select.value;
        other.hidden = row.med !== '__other';
        if (!other.hidden) other.focus();
        changed('meds');
      });
      other.addEventListener('input', () => { row.other = other.value; changed('meds'); });
      instr.addEventListener('input', () => { row.instr = instr.value; changed('meds'); });
      return [el('div', { class: 'med-pick' }, select, other), instr];
    };
  }

  function textItemRow(item) {
    const check = el('input', { type: 'checkbox', class: 'inc', title: 'Include on the plan', 'aria-label': 'Include on the plan' });
    check.checked = item.on !== false;
    const input = el('input', { type: 'text', value: itemText(item), 'aria-label': 'Wording' });
    check.addEventListener('change', () => {
      item.on = check.checked;
      check.closest('.lrow').classList.toggle('off', !item.on);
      changed('lists');
    });
    input.addEventListener('input', () => { delete item.key; item.text = input.value; changed('lists'); });
    return [check, input];
  }

  function fieldsRow(fields, path) {
    return (row) => fields.map(([key, label, cls]) => {
      const input = el('input', { type: 'text', class: cls || '', placeholder: label, 'aria-label': label, value: row[key] });
      input.addEventListener('input', () => { row[key] = input.value; changed(path); });
      return input;
    });
  }

  function mountListEditors() {
    document.querySelectorAll('[data-meds]').forEach(c => {
      const cat = c.dataset.meds;
      mountList(c, {
        items: () => state.meds[cat], render: medRow(cat), create: emptyMed, keepOne: true, path: 'meds',
        addLabel: cat === 'daily' ? 'Add another daily medicine' : 'Add another', label: MED_CATEGORIES[cat].label,
      });
    });
    document.querySelectorAll('[data-list]').forEach(c => {
      const key = c.dataset.list;
      mountList(c, {
        items: () => state.lists[key], render: textItemRow, create: () => ({ text: '', on: true }), path: 'lists',
        addLabel: c.dataset.add || 'Add item', label: c.dataset.add,
      });
    });
    mountList($('#contacts-editor'), {
      items: () => state.amb.contacts, create: () => ({ name: '', rel: '', phone: '' }), addLabel: 'Add contact', label: 'Emergency contacts', path: 'amb',
      render: fieldsRow([['name', 'Name'], ['rel', 'Relationship', 'narrow'], ['phone', 'Phone', 'narrow']], 'amb'),
    });
    mountList($('#resources-editor'), {
      items: () => state.resources, create: () => ({ label: '', detail: '' }), addLabel: 'Add resource', label: 'Resources', path: 'resources',
      render: fieldsRow([['label', 'Name'], ['detail', 'Phone / website']], 'resources'),
    });
  }

  // Wording lists: this plan's copy vs. the clinic default used for new patients
  document.querySelectorAll('[data-save-default]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.dataset.saveDefault.split(' ').forEach(k => { state.defaultLists[k] = clone(state.lists[k]); });
      saveTemplate();
      status('Saved as the clinic default for new patients.');
    });
  });
  document.querySelectorAll('[data-use-default]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.dataset.useDefault.split(' ').forEach(k => { state.lists[k] = clone(state.defaultLists[k]); });
      mountListEditors();
      changed('lists');
      status('Using the clinic default wording on this plan.');
    });
  });
  $('#reset-resources').addEventListener('click', () => {
    state.resources = clone(RESOURCE_DEFAULTS);
    mountListEditors();
    changed('resources');
  });

  // ---- logo ----
  $('#logo-file').addEventListener('change', e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|gif|webp|svg\+xml)$/.test(file.type)) { status('Choose a PNG, JPG, GIF, WebP or SVG image.', true); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 480 / img.width, 160 / img.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        state.clinic.logo = canvas.toDataURL('image/png');
        changed('clinic.logo');
        status('Logo added.');
      };
      img.onerror = () => status('That image could not be read.', true);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  $('#logo-remove').addEventListener('click', () => { state.clinic.logo = ''; changed('clinic.logo'); });

  // ---- files ----
  function download(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function readJSONFile(input, onData) {
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { onData(JSON.parse(reader.result), file.name); } catch (err) { status('That file could not be read. Choose a .json file saved from this tool.', true); }
      };
      reader.readAsText(file);
    });
  }
  // Filename-safe; keeps letters in any script, drops punctuation
  const slug = s => s.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40);

  $('#template-save').addEventListener('click', () => {
    download(`copd-plan-clinic-template${slug(state.clinic.name) ? '-' + slug(state.clinic.name) : ''}.json`,
      { app: 'copd-action-plan', kind: 'template', version: APP_VERSION, ...pick(state, TEMPLATE_FIELDS) });
    status('Clinic template saved. It contains no patient information.');
  });
  readJSONFile($('#template-file'), (data, name) => {
    if (!data || typeof data !== 'object' || data.kind === 'plan') {
      status('That is a patient plan, not a clinic template. Use "Open plan file" for patient plans.', true);
      return;
    }
    const tpl = hydrateTemplate(data); // build fully before touching state
    state = { ...state, ...tpl };
    renderAll();
    saveTemplate();
    status(`Clinic template loaded from ${name}.`);
  });

  $('#plan-save').addEventListener('click', () => {
    const who = slug(state.patient.name) ? '-' + slug(state.patient.name) : '';
    download(`copd-action-plan${who}-${state.patient.date || todayISO()}.json`,
      { app: 'copd-action-plan', kind: 'plan', version: APP_VERSION, plan: pick(state, PLAN_FIELDS) });
    planDirty = false;
    status('Plan saved to your computer. Store it as you would any health record.');
  });
  function applyPlanData(data, name) {
    if (!data || data.kind !== 'plan' || !data.plan) { status('That is not a saved patient plan. Use "Load template" for clinic template files.', true); return; }
    // Plans saved before v2.2 kept the language and wording in data.template; use them if present.
    const legacy = data.template && typeof data.template === 'object' ? hydrateTemplate(data.template) : null;
    const base = {
      defaultLang: legacy && (has(data.template, 'lang') || has(data.template, 'defaultLang')) ? legacy.defaultLang : state.defaultLang,
      defaultLists: legacy && (has(data.template, 'lists') || has(data.template, 'defaultLists')) ? legacy.defaultLists : state.defaultLists,
    };
    applyPlan(hydratePlan(data.plan, base), `Opened ${name}.`);
  }
  function applyPlan(plan, message) {
    state = { ...state, ...plan }; // the clinic template on this computer is left as it is
    reviewTouched = true;
    planDirty = false;
    renderAll();
    status(message);
  }

  // "Open plan" accepts a saved plan file (.json), a PDF printed from this tool, or a photo/scan of the plan.
  $('#plan-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const isJSON = /\.json$/i.test(file.name) || file.type === 'application/json';
    try {
      if (isJSON) {
        let data;
        try { data = JSON.parse(await file.text()); } catch (err) { status('That file could not be read. Choose a plan PDF, a photo of the plan, or a .json file saved from this tool.', true); return; }
        applyPlanData(data, file.name);
        return;
      }
      status('Looking for the edit code…', false, true);
      const bytes = /\.pdf$/i.test(file.name) || file.type === 'application/pdf' ? await codeFromPdf(file) : await codeFromImage(file);
      if (!bytes) {
        status('No edit code found. Use a PDF printed from this tool (version 2.2 or later) with "Print an edit code" switched on, or a clear, flat photo of the page with the code.', true);
        return;
      }
      const plan = decodePlan(bytes);
      if (!plan) { status('An edit code was found but it is not from this tool, or it is damaged.', true); return; }
      applyPlan(plan, `Plan restored from the edit code in ${file.name}. Check the details before printing.`);
    } catch (err) {
      console.error(err);
      status('That file could not be read. Try the original PDF, or a clearer photo.', true);
    }
  });

  $('#new-patient').addEventListener('click', () => {
    if (planDirty && !window.confirm('Clear this patient\'s details and start a new plan? Unsaved changes will be lost.')) return;
    const provider = state.patient.provider; // the same clinician usually sees the next patient
    state = { ...state, ...defaultPlan(state) };
    state.patient.provider = provider;
    reviewTouched = false;
    planDirty = false;
    renderAll();
    status('Ready for a new patient.');
  });
  $('#reset-template').addEventListener('click', () => {
    if (!window.confirm('Reset the clinic template (clinic details, default wording, resources and layout) to the original defaults? This patient\'s plan is not changed.')) return;
    state = { ...state, ...defaultTemplate() };
    try { localStorage.removeItem(TEMPLATE_KEY); } catch (e) { /* ignore */ }
    renderAll();
    status('Clinic template reset. This patient\'s plan is unchanged.');
  });

  window.addEventListener('beforeunload', e => {
    if (planDirty) { e.preventDefault(); e.returnValue = ''; }
  });

  $('#print-btn').addEventListener('click', () => window.print());

  // ============================================================
  //  EDIT CODE — the plan's form data, compressed into a QR code printed on the plan.
  //  Uploading the printed PDF (or a photo of it) restores the form. The code holds the
  //  same patient information that is printed on the page, nothing more.
  // ============================================================
  const CODE_MAGIC = [0x43, 0x41, 0x50, 0x03]; // "CAP", format 3
  // Preset compression dictionary: common keys, values and phrases cost only a few bytes each.
  // NEVER edit this for format 3 (old printed codes would stop reading); add a new format instead.
  const CODE_DICT = new TextEncoder().encode([
    '{"lang":"en","patient":{"name":"","date":"2026-01-01","review":"2027-01-01","provider":"Dr. "},',
    '"lists":{"greenSigns":["gSign1","gSign2","gSign3"],"greenStayWell":["gWell1","gWell2","gWell3","gWell4","gWell5","-gWell6"],',
    '"yellowSigns":["ySign1","ySign2","ySign3","ySign4","ySign5","-ySign6","-ySign7"],',
    '"redSigns":["rSign1","rSign2","rSign3","rSign4","rSign5","rSign6","-rSign7"],"redWhileWaiting":["rWait1","rWait2","rWait3","rWait4"],',
    '"activities":["act1","act2","act3","act4","act5","act6"]},',
    '"meds":{"daily":[["trelegy","","1 inhalation once a day"],["spiriva_respimat","","2 puffs once a day"],["breztri","","2 puffs twice a day"]],',
    '"reliever":[["ventolin_mdi","","1–2 puffs every 4–6 hours if needed"]],"rescueSteroid":[["prednisone","","40 mg once a day for 5 days"]],',
    '"rescueAbx":[["amoxicillin","","500 mg three times a day for 5 days"],["augmentin","","875 mg twice a day for 5 days"],["doxycycline","","100 mg twice a day for 5 days"]]},',
    '"baseline":{"phlegm":"Small amount, white","spo2":"92%"},"oxygen":{"use":"yes","rest":"2 L/min","activity":"3 L/min","sleep":"2 L/min","hours":"16"},',
    '"flare":{"technique":"Pursed-lip breathing","reliever":"Ventolin 2–4 puffs every 4 hours","followUp":"2 days"},"redNotes":"",',
    '"amb":{"address":", Kingston ON","contacts":[["","Wife","613-"],["","Husband","613-"],["","Daughter","613-"],["","Son","613-"]],',
    '"allergies":"None known","conditions":"Heart failure, diabetes","spo2":"88–92%","co2":true,"alertCard":true,"acp":"yes","sdm":"","notes":""},',
    '"care":{"flu":"","covid":"","pneumo":"","rsv":"","rehab":"","technique":"","smoking":"former"}}',
    ' advair anoro breo duaklir incruse inspiolto lupin seebri serevent spiriva_handihaler symbicort tudorza ultibro wixela',
    ' azithromycin erythromycin roflumilast ventolin_diskus airomir bricanyl atrovent combivent prednisolone medrol',
    ' clarithromycin cefuroxime sulfamethoxazole moxifloxacin levofloxacin __other mg mcg puff puffs inhalation tablet',
    ' once a day twice a day three times a day every day as needed if needed for 7 days at bedtime in the morning Mon/Wed/Fri',
  ].join(''));
  const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function planBaseline() {
    const p = defaultPlan({ defaultLang: 'en', defaultLists: builtInLists() });
    p.patient.date = ''; p.patient.review = '';
    return p;
  }
  // Drop anything equal to the blank default so the code stays small.
  function prune(value, base) {
    if (sameJSON(value, base)) return undefined;
    if (value && base && typeof value === 'object' && typeof base === 'object' && !Array.isArray(value) && !Array.isArray(base)) {
      const out = {};
      Object.keys(value).forEach(k => { const v = prune(value[k], base[k]); if (v !== undefined) out[k] = v; });
      return out;
    }
    return value;
  }
  // Compact form: list items as short strings, table rows as arrays (keeps the QR code small).
  //   list item: "gSign1" (default wording, ticked) · "-gSign1" (unticked) · "+text" (own wording) · "!text" (own, unticked)
  const ROW_SHAPES = { med: ['med', 'other', 'instr'], contact: ['name', 'rel', 'phone'] };
  const toRow = (obj, shape) => { const a = shape.map(k => obj[k] || ''); while (a.length && a[a.length - 1] === '') a.pop(); return a; };
  const fromRow = (arr, shape) => { const o = {}; shape.forEach((k, i) => { o[k] = typeof arr[i] === 'string' ? arr[i] : ''; }); return o; };
  function packPlan(p) {
    p = clone(p);
    if (p.lists) Object.keys(p.lists).forEach(k => {
      p.lists[k] = p.lists[k].map(i => (i.key ? (i.on ? '' : '-') + i.key : (i.on ? '+' : '!') + i.text));
    });
    if (p.meds) Object.keys(p.meds).forEach(k => { p.meds[k] = p.meds[k].map(r => toRow(r, ROW_SHAPES.med)); });
    if (p.amb && p.amb.contacts) p.amb.contacts = p.amb.contacts.map(r => toRow(r, ROW_SHAPES.contact));
    return p;
  }
  function unpackPlan(p) {
    if (!p || typeof p !== 'object') return {};
    if (p.lists && typeof p.lists === 'object') Object.keys(p.lists).forEach(k => {
      if (!Array.isArray(p.lists[k])) return;
      p.lists[k] = p.lists[k].filter(x => typeof x === 'string').map(x => {
        if (x[0] === '+' || x[0] === '!') return { text: x.slice(1), on: x[0] === '+' };
        return x[0] === '-' ? { key: x.slice(1), on: false } : { key: x, on: true };
      });
    });
    if (p.meds && typeof p.meds === 'object') Object.keys(p.meds).forEach(k => {
      if (Array.isArray(p.meds[k])) p.meds[k] = p.meds[k].map(r => fromRow(Array.isArray(r) ? r : [], ROW_SHAPES.med));
    });
    if (p.amb && Array.isArray(p.amb.contacts)) p.amb.contacts = p.amb.contacts.map(r => fromRow(Array.isArray(r) ? r : [], ROW_SHAPES.contact));
    return p;
  }
  function encodePlan() {
    const compact = packPlan(prune(pick(state, PLAN_FIELDS), planBaseline()) || {});
    const packed = pako.deflateRaw(new TextEncoder().encode(JSON.stringify(compact)), { level: 9, dictionary: CODE_DICT });
    const out = new Uint8Array(CODE_MAGIC.length + packed.length);
    out.set(CODE_MAGIC, 0);
    out.set(packed, CODE_MAGIC.length);
    return out;
  }
  function decodePlan(bytes) {
    bytes = Uint8Array.from(bytes);
    if (bytes.length < CODE_MAGIC.length || CODE_MAGIC.some((b, i) => bytes[i] !== b)) return null;
    try {
      const json = new TextDecoder().decode(pako.inflateRaw(bytes.subarray(CODE_MAGIC.length), { dictionary: CODE_DICT }));
      const saved = unpackPlan(JSON.parse(json));
      // Fields left out of the code were blank defaults; the wording defaults are the built-in ones.
      return hydratePlan(saved, { defaultLang: 'en', defaultLists: builtInLists() });
    } catch (e) {
      return null;
    }
  }
  let lastCode = { key: '', svg: '', error: '' };
  function editCodeSvg() {
    const bytes = encodePlan();
    const key = Array.prototype.join.call(bytes, ',');
    if (key === lastCode.key) return lastCode;
    let latin1 = '';
    bytes.forEach(b => { latin1 += String.fromCharCode(b); });
    // Level M (15% recovery) suits print and photos; L only if the plan is very long.
    for (const level of ['M', 'L']) {
      try {
        const qr = qrcode(0, level);
        qr.addData(latin1, 'Byte');
        qr.make();
        // margin = the 4-module quiet zone scanners need
        lastCode = { key, svg: qr.createSvgTag({ cellSize: 2, margin: 8, scalable: true }), modules: qr.getModuleCount() + 8, error: '' };
        return lastCode;
      } catch (e) { /* too long at this level: try the next */ }
    }
    lastCode = { key, svg: '', error: 'This plan is too long for an edit code. Use "Save plan file" to keep an editable copy.' };
    return lastCode;
  }

  // Readers, loaded only when someone uploads a PDF or photo. In the single-file (USB) version the
  // libraries are embedded in the page (window.OFFLINE_LIBS, base64) and loaded from blob: URLs.
  const libURLs = {};
  function libURL(name, path) {
    const b64 = window.OFFLINE_LIBS && window.OFFLINE_LIBS[name];
    if (!b64) return new URL(path + '?v=' + APP_VERSION, document.baseURI).href;
    if (!libURLs[name]) {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      libURLs[name] = URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }));
    }
    return libURLs[name];
  }
  let jsQRReady = null;
  function loadJsQR() {
    if (!jsQRReady) {
      jsQRReady = new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = libURL('jsqr', 'vendor/jsQR.js');
        sc.onload = () => resolve(window.jsQR);
        sc.onerror = () => { jsQRReady = null; reject(new Error('jsQR failed to load')); };
        document.head.append(sc);
      });
    }
    return jsQRReady;
  }
  function scanCanvas(jsQR, canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const found = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    return found && found.binaryData && decodePlan(found.binaryData) ? found.binaryData : null;
  }
  // The code sits in the bottom corner of the last page: try that corner first, then the whole page.
  function scanRegions(jsQR, source, w, h) {
    const regions = [[0.45, 0.72, 0.55, 0.28], [0, 0.72, 0.55, 0.28], [0, 0, 1, 1]];
    for (const [x, y, rw, rh] of regions) {
      const c = document.createElement('canvas');
      c.width = Math.round(w * rw); c.height = Math.round(h * rh);
      c.getContext('2d').drawImage(source, w * x, h * y, w * rw, h * rh, 0, 0, c.width, c.height);
      const hit = scanCanvas(jsQR, c);
      if (hit) return hit;
    }
    return null;
  }
  async function codeFromPdf(file) {
    const [jsQR, pdfjs] = await Promise.all([loadJsQR(), import(libURL('pdf', 'vendor/pdf.min.js'))]);
    pdfjs.GlobalWorkerOptions.workerSrc = libURL('pdfWorker', 'vendor/pdf.worker.min.js');
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
    try {
      for (let n = doc.numPages; n >= 1; n--) {
        const page = await doc.getPage(n);
        // 1) the bottom of the page (where the code is printed) at high resolution, 2) the whole page
        for (const [scale, fromY] of [[6, 0.7], [4, 0], [9, 0.7]]) {
          const vp = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height * (1 - fromY));
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp, transform: [1, 0, 0, 1, 0, -vp.height * fromY] }).promise;
          const hit = fromY ? scanCanvas(jsQR, canvas) || scanRegions(jsQR, canvas, canvas.width, canvas.height)
                            : scanRegions(jsQR, canvas, canvas.width, canvas.height);
          canvas.width = canvas.height = 0; // free memory
          if (hit) return hit;
        }
      }
    } finally {
      doc.destroy();
    }
    return null;
  }
  async function codeFromImage(file) {
    const jsQR = await loadJsQR();
    const bitmap = await createImageBitmap(file);
    try {
      // Small scans are enlarged first (the QR reader needs a few pixels per module); big photos are reduced.
      for (const maxSide of [2400, 3600]) {
        const scale = maxSide / Math.max(bitmap.width, bitmap.height);
        const c = document.createElement('canvas');
        c.width = Math.round(bitmap.width * scale); c.height = Math.round(bitmap.height * scale);
        c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
        const hit = scanRegions(jsQR, c, c.width, c.height);
        if (hit) return hit;
      }
    } finally {
      bitmap.close && bitmap.close();
    }
    return null;
  }

  // ============================================================
  //  PRINTED PLAN
  // ============================================================
  const FACE = {
    well: '<path d="M8 14.5c1.1 1.4 2.4 2 4 2s2.9-.6 4-2"/>',
    unwell: '<path d="M8.5 15.5h7"/>',
    very: '<path d="M8 16.5c1.1-1.4 2.4-2 4-2s2.9.6 4 2"/>',
  };
  const face = mood => el('span', {
    class: 'face', 'aria-hidden': 'true',
    html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="9.8" r=".7" fill="currentColor"/><circle cx="15" cy="9.8" r=".7" fill="currentColor"/>${FACE[mood]}</svg>`,
  });

  const auto = text => el('span', { dir: 'auto', text });
  // Language-aware punctuation for text the code joins together
  const cjk = () => state.lang === 'zh' || state.lang === 'yue';
  const C = () => (cjk() ? '：' : state.lang === 'fr' ? '\u00a0:' : ':'); // colon mark
  const SP = () => (cjk() ? '' : ' ');                                          // space after it
  const sep = () => C() + SP();
  const paren = txt => (cjk() ? `（${txt}）` : `(${txt})`);
  const pageLabel = n => t('pageN').replace('{n}', n);
  const line = cls => el('span', { class: 'line' + (cls ? ' ' + cls : '') });
  const value = (v, cls) => (v ? el('span', { class: 'val', dir: 'auto', text: v }) : line(cls));
  const choice = (label, on) => el('span', { class: 'choice' + (on ? ' on' : '') }, el('span', { class: 'radio', 'aria-hidden': 'true' }), label);
  const tick = on => el('span', { class: 'tick' + (on ? ' on' : ''), 'aria-hidden': 'true' });

  function bullets(listKey, extra, cls) {
    const items = state.lists[listKey].filter(i => i.on !== false && itemText(i).trim());
    return el('ul', { class: 'bullets' + (state.opts.ticks ? ' ticks' : '') + (cls ? ' ' + cls : '') },
      items.map(i => el('li', null, state.opts.ticks && tick(false),
        el('span', { dir: i.key ? null : 'auto' }, itemText(i), extra && extra(i)))));
  }

  function medLines(cat) {
    const rows = filledMeds(cat);
    if (!rows.length) return line('wide');
    const anyImg = state.opts.images && rows.some(r => medImage(r.med));
    return el('ul', { class: 'meds' }, rows.map(r => {
      const img = anyImg && medImage(r.med);
      return el('li', null,
        img ? el('img', { src: img, alt: '' }) : anyImg && el('span', { class: 'img-slot' }),
        el('span', { class: 'mtext' },
          medName(cat, r) && el('b', { dir: 'auto', text: medName(cat, r) }),
          r.instr.trim() && auto(r.instr.trim())));
    }));
  }

  // One labelled action inside the "What I do" column
  const act = (label, body, cls) => el('div', { class: 'act' + (cls ? ' ' + cls : '') },
    label && el('div', { class: 'act-label' }, label), el('div', { class: 'act-body' }, body));

  function zone(cls, mood, signsKey, actions, extra) {
    return el('section', { class: 'zone ' + cls },
      el('div', { class: 'z-label' },
        el('span', { class: 'z-name', text: t(cls + 'Zone') }),
        face(mood),
        el('span', { class: 'z-feel', text: t(cls + 'Title') })),
      el('div', { class: 'z-signs' }, bullets(signsKey), extra),
      el('div', { class: 'z-actions' }, actions));
  }

  function brandBar(small) {
    const clinicName = state.clinic.name.trim();
    const program = state.clinic.program.trim();
    return el('div', { class: 'brandbar' + (small ? ' small' : '') },
      state.clinic.logo && el('img', { class: 'logo', src: state.clinic.logo, alt: '' }),
      el('div', { class: 'brand-text' },
        clinicName && el('span', { class: 'brand-clinic', dir: 'auto', text: clinicName }),
        program && el('span', { class: 'brand-program', dir: 'auto', text: program })),
      state.clinic.phone.trim() && el('span', { class: 'brand-phone', dir: 'auto', text: state.clinic.phone.trim() }));
  }

  function renderPage1() {
    const fmt = iso => (iso ? formatDate(iso) : '');
    const field = (label, v, cls) => el('div', { class: 'pf' + (cls ? ' ' + cls : '') }, el('span', { class: 'pf-label', text: t(label) }), value(v));

    const head = el('header', { class: 'p-head' },
      brandBar(),
      el('div', { class: 'title-row' },
        el('h2', { class: 'p-title', text: t('title') }),
        el('p', { class: 'review-note', text: t('reviewNote') })),
      el('div', { class: 'p-fields' },
        field('nameLabel', state.patient.name.trim(), 'wide'),
        field('dateLabel', fmt(state.patient.date)),
        field('reviewLabel', fmt(state.patient.review)),
        field('preparedLabel', state.patient.provider.trim(), 'full')));

    const cols = el('div', { class: 'col-heads', 'aria-hidden': 'true' },
      el('span', { text: t('colZone') }), el('span', { text: t('colNotice') }), el('span', { text: t('colDo') }));

    // Green
    const o = state.oxygen;
    const oxyDetail = [o.rest && t('oxyRest') + sep() + o.rest, o.activity && t('oxyActivity') + sep() + o.activity,
      o.sleep && t('oxySleep') + sep() + o.sleep, o.hours && t('oxyHours') + sep() + o.hours].filter(Boolean).join(' · ');
    const b = state.baseline;
    const baseline = el('dl', { class: 'baseline' },
      el('dt', { text: t('baselinePhlegm') }), el('dd', null, value(b.phlegm.trim())),
      el('dt', { text: t('baselineSpo2') }), el('dd', null, value(b.spo2.trim(), 'short')));
    const green = zone('green', 'well', 'greenSigns', [
      act(t('medDaily'), medLines('daily')),
      act(t('medReliever'), medLines('reliever')),
      act(null, [el('span', { class: 'act-label inline' }, t('oxygenLabel')), choice(t('no'), o.use === 'no'), choice(t('yes'), o.use === 'yes'),
        o.use !== 'no' && (oxyDetail ? el('span', { class: 'oxy', dir: 'auto', text: oxyDetail }) : line())], 'oxy-row'),
      act(t('stayWellLabel'), bullets('greenStayWell', null, 'cols')),
    ], baseline);

    // Yellow
    const steroid = filledMeds('rescueSteroid');
    const abx = filledMeds('rescueAbx');
    const hasRescue = steroid.length + abx.length > 0;
    const anyMeds = Object.keys(state.meds).some(k => filledMeds(k).length);
    const rescueKnown = hasRescue || anyMeds; // once meds are entered, "no prescription" is a real answer
    const relieverText = state.flare.reliever.trim() || filledMeds('reliever').map(r => [medName('reliever', r), r.instr.trim()].filter(Boolean).join(' — ')).join('; ');
    const medInline = (cat, rows) => rows.map(r => [medName(cat, r), r.instr.trim()].filter(Boolean).join(' — ')).join('; ');
    const phoneBits = [state.clinic.phone.trim() && t('clinicPhoneLabel') + sep() + state.clinic.phone.trim(),
      state.clinic.afterHours.trim() && t('afterHoursLabel') + sep() + state.clinic.afterHours.trim()].filter(Boolean);

    const step = (n, body) => el('div', { class: 'step' }, el('span', { class: 'num', text: n }), el('div', { class: 'step-body' }, body));
    const ifThen = (cond, doText, v, hint) => el('p', { class: 'if' },
      el('b', null, cond, C()), SP(), hint && el('span', { class: 'hint-inline', text: paren(hint) + SP() }), doText, v !== undefined && [sep(), v]);

    const yellow = zone('yellow', 'unwell', 'yellowSigns', [
      step('1', [
        el('p', { class: 'if' }, t('step1a'), state.flare.technique.trim() && [sep(), auto(state.flare.technique.trim())]),
        el('p', { class: 'if' }, t('step1b'), sep(), relieverText ? el('b', { dir: 'auto', text: relieverText }) : line()),
      ]),
      el('p', { class: 'rescue-q' }, el('b', { text: t('rescueQ') }),
        choice(t('rescueYes'), rescueKnown && hasRescue), choice(t('rescueNo'), rescueKnown && !hasRescue)),
      (!rescueKnown || hasRescue) && step('2', [
        ifThen(t('step2a'), t('step2aDo'), steroid.length ? el('b', { dir: 'auto', text: medInline('rescueSteroid', steroid) }) : line()),
        ifThen(t('step2b'), t('step2bDo'), abx.length ? el('b', { dir: 'auto', text: medInline('rescueAbx', abx) }) : line(), t('step2bHint')),
        el('p', { class: 'if' }, el('b', null, t('step2c'), C()), SP(),
          state.texts.step2cDo.trim() ? auto(state.texts.step2cDo.trim()) : t('step2cDo')),
        state.flare.followUp.trim() && el('p', { class: 'if' }, t('followUp'), /[:：]$/.test(t('followUp')) ? SP() : ' ', el('b', { dir: 'auto', text: state.flare.followUp.trim() })),
      ]),
      step('3', [
        el('p', { class: 'if' }, el('b', null, t('step3'), C()), SP(), state.texts.step3Do.trim() ? auto(state.texts.step3Do.trim()) : t('step3Do')),
        phoneBits.length > 0 && el('p', { class: 'phones', dir: 'auto', text: phoneBits.join(' · ') }),
      ]),
    ]);

    // Red
    const red = zone('red', 'very', 'redSigns', [
      el('div', { class: 'call' }, el('span', { text: t('callAmbulance') }), el('strong', { text: t('dialNow') })),
      act(t('whileWaiting'), bullets('redWhileWaiting', i => (i.key === 'rWait3' && relieverText) ? [sep(), el('span', { dir: 'auto', text: relieverText })] : null)),
      act(t('notesLabel'), state.redNotes.trim() ? el('span', { class: 'pre', dir: 'auto', text: state.redNotes.trim() }) : line('wide')),
    ]);

    return el('section', { class: 'page p1', 'aria-label': pageLabel(1) }, head, cols, green, yellow, red, pageFoot(1));
  }

  function pageFoot(n) {
    const last = n === (state.opts.page2 ? 2 : 1);
    const code = last && state.opts.editCode ? editCodeSvg() : null;
    const where = /^https?:/.test(location.protocol) ? location.host + location.pathname.replace(/index\.html$/, '') : '';
    const compact = !state.opts.page2; // page 1 has little room to spare
    return el('footer', { class: 'page-foot' + (code && code.svg ? ' with-code' : '') + (compact ? ' compact' : '') },
      el('div', { class: 'foot-text' },
        el('span', { text: `${t('title')} · ${pageLabel(n)}` }),
        el('span', { class: 'credit', text: `${t('creditLabel')} ${AUTHOR.name} · v${APP_VERSION}` })),
      code && code.svg && el('div', { class: 'edit-code', style: `--qr-modules: ${code.modules}` },
        el('div', { class: 'qr', 'aria-hidden': 'true', html: code.svg }),
        el('p', null, el('b', { text: 'Edit code' }), compact
          ? ' Care team: upload this PDF or a photo of it to the COPD Action Plan builder to edit.'
          : ` For the care team: to update this plan, upload this PDF or a photo of this page to the COPD Action Plan builder${where ? ' (' + where + ')' : ''}.`)));
  }

  function renderPage2() {
    const a = state.amb;
    const contacts = a.contacts.filter(c => c.name.trim() || c.phone.trim());
    const kv = (label, body, cls) => el('div', { class: 'kv' + (cls ? ' ' + cls : '') }, el('dt', { text: t(label) }), el('dd', null, body));

    const amb = el('section', { class: 'card amb' },
      el('h2', { class: 'card-head' }, el('span', { text: t('ambulanceTitle') }), el('small', { text: t('ambulanceSub') })),
      el('dl', { class: 'kv-grid' },
        kv('nameLabel', value(state.patient.name.trim())),
        kv('addressLabel', value(a.address.trim())),
        kv('contactsLabel', contacts.length
          ? el('ul', { class: 'contacts' }, contacts.map(c =>
              el('li', { dir: 'auto' }, el('b', { text: c.name.trim() }), c.rel.trim() && ` (${c.rel.trim()})`, c.phone.trim() && ` · ${c.phone.trim()}`)))
          : line('wide'), 'span2'),
        kv('allergiesLabel', value(a.allergies.trim())),
        kv('conditionsLabel', value(a.conditions.trim())),
        kv('oxygenTargetLabel', el('span', { class: 'inline' },
          el('span', null, t('spo2Target') + sep(), value(a.spo2.trim(), 'short')),
          el('span', null, tick(a.co2), ' ', t('co2Retainer')),
          el('span', null, tick(a.alertCard), ' ', t('alertCard'))), 'span2'),
        kv('acpLabel', el('span', { class: 'inline' }, choice(t('yes'), a.acp === 'yes'), choice(t('no'), a.acp === 'no'))),
        kv('sdmLabel', value(a.sdm.trim())),
        kv('firstResponderLabel', a.notes.trim() ? el('span', { class: 'pre', dir: 'auto', text: a.notes.trim() }) : line('wide'), 'span2')));

    const c = state.care;
    const smoke = [['never', 'smokeNever'], ['former', 'smokeFormer'], ['current', 'smokeCurrent']];
    const care = state.opts.care && el('section', { class: 'card care' },
      el('h2', { class: 'card-head', text: t('careTitle') }),
      el('dl', { class: 'care-grid' },
        CARE_ITEMS.map(([k]) => {
          const f = k.replace('care', '').replace(/^./, ch => ch.toLowerCase());
          return el('div', { class: 'care-item' }, el('dt', { text: t(k) }), el('dd', null, value((c[f] || '').trim())));
        }),
        el('div', { class: 'care-item smoking' }, el('dt', { text: t('smokingLabel') }),
          el('dd', null, smoke.map(([v, k]) => choice(t(k), c.smoking === v))))));

    const tip = (key, body) => el('div', { class: 'tip' }, el('h3', { text: t(key) }), body);
    const breathing = state.opts.breathing && el('section', { class: 'card breath' },
      el('h2', { class: 'card-head', text: t('breathTitle') }),
      el('p', { class: 'intro', text: t('breathIntro') }),
      el('div', { class: 'tips' },
        tip('tipPursed', el('p', { text: t('tipPursedDo') })),
        tip('tipPosition', el('p', { text: t('tipPositionDo') })),
        tip('tipPace', [el('p', { text: t('tipPaceDo') }), el('p', { class: 'mini-head', text: t('activitiesLabel') }), bullets('activities', null, 'cols')]),
        tip('tipCalm', el('p', { text: t('tipCalmDo') }))),
      el('p', { class: 'settle', text: t('settle') }));

    const resources = state.resources.filter(r => r.label.trim() || r.detail.trim());
    const res = resources.length > 0 && el('section', { class: 'resources' },
      el('h3', { text: t('resourcesTitle') }),
      el('ul', null, resources.map(r => el('li', null, el('b', { dir: 'auto', text: r.label.trim() }), r.detail.trim() && el('span', { dir: 'auto', text: r.detail.trim() })))));

    return el('section', { class: 'page p2', 'aria-label': pageLabel(2) },
      brandBar(true), amb, care, breathing, res,
      el('p', { class: 'disclaimer', text: t('disclaimer') }),
      pageFoot(2));
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    const locale = { yue: 'zh-HK', zh: 'zh-CN', en: 'en-CA', fr: 'fr-CA' }[state.lang] || state.lang;
    try { return new Date(y, m - 1, d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return iso; }
  }

  const PAPER = { letter: { w: '8.5in', h: '11in' }, a4: { w: '210mm', h: '297mm' } };

  function renderSheet() {
    const sheet = $('#sheet');
    const lang = state.lang;
    sheet.lang = lang === 'yue' ? 'zh-Hant' : lang === 'zh' ? 'zh-Hans' : lang;
    sheet.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
    sheet.classList.toggle('greyscale', state.opts.greyscale);
    const paper = PAPER[state.opts.paper];
    sheet.style.setProperty('--page-w', paper.w);
    sheet.style.setProperty('--page-h', paper.h);
    $('#page-style').textContent = `@page { size: ${state.opts.paper === 'a4' ? 'A4' : 'letter'} portrait; margin: 0; }`;
    sheet.replaceChildren(...[renderPage1(), state.opts.page2 && renderPage2()].filter(Boolean));
    sheet.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', refit, { once: true }); });
    refit();
  }

  // Fit text at true size (zoom 1, exactly as printed), then scale the preview to the column.
  function refit() {
    $('#sheet').style.zoom = 1;
    checkOverflow();
    fitPreview();
  }

  // Scale the true-size pages to fit the preview column.
  function fitPreview() {
    const wrap = $('#sheet-wrap');
    const sheet = $('#sheet');
    sheet.style.zoom = 1;
    const page = sheet.querySelector('.page');
    if (!page) return;
    const avail = wrap.clientWidth;
    const z = Math.min(1, avail / page.offsetWidth);
    sheet.style.zoom = z.toFixed(3);
  }

  // Shrink a crowded page's text in small steps (down to a readable minimum) so it fits on one sheet.
  const BASE_PT = 9.6, MIN_PT = 8.0, FLOOR_PT = 7.6;
  function autoFit() {
    const over = page => page.scrollHeight > page.clientHeight + 1;
    document.querySelectorAll('#sheet .page').forEach(page => {
      let pt = BASE_PT;
      page.style.fontSize = '';
      page.style.lineHeight = '';
      // 1) shrink text a little at a time; 2) then tighten line spacing; 3) then a final small step
      while (over(page) && pt > MIN_PT) {
        pt = Math.round((pt - 0.2) * 10) / 10;
        page.style.fontSize = pt + 'pt';
      }
      if (over(page)) page.style.lineHeight = '1.2';
      while (over(page) && pt > FLOOR_PT) {
        pt = Math.round((pt - 0.1) * 10) / 10;
        page.style.fontSize = pt + 'pt';
      }
    });
  }

  function checkOverflow() {
    autoFit();
    const codeNote = $('#code-warning');
    if (codeNote) { codeNote.hidden = !(state.opts.editCode && lastCode.error); codeNote.textContent = lastCode.error; }
    const warn = $('#fit-warning');
    const over = [...document.querySelectorAll('#sheet .page')].filter(p => p.scrollHeight > p.clientHeight + 2)
      .map(p => (p.classList.contains('p1') ? '1' : '2'));
    warn.hidden = !over.length;
    warn.textContent = over.length
      ? `${over.length > 1 ? 'Pages 1 and 2 are' : `Page ${over[0]} is`} too full to print on one sheet. Shorten or untick some items, turn off inhaler pictures, or switch off "Breathing easier".`
      : '';
  }
  window.addEventListener('resize', () => { clearTimeout(fitPreview.t); fitPreview.t = setTimeout(fitPreview, 100); });
  // Printing always uses true size; re-fit just before and restore the preview after.
  window.addEventListener('beforeprint', () => { $('#sheet').style.zoom = 1; checkOverflow(); });
  window.addEventListener('afterprint', fitPreview);

  // Keep the sticky preview below the top bar, whose height changes as its buttons wrap.
  function syncTopbarHeight() {
    document.documentElement.style.setProperty('--topbar-h', $('.topbar').offsetHeight + 'px');
  }
  window.addEventListener('resize', syncTopbarHeight);

  // ============================================================
  function changed(path) {
    if (!path || PLAN_FIELDS.includes(path.split('.')[0])) planDirty = true;
    renderSheet();
    saveTemplate();
  }

  function renderAll() {
    syncBoundFields();
    mountListEditors();
    renderSheet();
  }

  $('#about-version').textContent = APP_VERSION;
  $('#about-author').textContent = AUTHOR.name;
  $('#topbar-author').textContent = AUTHOR.name;
  $('#topbar-email').textContent = AUTHOR.email;
  $('#topbar-email').href = 'mailto:' + AUTHOR.email;
  // Buttons that open a hidden file picker (keyboard-accessible, unlike a styled <label>)
  document.querySelectorAll('[data-file]').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById(btn.dataset.file).click());
  });
  $('#top-template-save').addEventListener('click', () => $('#template-save').click());
  $('#top-template-reset').addEventListener('click', () => $('#reset-template').click());
  $('#about-email').textContent = AUTHOR.email;
  $('#about-email').href = 'mailto:' + AUTHOR.email;
  $('#about-reviewed').textContent = CONTENT_REVIEWED;
  if (window.OFFLINE_BUILD) {
    const ob = window.OFFLINE_BUILD;
    $('.brand > span').textContent += ` Offline copy, version ${ob.version} (${ob.built}).`;
    $('#about-download').hidden = true;
    const note = $('#about-offline');
    note.hidden = false;
    note.append('This is the single-file offline copy. It works without internet. The newest version is at ', el('a', { href: ob.online, target: '_blank', rel: 'noopener', text: ob.online }), '.');
  }
  renderAll();
  syncTopbarHeight();
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(() => { refit(); syncTopbarHeight(); });
    document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', refit);
  }
})();
