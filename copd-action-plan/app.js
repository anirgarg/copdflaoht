/* COPD Action Plan — editor + printable two-page plan.
 *
 * State has two parts:
 *   template — clinic details, wording, resources, layout. Remembered in this browser.
 *   plan     — everything about the patient. Never stored by the app; the clinician
 *              can save it to a file on their own computer.
 * The printed pages are re-rendered from state on every change. */
(function () {
  'use strict';

  const TEMPLATE_KEY = 'copd-action-plan:template:v2';
  const $ = (sel, root = document) => root.querySelector(sel);
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------- defaults ----------
  const emptyMed = () => ({ med: '', other: '', instr: '' });
  const listFromKeys = keys => keys.map(key => ({ key, on: !OPTIONAL_ITEMS.includes(key) }));

  function defaultTemplate() {
    const lists = {};
    Object.keys(DEFAULT_LISTS).forEach(k => { lists[k] = listFromKeys(DEFAULT_LISTS[k]); });
    return {
      lang: 'en',
      clinic: { ...CLINIC_DEFAULTS, logo: '' },
      lists,
      texts: { days: '2–3', step2cDo: '', step3Do: '' },
      resources: clone(RESOURCE_DEFAULTS),
      opts: { page2: true, breathing: true, care: true, images: true, ticks: false, greyscale: false, paper: 'letter' },
    };
  }

  function defaultPlan() {
    return {
      patient: { name: '', date: todayISO(), review: addMonthsISO(todayISO(), 12) },
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
  const cleanList = items => items
    .filter(i => i && (typeof i.text === 'string' || (i.key && TRANSLATIONS.en[i.key])))
    .map(i => (i.key && TRANSLATIONS.en[i.key]) ? { key: i.key, on: i.on !== false } : { text: String(i.text), on: i.on !== false });
  const cleanRows = (rows, shape) => rows.filter(r => r && typeof r === 'object')
    .map(r => { const o = {}; Object.keys(shape).forEach(k => { o[k] = typeof r[k] === 'string' ? r[k] : shape[k]; }); return o; });

  function hydrateTemplate(saved) {
    const t = merge(defaultTemplate(), saved);
    if (!TRANSLATIONS[t.lang]) t.lang = 'en';
    Object.keys(DEFAULT_LISTS).forEach(k => { t.lists[k] = cleanList(t.lists[k] || []); });
    t.resources = cleanRows(t.resources, { label: '', detail: '' });
    if (!['letter', 'a4'].includes(t.opts.paper)) t.opts.paper = 'letter';
    if (typeof t.clinic.logo !== 'string' || !t.clinic.logo.startsWith('data:image/')) t.clinic.logo = '';
    return t;
  }
  function hydratePlan(saved) {
    const p = merge(defaultPlan(), saved);
    Object.keys(p.meds).forEach(k => {
      p.meds[k] = cleanRows(p.meds[k], emptyMed());
      if (!p.meds[k].length) p.meds[k].push(emptyMed());
    });
    p.amb.contacts = cleanRows(p.amb.contacts, { name: '', rel: '', phone: '' });
    return p;
  }

  function pick(obj, keys) { const o = {}; keys.forEach(k => { o[k] = obj[k]; }); return clone(o); }

  // ---------- state ----------
  let state = { ...loadTemplate(), ...defaultPlan() };
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
    return s.replace('{emergency}', state.clinic.emergency.trim() || '911')
            .replace('{days}', state.texts.days.trim() || '2–3');
  }
  const itemText = item => (item.key ? t(item.key) : item.text);

  function medOptions(cat) { return MED_CATEGORIES[cat].groups.flatMap(g => g[1]); }
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

  // Placeholders that follow the clinic defaults
  $('#clinic-name').placeholder = CLINIC_DEFAULTS.name;

  const langSelect = $('#lang-select');
  LANGUAGES.forEach(([code, label]) => langSelect.append(el('option', { value: code, text: label })));

  // ---- generic list editor: add / remove / reorder rows ----
  function mountList(container, cfg) {
    const draw = (focusIndex) => {
      const items = cfg.items();
      container.replaceChildren();
      const ul = el('ol', { class: 'lrows', 'aria-label': cfg.label });
      items.forEach((item, i) => {
        const move = (dir) => {
          const j = i + dir;
          [items[i], items[j]] = [items[j], items[i]];
          draw(j);
          changed();
        };
        const li = el('li', { class: 'lrow' + (item.on === false ? ' off' : '') },
          el('div', { class: 'lrow-fields' }, cfg.render(item, i)),
          el('div', { class: 'lrow-ctrl' },
            cfg.reorder !== false && el('button', { type: 'button', class: 'icon-btn', title: 'Move up', 'aria-label': 'Move up', disabled: i === 0, text: '↑', onclick: () => move(-1) }),
            cfg.reorder !== false && el('button', { type: 'button', class: 'icon-btn', title: 'Move down', 'aria-label': 'Move down', disabled: i === items.length - 1, text: '↓', onclick: () => move(1) }),
            el('button', {
              type: 'button', class: 'icon-btn del', title: 'Remove', 'aria-label': 'Remove row', text: '×',
              onclick: () => {
                items.splice(i, 1);
                if (cfg.keepOne && !items.length) items.push(cfg.create());
                draw(Math.min(i, items.length - 1));
                changed();
              },
            })));
        ul.append(li);
      });
      container.append(ul, el('button', {
        type: 'button', class: 'add-btn', text: '+ ' + cfg.addLabel,
        onclick: () => { items.push(cfg.create()); draw(items.length - 1); changed(); },
      }));
      if (focusIndex != null && focusIndex >= 0) {
        const row = ul.children[focusIndex];
        const target = row && row.querySelector('input[type="text"], select, input:not([type])');
        if (target) target.focus();
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
        changed();
      });
      other.addEventListener('input', () => { row.other = other.value; changed(); });
      instr.addEventListener('input', () => { row.instr = instr.value; changed(); });
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
      changed();
    });
    input.addEventListener('input', () => { delete item.key; item.text = input.value; changed(); });
    return [check, input];
  }

  function fieldsRow(fields) {
    return (row) => fields.map(([key, label, cls]) => {
      const input = el('input', { type: 'text', class: cls || '', placeholder: label, 'aria-label': label, value: row[key] });
      input.addEventListener('input', () => { row[key] = input.value; changed(); });
      return input;
    });
  }

  function mountListEditors() {
    document.querySelectorAll('[data-meds]').forEach(c => {
      const cat = c.dataset.meds;
      mountList(c, {
        items: () => state.meds[cat], render: medRow(cat), create: emptyMed, keepOne: true,
        addLabel: cat === 'daily' ? 'Add another daily medicine' : 'Add another', label: TRANSLATIONS.en[MED_CATEGORIES[cat].labelKey],
      });
    });
    document.querySelectorAll('[data-list]').forEach(c => {
      const key = c.dataset.list;
      mountList(c, {
        items: () => state.lists[key], render: textItemRow, create: () => ({ text: '', on: true }),
        addLabel: c.dataset.add || 'Add item', label: c.dataset.add,
      });
    });
    mountList($('#contacts-editor'), {
      items: () => state.amb.contacts, create: () => ({ name: '', rel: '', phone: '' }), addLabel: 'Add contact', label: 'Emergency contacts',
      render: fieldsRow([['name', 'Name'], ['rel', 'Relationship', 'narrow'], ['phone', 'Phone', 'narrow']]),
    });
    mountList($('#resources-editor'), {
      items: () => state.resources, create: () => ({ label: '', detail: '' }), addLabel: 'Add resource', label: 'Resources',
      render: fieldsRow([['label', 'Name'], ['detail', 'Phone / website']]),
    });
  }

  document.querySelectorAll('[data-reset-list]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.dataset.resetList.split(' ').forEach(k => { state.lists[k] = listFromKeys(DEFAULT_LISTS[k]); });
      mountListEditors();
      changed();
      status('Default wording restored.');
    });
  });
  $('#reset-resources').addEventListener('click', () => {
    state.resources = clone(RESOURCE_DEFAULTS);
    mountListEditors();
    changed();
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
        changed();
        status('Logo added.');
      };
      img.onerror = () => status('That image could not be read.', true);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  $('#logo-remove').addEventListener('click', () => { state.clinic.logo = ''; changed(); });

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
  const slug = s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  $('#template-save').addEventListener('click', () => {
    download(`copd-plan-clinic-template${state.clinic.name ? '-' + slug(state.clinic.name) : ''}.json`,
      { app: 'copd-action-plan', kind: 'template', version: APP_VERSION, ...pick(state, TEMPLATE_FIELDS) });
    status('Clinic template saved. It contains no patient information.');
  });
  readJSONFile($('#template-file'), (data, name) => {
    state = { ...state, ...hydrateTemplate(data.kind === 'plan' ? data.template : data) };
    renderAll();
    saveTemplate();
    status(`Clinic template loaded from ${name}.`);
  });

  $('#plan-save').addEventListener('click', () => {
    const who = state.patient.name ? '-' + slug(state.patient.name) : '';
    download(`copd-action-plan${who}-${state.patient.date || todayISO()}.json`,
      { app: 'copd-action-plan', kind: 'plan', version: APP_VERSION, plan: pick(state, PLAN_FIELDS), template: pick(state, TEMPLATE_FIELDS) });
    planDirty = false;
    status('Plan saved to your computer. Store it as you would any health record.');
  });
  readJSONFile($('#plan-file'), (data, name) => {
    if (data.kind !== 'plan' || !data.plan) { status('That is not a saved patient plan. Use "Load clinic template" for template files.', true); return; }
    state = { ...state, ...hydratePlan(data.plan), ...(data.template ? hydrateTemplate(data.template) : {}) };
    reviewTouched = true;
    planDirty = false;
    renderAll();
    status(`Opened ${name}.`);
  });

  $('#new-patient').addEventListener('click', () => {
    if (planDirty && !window.confirm('Clear this patient\'s details and start a new plan? Unsaved changes will be lost.')) return;
    state = { ...state, ...defaultPlan() };
    reviewTouched = false;
    planDirty = false;
    renderAll();
    status('Ready for a new patient.');
  });
  $('#reset-template').addEventListener('click', () => {
    if (!window.confirm('Reset clinic details, wording, resources and layout to the original defaults?')) return;
    state = { ...state, ...defaultTemplate() };
    try { localStorage.removeItem(TEMPLATE_KEY); } catch (e) { /* ignore */ }
    renderAll();
    status('Clinic settings reset.');
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
    html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="9.8" r=".6" fill="currentColor"/><circle cx="15" cy="9.8" r=".6" fill="currentColor"/>${FACE[mood]}</svg>`,
  });

  const fill = (content, cls) => {
    const has = content != null && content !== '' && !(Array.isArray(content) && !content.length);
    return el('div', { class: 'ans' + (has ? '' : ' blank') + (cls ? ' ' + cls : '') }, has ? content : null);
  };
  const auto = text => el('span', { dir: 'auto', text });
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
    if (!rows.length) return null;
    const anyImg = state.opts.images && rows.some(r => MED_IMAGES[r.med]);
    return el('ul', { class: 'meds' }, rows.map(r => {
      const img = anyImg && MED_IMAGES[r.med];
      return el('li', null,
        img ? el('img', { src: img, alt: '' }) : anyImg && el('span', { class: 'img-slot' }),
        el('span', { class: 'mtext' },
          medName(cat, r) && el('b', { dir: 'auto', text: medName(cat, r) }),
          r.instr.trim() && auto(r.instr.trim())));
    }));
  }

  const row = (cond, ans, cls) => el('div', { class: 'row' + (cls ? ' ' + cls : '') }, el('div', { class: 'cond' }, cond), ans);
  const doLine = (lead, content) => el('span', { class: 'do' }, el('span', { class: 'arrow', 'aria-hidden': 'true', text: '›››' }), el('span', null, lead, content));

  function zone(cls, mood, title, sub, signsKey, body, extra) {
    return el('section', { class: 'zone ' + cls },
      el('div', { class: 'z-left' },
        el('h3', { class: 'tab' }, el('span', { text: title }), face(mood)),
        el('div', { class: 'signs' }, el('h4', { text: sub }), bullets(signsKey), extra)),
      el('div', { class: 'z-right' },
        el('div', { class: 'tab', text: t('myPlan') }),
        el('div', { class: 'rows' }, body)));
  }

  function renderPage1() {
    const clinicName = state.clinic.name.trim() || CLINIC_DEFAULTS.name;
    const prepared = [state.clinic.provider.trim(), clinicName, state.clinic.phone.trim()].filter(Boolean).join(' · ');
    const fmt = iso => (iso ? formatDate(iso) : '');

    const head = el('header', { class: 'p-head' },
      el('h2', { class: 'p-title' }, el('span', { text: t('title1') }), el('span', { text: t('title2') })),
      el('dl', { class: 'p-fields' },
        el('dt', { text: t('nameLabel') }), fill(state.patient.name.trim() && auto(state.patient.name.trim()), 'big'),
        el('dt', { text: t('preparedLabel') }), fill(prepared && auto(prepared)),
        el('dt', { text: t('dateLabel') }),
        el('div', { class: 'date-pair' }, fill(fmt(state.patient.date)),
          el('span', { class: 'dt', text: t('reviewLabel') }), fill(fmt(state.patient.review)))),
      el('div', { class: 'p-side' },
        state.clinic.logo && el('img', { class: 'logo', src: state.clinic.logo, alt: clinicName }),
        el('p', { class: 'review-note', text: t('reviewNote') })));

    // Green
    const o = state.oxygen;
    const oxyDetail = [o.rest && `${t('oxyRest')}: ${o.rest}`, o.activity && `${t('oxyActivity')}: ${o.activity}`,
      o.sleep && `${t('oxySleep')}: ${o.sleep}`, o.hours && `${t('oxyHours')}: ${o.hours}`].filter(Boolean).join(' · ');
    const b = state.baseline;
    const baseItem = (label, v) => [el('dt', { text: label + ':' }), el('dd', { class: v ? '' : 'blank', dir: 'auto', text: v })];
    const baseline = el('dl', { class: 'baseline' },
      baseItem(t('baselinePhlegm'), b.phlegm.trim()), baseItem(t('baselineSpo2'), b.spo2.trim()));
    const green = zone('green', 'well', t('greenTitle'), t('greenSub'), 'greenSigns', [
      row(t('medDaily'), fill(medLines('daily'))),
      row(t('medReliever'), fill(medLines('reliever'))),
      row(el('span', { class: 'oxy-q' }, t('oxygenLabel'), choice(t('no'), o.use === 'no'), choice(t('yes'), o.use === 'yes')),
        fill(o.use === 'no' ? null : (oxyDetail && auto(oxyDetail)), o.use === 'no' ? 'none' : '')),
      row(t('stayWellLabel'), el('div', { class: 'ans list' }, bullets('greenStayWell', null, 'cols'))),
    ], baseline);

    // Yellow
    const steroid = filledMeds('rescueSteroid');
    const abx = filledMeds('rescueAbx');
    const hasRescue = steroid.length + abx.length > 0;
    const anyMeds = Object.keys(state.meds).some(k => filledMeds(k).length);
    const rescueKnown = hasRescue || anyMeds; // once meds are entered, "no rescue pack" is a real answer
    const relieverText = state.flare.reliever.trim() || filledMeds('reliever').map(r => [medName('reliever', r), r.instr.trim()].filter(Boolean).join(' — ')).join('; ');
    const medInline = (cat, rows) => rows.map(r => [medName(cat, r), r.instr.trim()].filter(Boolean).join(' — ')).join('; ');
    const phoneBits = [state.clinic.phone.trim() && `${t('clinicPhoneLabel')}: ${state.clinic.phone.trim()}`,
      state.clinic.afterHours.trim() && `${t('afterHoursLabel')}: ${state.clinic.afterHours.trim()}`].filter(Boolean);

    const step = (n, cls, rows) => el('div', { class: 'step ' + cls },
      el('div', { class: 'num', text: n }), el('div', { class: 'step-rows' }, rows));

    const yellowRows = [
      step('1', 's1', [
        row(t('step1a'), fill(state.flare.technique.trim() && auto(state.flare.technique.trim()))),
        row(t('step1b'), fill(relieverText && auto(relieverText))),
      ]),
      el('div', { class: 'rescue-q' }, el('span', null, t('rescueQ')),
        choice(t('rescueYes'), rescueKnown && hasRescue), choice(t('rescueNo'), rescueKnown && !hasRescue)),
      (!rescueKnown || hasRescue) && step('2', 's2', [
        row(t('step2a'), el('div', { class: 'ans do-ans' }, doLine(t('step2aDo') + ': ', steroid.length ? el('b', { dir: 'auto', text: medInline('rescueSteroid', steroid) }) : el('span', { class: 'blank-inline' })))),
        row([t('step2b'), el('small', { text: t('step2bHint') })],
          el('div', { class: 'ans do-ans' }, doLine(t('step2bDo') + ': ', abx.length ? el('b', { dir: 'auto', text: medInline('rescueAbx', abx) }) : el('span', { class: 'blank-inline' })))),
        row(t('step2c'), el('div', { class: 'ans do-ans' },
          doLine(state.texts.step2cDo.trim() ? auto(state.texts.step2cDo.trim()) : t('step2cDo')),
          state.flare.followUp.trim() && doLine(t('followUp') + ' ', el('b', { dir: 'auto', text: state.flare.followUp.trim() })))),
      ]),
      step('3', 's3', [
        row(t('step3'), el('div', { class: 'ans do-ans' },
          doLine(state.texts.step3Do.trim() ? auto(state.texts.step3Do.trim()) : t('step3Do')),
          phoneBits.length && el('span', { class: 'phones', dir: 'auto', text: phoneBits.join(' · ') }))),
      ]),
    ];
    const yellow = zone('yellow', 'unwell', t('yellowTitle'), t('yellowSub'), 'yellowSigns', yellowRows);

    // Red
    const red = zone('red', 'very', t('redTitle'), t('redSub'), 'redSigns', [
      row(el('b', { class: 'shout', text: t('callAmbulance') }), el('div', { class: 'ans shout', text: t('dialNow') }), 'call'),
      row(el('b', { text: t('whileWaiting') }), el('div', { class: 'ans list' },
        bullets('redWhileWaiting', i => (i.key === 'rWait3' && relieverText) ? el('span', { dir: 'auto', text: ': ' + relieverText }) : null))),
      row(t('notesLabel'), fill(state.redNotes.trim() && el('span', { class: 'pre', dir: 'auto', text: state.redNotes.trim() }))),
    ]);

    return el('section', { class: 'page p1', 'aria-label': t('page') + ' 1' }, head, green, yellow, red);
  }

  function renderPage2() {
    const a = state.amb;
    const contacts = a.contacts.filter(c => c.name.trim() || c.phone.trim());
    const ambRows = [
      row(t('addressLabel'), fill(a.address.trim() && auto(a.address.trim()))),
      row(t('contactsLabel'), contacts.length
        ? el('div', { class: 'ans' }, el('ul', { class: 'contacts' }, contacts.map(c =>
            el('li', { dir: 'auto' }, el('b', { text: c.name.trim() }), c.rel.trim() && ` (${c.rel.trim()})`, c.phone.trim() && ` · ${c.phone.trim()}`))))
        : el('div', { class: 'ans split' },
            el('span', { class: 'lbl', text: t('contactName') }), el('span', { class: 'blank-inline' }),
            el('span', { class: 'lbl', text: t('contactPhone') }), el('span', { class: 'blank-inline' }))),
      row(t('allergiesLabel'), fill(a.allergies.trim() && auto(a.allergies.trim()))),
      row(t('conditionsLabel'), fill(a.conditions.trim() && auto(a.conditions.trim()))),
      row(t('oxygenTargetLabel'), el('div', { class: 'ans inline' },
        el('span', null, t('spo2Target') + ': ', a.spo2.trim() ? el('b', { dir: 'auto', text: a.spo2.trim() }) : el('span', { class: 'blank-inline short' })),
        el('span', null, tick(a.co2), ' ', t('co2Retainer')),
        el('span', null, tick(a.alertCard), ' ', t('alertCard')))),
      row(t('acpLabel'), el('div', { class: 'ans inline' },
        choice(t('yes'), a.acp === 'yes'), choice(t('no'), a.acp === 'no'),
        el('span', null, t('sdmLabel') + ': ', a.sdm.trim() ? el('b', { dir: 'auto', text: a.sdm.trim() }) : el('span', { class: 'blank-inline' })))),
      row(t('firstResponderLabel'), fill(a.notes.trim() && el('span', { class: 'pre', dir: 'auto', text: a.notes.trim() }))),
    ];

    const amb = el('section', { class: 'amb' },
      el('h2', { class: 'p2-title red-text', text: t('ambulanceTitle') }),
      el('div', { class: 'amb-box' }, el('div', { class: 'tab', text: t('ambulanceSub') }), el('div', { class: 'rows' }, ambRows)));

    const c = state.care;
    const smoke = [['never', 'smokeNever'], ['former', 'smokeFormer'], ['current', 'smokeCurrent']];
    const care = state.opts.care && el('section', { class: 'care' },
      el('h4', { text: t('careTitle') }),
      el('dl', { class: 'care-grid' },
        CARE_ITEMS.map(([k]) => {
          const field = k.replace('care', '').replace(/^./, ch => ch.toLowerCase());
          const v = (c[field] || '').trim();
          return el('div', { class: 'care-item' }, el('dt', { text: t(k) }), el('dd', { class: v ? '' : 'blank', dir: 'auto', text: v }));
        }),
        el('div', { class: 'care-item smoking' }, el('dt', { text: t('smokingLabel') }),
          el('dd', null, smoke.map(([v, k]) => choice(t(k), c.smoking === v))))));

    const steps = [['bStop', 'bStopDo'], ['bThink', 'bThinkDo'], ['bPosition', 'bPositionDo'], ['bBreathe', 'bBreatheDo'], ['bAir', 'bAirDo']];
    const breathing = state.opts.breathing && el('section', { class: 'breath' },
      el('div', { class: 'breath-left' },
        el('h2', { class: 'p2-title green-text', text: t('breathTitle') }),
        el('p', { class: 'intro', text: t('breathIntro') }),
        el('h4', { text: t('activitiesLabel') }),
        el('div', { class: 'activities' }, bullets('activities')),
        el('div', { class: 'after10' },
          el('p', null, el('b', { text: t('after10') })),
          el('p', { class: 'yn' }, el('span', { class: 'pill yes', text: t('yes') }), t('after10Yes')),
          el('p', { class: 'yn' }, el('span', { class: 'pill no', text: t('no') }), t('after10No')))),
      el('div', { class: 'breath-right' },
        el('h4', { class: 'green-text', text: t('whenBreathless') }),
        el('ol', { class: 'bsteps' }, steps.map(([k, d]) => el('li', null, el('b', { text: t(k) }), el('span', { text: t(d) }))))));

    const resources = state.resources.filter(r => r.label.trim() || r.detail.trim());
    const footer = el('footer', { class: 'p2-foot' },
      resources.length && el('div', { class: 'resources' },
        el('h4', { text: t('resourcesTitle') }),
        el('ul', null, resources.map(r => el('li', null, el('b', { dir: 'auto', text: r.label.trim() }), r.detail.trim() && el('span', { dir: 'auto', text: r.detail.trim() }))))),
      el('p', { class: 'disclaimer', text: t('disclaimer') }),
      el('p', { class: 'meta', text: `${state.clinic.name.trim() || CLINIC_DEFAULTS.name} · COPD Action Plan v${APP_VERSION} (content reviewed ${CONTENT_REVIEWED}) · Layout informed by Lung Foundation Australia's My COPD Action Plan; not endorsed by Lung Foundation Australia.` }));

    return el('section', { class: 'page p2', 'aria-label': t('page') + ' 2' }, amb, care, breathing, footer);
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    const locale = { yue: 'zh-HK', zh: 'zh-CN', en: 'en-CA' }[state.lang] || state.lang;
    try { return new Date(y, m - 1, d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return iso; }
  }

  const PAPER = { letter: { w: '11in', h: '8.5in' }, a4: { w: '297mm', h: '210mm' } };

  function renderSheet() {
    const sheet = $('#sheet');
    const lang = state.lang;
    sheet.lang = lang === 'yue' ? 'zh-Hant' : lang === 'zh' ? 'zh-Hans' : lang;
    sheet.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
    sheet.classList.toggle('greyscale', state.opts.greyscale);
    const paper = PAPER[state.opts.paper];
    sheet.style.setProperty('--page-w', paper.w);
    sheet.style.setProperty('--page-h', paper.h);
    $('#page-style').textContent = `@page { size: ${state.opts.paper === 'a4' ? 'A4' : 'letter'} landscape; margin: 0; }`;
    sheet.replaceChildren(renderPage1(), state.opts.page2 ? renderPage2() : null);
    fitPreview();
    checkOverflow();
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

  function checkOverflow() {
    const warn = $('#fit-warning');
    const over = [...document.querySelectorAll('#sheet .page')].filter(p => p.scrollHeight > p.clientHeight + 2)
      .map(p => (p.classList.contains('p1') ? '1' : '2'));
    warn.hidden = !over.length;
    warn.textContent = over.length
      ? `Page ${over.join(' and ')} is too full to print on one sheet. Shorten or untick some items, remove pictures, or switch off "Managing breathlessness".`
      : '';
  }
  window.addEventListener('resize', () => { clearTimeout(fitPreview.t); fitPreview.t = setTimeout(fitPreview, 100); });

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
  $('#about-reviewed').textContent = CONTENT_REVIEWED;
  renderAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitPreview(); checkOverflow(); });
})();
