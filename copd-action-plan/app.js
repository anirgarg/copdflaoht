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
      opts: { page2: true, breathing: true, care: true, images: true, ticks: false, greyscale: false, paper: 'letter' },
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

  function status(msg, isError) {
    const s = $('#status');
    s.textContent = msg;
    s.classList.toggle('error', !!isError);
    clearTimeout(status.timer);
    status.timer = setTimeout(() => { s.textContent = ''; }, 5000);
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
  readJSONFile($('#plan-file'), (data, name) => {
    if (!data || data.kind !== 'plan' || !data.plan) { status('That is not a saved patient plan. Use "Load template" for clinic template files.', true); return; }
    // Plans saved before v2.2 kept the language and wording in data.template; use them if present.
    const legacy = data.template && typeof data.template === 'object' ? hydrateTemplate(data.template) : null;
    const base = {
      defaultLang: legacy && (has(data.template, 'lang') || has(data.template, 'defaultLang')) ? legacy.defaultLang : state.defaultLang,
      defaultLists: legacy && (has(data.template, 'lists') || has(data.template, 'defaultLists')) ? legacy.defaultLists : state.defaultLists,
    };
    const plan = hydratePlan(data.plan, base); // the clinic template on this computer is left as it is
    state = { ...state, ...plan };
    reviewTouched = true;
    planDirty = false;
    renderAll();
    status(`Opened ${name}.`);
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
    return el('footer', { class: 'page-foot' },
      el('span', { text: `${t('title')} · ${pageLabel(n)}` }),
      el('span', { class: 'credit', text: `${t('creditLabel')} ${AUTHOR.name} · v${APP_VERSION}` }));
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
  renderAll();
  syncTopbarHeight();
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(() => { refit(); syncTopbarHeight(); });
    document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', refit);
  }
})();
