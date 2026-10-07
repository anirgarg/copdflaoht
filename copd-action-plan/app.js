/* COPD Action Plan — editor + printable sheet.
 * State lives in one object; the sheet is re-rendered from it on every change. */
(function () {
  'use strict';

  const STORAGE_KEY = 'copd-action-plan:v1';
  const $ = (sel, root = document) => root.querySelector(sel);

  let uid = 0;
  const newId = () => 'i' + Date.now().toString(36) + (uid++).toString(36);

  // ---------- state ----------
  function defaultState() {
    const meds = {};
    MED_CATEGORIES.forEach(c => { meds[c.id] = [{ id: newId(), med: '', other: '', instr: '' }]; });
    const zones = {};
    Object.keys(DEFAULT_ZONES).forEach(z => {
      zones[z] = {
        symptoms: DEFAULT_ZONES[z].symptoms.map(key => ({ id: newId(), key, on: true })),
        actions: DEFAULT_ZONES[z].actions.map(key => ({ id: newId(), key, on: true })),
      };
    });
    return {
      lang: 'en',
      patient: { name: '', date: todayISO() },
      clinic: { name: '', phone: '', provider: '', emergency: '' },
      meds,
      zones,
      notes: '',
      opts: { images: true, checkboxes: true, faces: true, blankLines: false, largePrint: false },
    };
  }

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  // Merge saved/imported data over defaults so older files keep working.
  function hydrate(saved) {
    const s = defaultState();
    if (!saved || typeof saved !== 'object') return s;
    if (TRANSLATIONS[saved.lang]) s.lang = saved.lang;
    Object.assign(s.clinic, pickStrings(saved.clinic, Object.keys(s.clinic)));
    Object.assign(s.opts, pickBools(saved.opts, Object.keys(s.opts)));
    if (typeof saved.notes === 'string') s.notes = saved.notes;
    if (saved.meds) {
      MED_CATEGORIES.forEach(c => {
        const rows = saved.meds[c.id];
        if (Array.isArray(rows) && rows.length) {
          s.meds[c.id] = rows.map(r => ({ id: newId(), ...pickStrings(r, ['med', 'other', 'instr']) }));
        }
      });
    }
    if (saved.zones) {
      Object.keys(s.zones).forEach(z => {
        ['symptoms', 'actions'].forEach(list => {
          const items = saved.zones[z] && saved.zones[z][list];
          if (Array.isArray(items)) {
            s.zones[z][list] = items
              .filter(i => i && (typeof i.text === 'string' || TRANSLATIONS.en[i.key]))
              .map(i => (i.key && TRANSLATIONS.en[i.key])
                ? { id: newId(), key: i.key, on: i.on !== false }
                : { id: newId(), text: String(i.text), on: i.on !== false });
          }
        });
      });
    }
    return s;
  }
  function pickStrings(obj, keys) {
    const out = {};
    if (obj) keys.forEach(k => { if (typeof obj[k] === 'string') out[k] = obj[k]; });
    return out;
  }
  function pickBools(obj, keys) {
    const out = {};
    if (obj) keys.forEach(k => { if (typeof obj[k] === 'boolean') out[k] = obj[k]; });
    return out;
  }

  // Everything except the patient is remembered.
  function templateOf(s) {
    const { patient, ...rest } = s;
    return JSON.parse(JSON.stringify(rest, (k, v) => (k === 'id' ? undefined : v)));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return hydrate(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return defaultState();
    }
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(templateOf(state))); } catch (e) { /* storage unavailable */ }
    }, 250);
  }

  let state = load();

  // ---------- helpers ----------
  const t = key => {
    const dict = TRANSLATIONS[state.lang] || TRANSLATIONS.en;
    const s = dict[key] != null ? dict[key] : TRANSLATIONS.en[key];
    return (s || '').replace('{emergency}', state.clinic.emergency.trim() || '911');
  };
  const itemText = item => (item.key ? t(item.key) : item.text);

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
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    children.flat().forEach(c => {
      if (c == null || c === false) return;
      node.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return node;
  }

  function medName(cat, row) {
    if (row.med === '__other') return row.other.trim();
    const opt = cat.options.find(o => o[0] === row.med);
    return opt ? opt[1] : '';
  }

  function status(msg) {
    const s = $('#status');
    s.textContent = msg;
    clearTimeout(status.timer);
    status.timer = setTimeout(() => { s.textContent = ''; }, 4000);
  }

  // ---------- editor: simple bound fields ----------
  function syncBoundFields() {
    document.querySelectorAll('[data-bind]').forEach(input => {
      const v = getPath(state, input.dataset.bind);
      if (input.type === 'checkbox') input.checked = !!v;
      else input.value = v || '';
    });
    $('#lang-select').value = state.lang;
  }

  document.querySelectorAll('[data-bind]').forEach(input => {
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
      setPath(state, input.dataset.bind, input.type === 'checkbox' ? input.checked : input.value);
      changed();
    });
  });

  const langSelect = $('#lang-select');
  LANGUAGES.forEach(([code, label]) => langSelect.append(el('option', { value: code, text: label })));
  langSelect.addEventListener('change', () => {
    state.lang = langSelect.value;
    renderZoneEditor(); // default items show in the chosen language
    changed();
  });

  // ---------- editor: medications ----------
  function renderMedEditor() {
    const root = $('#med-editor');
    root.replaceChildren();
    let lastGroup = null;
    MED_CATEGORIES.forEach(cat => {
      if (cat.group !== lastGroup) {
        root.append(el('p', { class: 'group-label', text: cat.group === 'daily' ? 'Everyday' : 'Rescue (shown in the Yellow Zone)' }));
        lastGroup = cat.group;
      }
      const block = el('fieldset', { class: 'med-cat' + (cat.group === 'rescue' ? ' rescue' : '') },
        el('legend', { text: TRANSLATIONS.en[cat.labelKey] }));
      state.meds[cat.id].forEach((row, idx) => block.append(medRowEditor(cat, row, idx)));
      block.append(el('button', {
        type: 'button', class: 'link-btn', text: '+ Add another',
        onclick: () => {
          state.meds[cat.id].push({ id: newId(), med: '', other: '', instr: '' });
          renderMedEditor();
          changed();
        },
      }));
      root.append(block);
    });
  }

  function medRowEditor(cat, row, idx) {
    const base = `med-${cat.id}-${idx}`;
    const select = el('select', { id: base + '-name', 'aria-label': TRANSLATIONS.en[cat.labelKey] + ' medication' },
      el('option', { value: '', text: 'None' }),
      cat.options.map(([v, label]) => el('option', { value: v, text: label })),
      el('option', { value: '__other', text: 'Other…' }));
    select.value = row.med;

    const other = el('input', {
      type: 'text', id: base + '-other', class: 'other', placeholder: 'Medication name',
      'aria-label': 'Other medication name', value: row.other,
    });
    other.hidden = row.med !== '__other';

    const instr = el('input', {
      type: 'text', id: base + '-instr', placeholder: cat.placeholder,
      'aria-label': 'How to take it', value: row.instr,
    });

    select.addEventListener('change', () => {
      row.med = select.value;
      other.hidden = row.med !== '__other';
      if (!other.hidden) other.focus();
      changed();
    });
    other.addEventListener('input', () => { row.other = other.value; changed(); });
    instr.addEventListener('input', () => { row.instr = instr.value; changed(); });

    const remove = el('button', {
      type: 'button', class: 'icon-btn', title: 'Remove', 'aria-label': 'Remove this medication', text: '×',
      onclick: () => {
        const rows = state.meds[cat.id];
        if (rows.length > 1) rows.splice(rows.indexOf(row), 1);
        else Object.assign(row, { med: '', other: '', instr: '' });
        renderMedEditor();
        changed();
      },
    });

    return el('div', { class: 'med-row' }, el('div', { class: 'med-name' }, select, other), instr, remove);
  }

  // ---------- editor: zones ----------
  const ZONE_META = {
    green: { label: 'Green zone' },
    yellow: { label: 'Yellow zone' },
    red: { label: 'Red zone' },
  };

  function renderZoneEditor() {
    const root = $('#zone-editor');
    root.replaceChildren();
    Object.keys(state.zones).forEach(z => {
      const block = el('div', { class: `zone-edit ${z}` },
        el('div', { class: 'zone-edit-head' },
          el('strong', { text: ZONE_META[z].label }),
          el('button', {
            type: 'button', class: 'link-btn', text: 'Restore defaults',
            onclick: () => {
              state.zones[z] = {
                symptoms: DEFAULT_ZONES[z].symptoms.map(key => ({ id: newId(), key, on: true })),
                actions: DEFAULT_ZONES[z].actions.map(key => ({ id: newId(), key, on: true })),
              };
              renderZoneEditor();
              changed();
            },
          })));
      [['symptoms', 'Symptoms', '+ Add symptom'], ['actions', 'Actions', '+ Add action']].forEach(([list, title, addLabel]) => {
        block.append(el('p', { class: 'list-label', text: title }));
        const ul = el('ul', { class: 'item-list' });
        state.zones[z][list].forEach(item => ul.append(zoneItemEditor(z, list, item)));
        block.append(ul);
        block.append(el('button', {
          type: 'button', class: 'link-btn', text: addLabel,
          onclick: () => {
            const item = { id: newId(), text: '', on: true };
            state.zones[z][list].push(item);
            renderZoneEditor();
            const input = document.getElementById('zi-' + item.id);
            if (input) input.focus();
            changed();
          },
        }));
      });
      root.append(block);
    });
  }

  function zoneItemEditor(z, list, item) {
    const check = el('input', { type: 'checkbox', id: 'zc-' + item.id, 'aria-label': 'Include on plan' });
    check.checked = item.on;
    check.addEventListener('change', () => { item.on = check.checked; li.classList.toggle('off', !item.on); changed(); });

    const input = el('input', { type: 'text', id: 'zi-' + item.id, value: itemText(item), 'aria-label': 'Item wording' });
    input.addEventListener('input', () => {
      delete item.key; // edited wording becomes custom text
      item.text = input.value;
      changed();
    });

    const remove = el('button', {
      type: 'button', class: 'icon-btn', title: 'Delete', 'aria-label': 'Delete item', text: '×',
      onclick: () => {
        const arr = state.zones[z][list];
        arr.splice(arr.indexOf(item), 1);
        li.remove();
        changed();
      },
    });

    const li = el('li', { class: item.on ? '' : 'off' }, check, input, remove);
    return li;
  }

  // ---------- sheet ----------
  const FACES = { green: '😊', yellow: '😐', red: '😞' };

  function renderSheet() {
    const sheet = $('#sheet');
    const lang = state.lang;
    sheet.lang = lang === 'yue' ? 'zh-Hant' : lang === 'zh' ? 'zh-Hans' : lang;
    sheet.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
    sheet.classList.toggle('large', state.opts.largePrint);
    sheet.classList.toggle('no-checks', !state.opts.checkboxes);

    const clinicName = state.clinic.name.trim() || t('clinicName');
    const fmtDate = state.patient.date ? formatDate(state.patient.date, lang) : '';

    const header = el('header', { class: 's-header' },
      el('div', { class: 's-title' },
        el('h2', { text: t('title') }),
        el('p', { class: 's-clinic', text: clinicName })),
      el('dl', { class: 's-info' },
        infoPair(t('nameLabel'), state.patient.name.trim()),
        infoPair(t('dateLabel'), fmtDate),
        state.clinic.provider.trim() && infoPair(t('providerLabel'), state.clinic.provider.trim()),
        state.clinic.phone.trim() && infoPair(t('phoneLabel'), state.clinic.phone.trim())));

    // Everyday medications table
    const dailyRows = [];
    MED_CATEGORIES.filter(c => c.group === 'daily').forEach(cat => {
      const rows = state.meds[cat.id].filter(r => medName(cat, r) || r.instr.trim());
      if (rows.length) rows.forEach((r, i) => dailyRows.push(medTableRow(cat, r, i === 0)));
      else if (state.opts.blankLines) dailyRows.push(medTableRow(cat, null, true));
    });
    const medsSection = dailyRows.length
      ? el('section', { class: 's-meds' },
          el('h3', { text: t('myMedsTitle') }),
          el('table', null, el('tbody', null, dailyRows)))
      : null;

    // Rescue medications (go in the yellow zone)
    const rescueItems = [];
    MED_CATEGORIES.filter(c => c.group === 'rescue').forEach(cat => {
      const rows = state.meds[cat.id].filter(r => medName(cat, r) || r.instr.trim());
      if (rows.length) {
        rows.forEach(r => rescueItems.push(el('li', null,
          el('span', { class: 'r-cat', text: t(cat.labelKey) }),
          el('span', { class: 'r-name', dir: 'auto', text: medName(cat, r) || ' ' }),
          r.instr.trim() && el('span', { class: 'r-instr', dir: 'auto', text: r.instr.trim() }))));
      } else if (state.opts.blankLines) {
        rescueItems.push(el('li', { class: 'blank' },
          el('span', { class: 'r-cat', text: t(cat.labelKey) }),
          el('span', { class: 'write-line' })));
      }
    });
    const rescueBox = rescueItems.length
      ? el('div', { class: 's-rescue' }, el('h4', { text: t('rescueMedsTitle') }), el('ul', null, rescueItems))
      : null;

    const zones = Object.keys(state.zones).map(z => zoneBlock(z, z === 'yellow' ? rescueBox : null));

    const notes = state.notes.trim()
      ? el('section', { class: 's-notes' }, el('h3', { text: t('notesLabel') }), el('p', { dir: 'auto', text: state.notes.trim() }))
      : null;

    sheet.replaceChildren(...[header, medsSection, ...zones, notes].filter(Boolean));
  }

  function infoPair(label, value) {
    return el('div', { class: 'pair' },
      el('dt', { text: label }),
      el('dd', { class: value ? '' : 'write-line', dir: 'auto', text: value || '' }));
  }

  function medTableRow(cat, row, showCat) {
    const name = row ? medName(cat, row) : '';
    const img = row && state.opts.images && MED_IMAGES[row.med];
    return el('tr', { class: showCat ? 'cat-start' : '' },
      el('th', { scope: 'row', text: showCat ? t(cat.labelKey) : '' }),
      el('td', { class: 'm-img' }, img ? el('img', { src: img, alt: name }) : null),
      el('td', { class: 'm-name', dir: 'auto' }, name ? name : el('span', { class: 'write-line' })),
      el('td', { class: 'm-instr', dir: 'auto' }, row && row.instr.trim() ? row.instr.trim() : (row ? '' : el('span', { class: 'write-line' }))));
  }

  function zoneBlock(z, extra) {
    const zone = state.zones[z];
    const list = items => el('ul', null, items.filter(i => i.on && itemText(i).trim())
      .map(i => el('li', null, el('span', { class: 'box', 'aria-hidden': 'true' }), el('span', { dir: i.key ? null : 'auto', text: itemText(i) }))));
    return el('section', { class: `s-zone ${z}` },
      el('div', { class: 'z-band' },
        el('h3', null, el('span', { class: 'z-name', text: t(z + 'Title') }), el('span', { class: 'z-sub', text: t(z + 'Subtitle') })),
        state.opts.faces && el('span', { class: 'z-face', 'aria-hidden': 'true', text: FACES[z] })),
      el('div', { class: 'z-body' },
        el('div', { class: 'z-col' }, el('h4', { text: t('symptomsLabel') }), list(zone.symptoms)),
        el('div', { class: 'z-col' }, el('h4', { text: t('actionsLabel') }), list(zone.actions), extra)));
  }

  function formatDate(iso, lang) {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    const locale = { yue: 'zh-HK', zh: 'zh-CN', en: 'en-CA' }[lang] || lang;
    try {
      return new Date(y, m - 1, d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  // ---------- actions ----------
  function changed() {
    renderSheet();
    save();
  }

  $('#print-btn').addEventListener('click', () => window.print());

  $('#clear-patient-btn').addEventListener('click', () => {
    state.patient = { name: '', date: todayISO() };
    syncBoundFields();
    changed();
    status('Patient details cleared.');
  });

  $('#reset-btn').addEventListener('click', () => {
    if (!window.confirm('Reset clinic details, medications, zone wording and layout to the defaults?')) return;
    state = defaultState();
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    renderAll();
    status('Everything reset to defaults.');
  });

  $('#export-btn').addEventListener('click', () => {
    const data = { app: 'copd-action-plan', version: 1, ...templateOf(state) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'copd-action-plan-template.json' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    status('Template saved (patient details are not included).');
  });

  $('#import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const patient = state.patient;
        state = hydrate(JSON.parse(reader.result));
        state.patient = patient;
        renderAll();
        save();
        status(`Loaded "${file.name}".`);
      } catch (err) {
        status('That file is not a valid action plan template.');
      }
    };
    reader.readAsText(file);
  });

  function renderAll() {
    syncBoundFields();
    renderMedEditor();
    renderZoneEditor();
    renderSheet();
  }

  renderAll();
})();
