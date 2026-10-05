'use strict';

/*
 * dashboard/public/app.js — Bryn's dashboard page. Plain browser JavaScript, no framework, no build step.
 *
 * What it does:
 *   - Reads every line from /brand/copy.json (the copy head's file) and fills [data-copy] elements.
 *   - Polls /api/stage every 2 seconds (not while the tab is hidden) and shows the matching scene from
 *     /art/<stage>.svg, crossfading. The scenes are plain SVG with no styles or scripts of their own; their
 *     motion lives in app.css by class name, and stops for people who ask for reduced motion.
 *   - The cairn (/api/decisions), the trail markers (/api/policies), "Ask Bryn to check" (/api/consult),
 *     and "Bring Bryn a question" (/api/ask).
 *   - The trail journal: one decision's pages, rendered from markdown SAFELY: every character is escaped
 *     first, then a small set of formatting is added back; links only to http(s), opening in a new tab.
 * Nothing here writes anywhere but through the server's two POST routes.
 */

(function () {
  const $ = (id) => document.getElementById(id);
  const STAGE_ORDER = ['framing', 'brainstorm', 'council', 'review', 'verdict', 'waiting', 'premortem', 'filing'];
  const DEFAULT_TRAIL = ['framing', 'brainstorm', 'council', 'review', 'verdict', 'premortem', 'filing'];
  const STATUS_ORDER = ['in-progress', 'waiting', 'decided', 'parked', 'abandoned'];
  const SEAT_ORDER = ['contrarian', 'first-principles', 'expansionist', 'outsider', 'executor'];

  let COPY = {};
  const state = {
    stage: null, stageKey: '', examples: false, where: '', decisions: [], counts: {}, total: 0,
    filter: '', query: '', trailFor: null, trail: DEFAULT_TRAIL, journal: null, page: 1, svgCache: new Map(),
  };

  /* ------------------------------------------------------------------ copy */

  function pick(path) {
    return String(path).split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), COPY);
  }
  /** A line from copy.json with {tokens} filled, else the fallback. */
  function t(path, fallback, vars) {
    const v = pick(path);
    let s = typeof v === 'string' && v ? v : (fallback || '');
    if (vars) s = s.replace(/\{(\w+)\}/g, (all, k) => (vars[k] != null ? String(vars[k]) : all));
    return s;
  }
  function fillCopy() {
    document.querySelectorAll('[data-copy]').forEach((el) => {
      const v = pick(el.getAttribute('data-copy'));
      if (typeof v === 'string' && v) el.textContent = v;
    });
    const q = $('ask-q');
    const c = $('ask-c');
    const s = $('search-q');
    if (q) q.placeholder = t('ui.ask_question_placeholder', '');
    if (c) c.placeholder = t('ui.ask_context_placeholder', '');
    if (s) s.placeholder = t('ui.search_placeholder', '');
    document.title = `${t('name', 'Bryn')}, ${t('title', 'the Trail Guide')}`;
  }

  /* ------------------------------------------------------------------ helpers */

  async function getJSON(url, opts) {
    const r = await fetch(url, Object.assign({ cache: 'no-store', headers: { Accept: 'application/json' } }, opts || {}));
    let body = null;
    try { body = await r.json(); } catch (_) { body = null; }
    if (!r.ok) throw Object.assign(new Error((body && body.error) || `HTTP ${r.status}`), { status: r.status });
    return body;
  }
  const postJSON = (url, data) => getJSON(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function clock(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const sameDay = d.toDateString() === new Date().toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return sameDay ? time : `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${time}`;
  }
  function day(s) {
    const d = new Date(String(s).length === 10 ? `${s}T12:00:00` : s);
    return Number.isNaN(d.getTime()) ? String(s || '') : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // The caption is a live region: write it only when the words change, so nothing is announced twice.
  function setCaption(text) {
    const c = $('caption');
    if (c.textContent !== text) c.textContent = text;
  }

  function showError(on) {
    const c = $('caption');
    if (on) {
      setCaption(t('ui.error_load', "Can't reach Bryn's server."));
      c.classList.add('is-error');
      state.stageKey = ''; // so the stage is drawn again once the server answers
    } else c.classList.remove('is-error');
  }

  /* ------------------------------------------------------------------ the scene */

  // The scenes are this server's own files. Defence in depth all the same: drop anything scriptable.
  function cleanSvg(text) {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
    svg.querySelectorAll('script, foreignObject, style, image, use').forEach((n) => n.remove());
    const walk = (n) => {
      for (const a of Array.from(n.attributes || [])) {
        if (/^on/i.test(a.name) || a.name === 'style' || /href$/i.test(a.name)) n.removeAttribute(a.name);
      }
      for (const c of Array.from(n.children || [])) walk(c);
    };
    walk(svg);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    return document.importNode(svg, true);
  }

  async function sceneFor(stage) {
    if (state.svgCache.has(stage)) return state.svgCache.get(stage).cloneNode(true);
    const r = await fetch(`/art/${encodeURIComponent(stage)}.svg`, { cache: 'force-cache' });
    if (!r.ok) throw new Error('no scene');
    const svg = cleanSvg(await r.text());
    if (!svg) throw new Error('bad scene');
    state.svgCache.set(stage, svg);
    return svg.cloneNode(true);
  }

  async function showScene(stage) {
    const box = $('scene');
    let svg;
    try { svg = await sceneFor(stage); } catch (_) {
      try { svg = await sceneFor('idle'); } catch (__) { return; }
    }
    const layer = el('div', 'scene-layer');
    layer.setAttribute('data-stage', stage);
    layer.appendChild(svg);
    box.appendChild(layer);
    // Two frames so the browser paints the new layer at opacity 0 before it fades in.
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('is-in')));
    const old = Array.from(box.children).filter((c) => c !== layer);
    setTimeout(() => old.forEach((c) => c.remove()), 700);
    box.setAttribute('data-stage', stage);
  }

  /* ------------------------------------------------------------------ the trailhead */

  function stageLabel(stage) { return t(`stages.${stage}.label`, stage); }

  async function trailFor(decisionId) {
    if (!decisionId) return DEFAULT_TRAIL;
    if (state.trailFor === decisionId) return state.trail;
    try {
      const d = await getJSON(`/api/decision/${encodeURIComponent(decisionId)}`);
      const planned = (d.planned || []).filter((s) => STAGE_ORDER.includes(s));
      state.trailFor = decisionId;
      state.trail = planned.length ? planned : DEFAULT_TRAIL;
    } catch (_) { state.trailFor = decisionId; state.trail = DEFAULT_TRAIL; }
    return state.trail;
  }

  function drawTrail(planned, current) {
    const ol = $('trail');
    ol.textContent = '';
    // A stage the plan did not list (waiting, say) still gets its stop, in its place on the trail.
    const trail = current && !planned.includes(current) && STAGE_ORDER.includes(current)
      ? STAGE_ORDER.filter((s) => planned.includes(s) || s === current) : planned;
    const at = trail.indexOf(current);
    trail.forEach((s, i) => {
      const li = el('li', 'stop');
      li.appendChild(el('span', 'stop-dot'));
      li.appendChild(el('span', 'stop-name', stageLabel(s)));
      if (at >= 0 && i < at) {
        li.classList.add('is-done');
        li.appendChild(el('span', 'sr-only', ` (${t('ui.stop_done', 'done')})`));
      }
      if (i === at) {
        li.classList.add('is-here');
        li.setAttribute('aria-current', 'step');
        li.appendChild(el('span', 'sr-only', ` (${t('ui.stop_here', 'we are here')})`));
      }
      ol.appendChild(li);
    });
    $('trail').closest('.trail-wrap').classList.toggle('is-resting', at < 0);
  }

  async function renderStage(st) {
    const key = JSON.stringify(st) + (state.examples ? 'x' : '');
    if (key === state.stageKey) return;
    const sceneChanged = !state.stage || state.stage.stage !== st.stage;
    state.stageKey = key;
    state.stage = st;
    if (sceneChanged) showScene(st.stage);

    $('stage-label').textContent = stageLabel(st.stage);
    $('scene-title').textContent = stageLabel(st.stage);
    let caption = t(`stages.${st.stage}.caption`, '');
    if (st.stalled) caption = t('stalled', caption, { stage: stageLabel(st.stalled.stage), time: clock(st.stalled.since) });
    else if (st.parked) caption = t('parked', caption, { time: clock(st.parked.since) });
    else if (st.stage === 'idle' && state.examples) caption = t('examples_idle', caption);
    showError(false);
    setCaption(caption);

    const q = $('table-q');
    const meta = $('table-meta');
    meta.textContent = '';
    if (st.question) {
      q.textContent = st.question;
      q.classList.remove('is-empty');
      if (st.step) meta.appendChild(el('span', 'meta-step', t('ui.step', 'Stop {n} of {of}', st.step)));
      if (st.since && st.stage !== 'idle') meta.appendChild(el('span', 'meta-since', t('ui.since', 'Since {time}', { time: clock(st.since) })));
      if (st.decision) {
        const b = el('button', 'link-btn', t('ui.open_decision', 'Open it'));
        b.type = 'button';
        b.addEventListener('click', () => openJournal(st.decision));
        meta.appendChild(b);
      }
    } else {
      q.textContent = t('ui.table_empty', 'Nothing on the table.');
      q.classList.add('is-empty');
    }
    const shown = st.stage === 'consulting' || st.stage === 'idle' ? null : st.stage;
    drawTrail(await trailFor(st.decision), shown || (st.stalled ? st.stalled.stage : null));
  }

  async function pollStage() {
    if (document.hidden) return;
    try { await renderStage(await getJSON('/api/stage')); } catch (_) { showError(true); }
  }

  /* ------------------------------------------------------------------ the cairn */

  function chip(status, label, count) {
    const b = el('button', 'chip');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(state.filter === status));
    b.setAttribute('data-status', status || 'all');
    b.appendChild(el('span', 'chip-dot'));
    b.appendChild(el('span', 'chip-label', label));
    b.appendChild(el('span', 'chip-count', String(count)));
    b.addEventListener('click', () => { state.filter = status; loadCairn(); });
    return b;
  }

  function drawChips() {
    const row = $('chips');
    row.textContent = '';
    row.appendChild(chip('', t('ui.filter_all', 'All'), state.total));
    for (const s of STATUS_ORDER) row.appendChild(chip(s, t(`status.${s}`, s), state.counts[s] || 0));
  }

  function tag(cls, text) { return el('span', `tag ${cls}`, text); }

  function stone(d, i) {
    const li = el('li', `stone stone-${(i % 6) + 1}`);
    li.setAttribute('data-status', d.status);
    li.id = `stone-${d.id}`;
    const b = el('button', 'stone-btn');
    b.type = 'button';
    b.addEventListener('click', () => openJournal(d.id));
    // The button is named by its question alone; the status, date and tags describe it.
    const top = el('span', 'stone-top');
    top.id = `sq-top-${d.id}`;
    top.appendChild(el('span', 'status-pill', t(`status.${d.status}`, d.status)));
    top.appendChild(el('span', 'stone-date', day(d.created)));
    b.appendChild(top);
    const q = el('span', 'stone-q', d.question);
    q.id = `sq-${d.id}`;
    b.appendChild(q);
    b.setAttribute('aria-labelledby', q.id);
    if (d.verdict && d.status !== 'in-progress') b.appendChild(el('span', 'stone-v', d.outcome || d.verdict));
    const tags = el('span', 'stone-tags');
    tags.id = `sq-tags-${d.id}`;
    b.setAttribute('aria-describedby', `${top.id} ${tags.id}`);
    if (d.door) tags.appendChild(tag(`door-${d.door}`, d.door === 'one-way' ? t('ui.door_one_way', "Can't be undone") : t('ui.door_two_way', 'Can be undone')));
    if (d.stakes) tags.appendChild(tag(`stakes-${d.stakes}`, d.stakes === 'high' ? t('ui.stakes_high', 'High stakes') : t('ui.stakes_low', 'Low stakes')));
    if (d.filed_as) tags.appendChild(tag('tag-marker', d.filed_as));
    b.appendChild(tags);
    li.appendChild(b);
    return li;
  }

  async function loadCairn() {
    const qs = new URLSearchParams();
    if (state.filter) qs.set('status', state.filter);
    if (state.query) qs.set('q', state.query);
    let r;
    try { r = await getJSON(`/api/decisions?${qs}`); } catch (_) { showError(true); return; }
    // Redraw only when something changed, so a keyboard user's place is never thrown away by the 20 s refresh.
    const sig = JSON.stringify([r, state.filter]);
    if (sig === state.cairnSig) return;
    state.cairnSig = sig;
    const active = document.activeElement;
    const keep = active && active.closest
      ? (active.closest('.chip') ? `chip:${active.getAttribute('data-status')}` : (active.closest('.stone') ? `stone:${active.closest('.stone').id}` : null))
      : null;
    const wasExamples = state.examples;
    state.examples = !!r.examples;
    state.counts = r.counts || {};
    state.total = r.total || 0;
    state.where = r.where || '';
    state.decisions = r.decisions || [];
    $('examples-banner').hidden = !state.examples;
    $('examples-badge').hidden = !state.examples;
    drawChips();
    const ul = $('stones');
    ul.textContent = '';
    state.decisions.forEach((d, i) => ul.appendChild(stone(d, i)));
    $('cairn-empty').hidden = state.decisions.length > 0;
    $('cairn-count').textContent = t('ui.cairn_count', '{n} stones shown', { n: state.decisions.length });
    if (keep && keep.startsWith('chip:')) { const c = $('chips').querySelector(`[data-status="${keep.slice(5)}"]`); if (c) c.focus(); }
    if (keep && keep.startsWith('stone:')) { const s = document.getElementById(keep.slice(6)); if (s) s.querySelector('button').focus(); }
    $('footer').textContent = t('ui.footer', 'Bryn runs on this computer only. What you tell her stays in {where}.', { where: state.where || 'her data folder' });
    if (wasExamples !== state.examples && state.stage) { state.stageKey = ''; renderStage(state.stage); }
  }

  async function consult(q) {
    const out = $('consult-result');
    out.textContent = '';
    out.className = 'consult-result';
    let r;
    try { r = await postJSON('/api/consult', { q }); } catch (e) { out.textContent = e.message; out.classList.add('is-error'); return; }
    pollStage();
    if (r.policy) {
      out.textContent = t('ui.consult_policy', 'A trail marker covers this: {title} ({id}).', { id: r.policy.id, title: r.policy.title });
      out.classList.add('is-policy');
      const m = document.getElementById(`marker-${r.policy.id}`);
      if (m) { m.classList.add('is-lit'); setTimeout(() => m.classList.remove('is-lit'), 4000); }
    } else if (r.decision) {
      const d = state.decisions.find((x) => x.id === r.decision);
      out.textContent = t('ui.consult_decision', "You've decided something like this before: {question}", { question: d ? d.question : r.decision });
      out.classList.add('is-decision');
    } else out.textContent = t('ui.consult_nothing', 'Nothing on the cairn matches. This is new ground.');
    if (r.decision) {
      const b = el('button', 'link-btn', t('ui.open_decision', 'Open it'));
      b.type = 'button';
      b.addEventListener('click', () => openJournal(r.decision));
      out.appendChild(document.createTextNode(' '));
      out.appendChild(b);
    }
  }

  /* ------------------------------------------------------------------ trail markers */

  async function loadMarkers() {
    let r;
    try { r = await getJSON('/api/policies'); } catch (_) { return; }
    const ul = $('marker-list');
    ul.textContent = '';
    const active = (r.policies || []).filter((p) => p.status === 'active');
    for (const p of active) {
      const li = el('li', 'marker');
      li.id = `marker-${p.id}`;
      const head = el('div', 'marker-head');
      head.appendChild(el('span', 'blaze'));
      head.appendChild(el('span', 'marker-id', p.id));
      li.appendChild(head);
      li.appendChild(el('h3', 'marker-title', p.title));
      const dl = el('dl', 'marker-rules');
      const row = (k, v) => { if (!v) return; dl.appendChild(el('dt', null, k)); dl.appendChild(el('dd', null, v)); };
      row(t('ui.marker_when', 'When it applies'), p.trigger);
      row(t('ui.marker_do', 'What to do'), p.rule);
      row(t('ui.marker_escalate', 'When to stop and think again'), p.escalate_if);
      li.appendChild(dl);
      ul.appendChild(li);
    }
    $('markers-empty').hidden = active.length > 0;
    const recs = r.records || [];
    $('records-wrap').hidden = recs.length === 0;
    const rl = $('record-list');
    rl.textContent = '';
    for (const x of recs) {
      const li = el('li', 'record');
      li.appendChild(el('span', 'record-title', x.title));
      if (x.status) li.appendChild(el('span', 'tag', x.status));
      rl.appendChild(li);
    }
  }

  /* ------------------------------------------------------------------ safe markdown */

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Inline formatting on text that is ALREADY escaped. */
  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)&]+(?:&amp;[^\s)&]+)*)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function markdown(src) {
    const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let para = [];
    let list = null;
    let table = null;
    const flushPara = () => { if (para.length) { out.push(`<p>${inline(esc(para.join(' ')))}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(esc(i))}</li>`).join('')}</${list.tag}>`); list = null; } };
    const flushTable = () => {
      if (!table) return;
      const rows = table.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r));
      const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => inline(esc(c.trim())));
      const [head, ...body] = rows;
      if (head) {
        out.push(`<div class="md-table" tabindex="0" role="region" aria-label="Table"><table><thead><tr>${cells(head).map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${
          body.map((r) => `<tr>${cells(r).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      }
      table = null;
    };
    const flushAll = () => { flushPara(); flushList(); flushTable(); };
    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      let m;
      if (!line.trim()) { flushAll(); continue; }
      if (/^\s*\|.*\|\s*$/.test(line)) { flushPara(); flushList(); (table = table || []).push(line); continue; }
      flushTable();
      if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) { flushAll(); const n = Math.min(6, m[1].length + 2); out.push(`<h${n}>${inline(esc(m[2]))}</h${n}>`); continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flushAll(); out.push('<hr>'); continue; }
      if ((m = /^>\s?(.*)$/.exec(line))) { flushAll(); out.push(`<blockquote><p>${inline(esc(m[1]))}</p></blockquote>`); continue; }
      if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) { flushPara(); if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; } list.items.push(m[1]); continue; }
      if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) { flushPara(); if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; } list.items.push(m[1]); continue; }
      if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += ` ${line.trim()}`; continue; }
      flushList();
      para.push(line.trim());
    }
    flushAll();
    return out.join('\n');
  }

  /* ------------------------------------------------------------------ the trail journal */

  function glance(d) {
    const box = $('j-glance');
    box.textContent = '';
    const block = (label, text, cls) => {
      if (!text) return;
      const s = el('section', `glance-block ${cls || ''}`);
      s.appendChild(el('h3', null, label));
      s.appendChild(el('p', null, text));
      box.appendChild(s);
    };
    block(t('ui.verdict_label', "Bryn's advice"), d.verdict, 'is-call');
    block(t('ui.first_step_label', 'First step'), d.first_step);
    block(t('ui.outcome_label', 'What you decided'), d.outcome || t('ui.outcome_none', 'Not decided yet.'), d.outcome ? 'is-outcome' : 'is-open');
    if (d.revisit) block(t('ui.revisit_label', 'Look again'), day(d.revisit));

    if (d.seats && d.seats.length) {
      const s = el('section', 'glance-block seats');
      s.appendChild(el('h3', null, t('ui.seats_heading', 'Where the five scouts stood')));
      const ul = el('ul', 'seat-list');
      const bySeat = new Map(d.seats.map((x) => [x.seat, x]));
      for (const k of SEAT_ORDER) {
        const x = bySeat.get(k);
        if (!x) continue;
        const li = el('li', `seat seat-${k}`);
        li.setAttribute('data-lean', x.lean);
        const top = el('span', 'seat-top');
        top.appendChild(el('span', 'seat-swatch'));
        top.appendChild(el('span', 'seat-name', t(`seats.${k}.name`, k)));
        top.appendChild(el('span', `lean lean-${x.lean}`, t(`leans.${x.lean}`, x.lean)));
        li.appendChild(top);
        if (x.line) li.appendChild(el('span', 'seat-line', x.line));
        ul.appendChild(li);
      }
      s.appendChild(ul);
      box.appendChild(s);
    }
    if (d.premortem) {
      block(t('ui.premortem_likely', 'Most likely way it fails'), d.premortem.likely, 'is-pm');
      block(t('ui.premortem_dangerous', 'Most damaging way it fails'), d.premortem.dangerous, 'is-pm');
      block(t('ui.premortem_assumption', 'The assumption to check'), d.premortem.assumption, 'is-pm');
    }
    if (d.seats && d.seats.length || d.premortem) box.appendChild(el('p', 'advice-note', t('ui.advice_note', 'Advice from five viewpoints of one AI model. The decision is yours.')));
  }

  async function showPage(n) {
    const d = state.journal;
    if (!d || !d.pages.length) {
      $('j-page').textContent = '';
      $('j-of').textContent = '';
      $('j-prev').setAttribute('aria-disabled', 'true');
      $('j-next').setAttribute('aria-disabled', 'true');
      return;
    }
    state.page = Math.max(1, Math.min(n, d.pages.length));
    $('j-pages').querySelectorAll('button').forEach((b) => {
      const on = Number(b.getAttribute('data-n')) === state.page;
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('j-of').textContent = t('ui.page_of', 'Page {n} of {of}', { n: state.page, of: d.pages.length });
    $('j-prev').setAttribute('aria-disabled', String(state.page <= 1));
    $('j-next').setAttribute('aria-disabled', String(state.page >= d.pages.length));
    const box = $('j-page');
    box.textContent = t('ui.loading', 'Loading');
    try {
      const p = await getJSON(`/api/decision/${encodeURIComponent(d.id)}/page/${state.page}`);
      if (state.journal !== d) return;
      box.innerHTML = markdown(p.markdown);
      box.scrollTop = 0;
    } catch (e) { box.textContent = e.message; }
  }

  async function openJournal(id) {
    let d;
    try { d = await getJSON(`/api/decision/${encodeURIComponent(id)}`); } catch (e) { $('consult-result').textContent = e.message; return; }
    if (!$('journal').open) state.opener = document.activeElement;
    state.journal = d;
    $('j-question').textContent = d.question;
    const tags = $('j-tags');
    tags.textContent = '';
    const pill = el('span', 'status-pill', t(`status.${d.status}`, d.status));
    pill.setAttribute('data-status', d.status);
    tags.appendChild(pill);
    if (d.door) tags.appendChild(tag(`door-${d.door}`, d.door === 'one-way' ? t('ui.door_one_way', "Can't be undone") : t('ui.door_two_way', 'Can be undone')));
    if (d.stakes) tags.appendChild(tag(`stakes-${d.stakes}`, d.stakes === 'high' ? t('ui.stakes_high', 'High stakes') : t('ui.stakes_low', 'Low stakes')));
    tags.appendChild(el('span', 'stone-date', day(d.created)));
    glance(d);
    const nav = $('j-pages');
    nav.textContent = '';
    for (const p of d.pages) {
      const b = el('button', 'page-tab', p.name);
      b.type = 'button';
      b.setAttribute('data-n', String(p.n));
      b.addEventListener('click', () => showPage(p.n));
      nav.appendChild(b);
    }
    const rep = $('j-reports');
    rep.textContent = '';
    for (const r of d.reports || []) {
      const a = el('a', 'report-link', r.kind === 'council'
        ? t('ui.report_council', "Open the council's full report (new tab)")
        : t('ui.report_premortem', "Open the premortem's full report (new tab)"));
      a.href = `/api/decision/${encodeURIComponent(d.id)}/report/${encodeURIComponent(r.file)}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      rep.appendChild(a);
    }
    const dlg = $('journal');
    if (!dlg.open) { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
    showPage(1);
    $('j-close').focus();
  }

  function closeJournal() {
    const dlg = $('journal');
    if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
  }

  /* ------------------------------------------------------------------ forms and wiring */

  function wire() {
    $('ask-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = $('ask-status');
      const q = $('ask-q').value.trim();
      status.className = 'ask-status';
      if (q.length < 3) {
        status.textContent = t('ui.ask_too_short', 'Write your question in a few words first.');
        status.classList.add('is-error');
        $('ask-q').setAttribute('aria-invalid', 'true');
        $('ask-q').focus();
        return;
      }
      try {
        const r = await postJSON('/api/ask', { question: q, context: $('ask-c').value.trim() });
        status.textContent = `${t('ui.ask_done', 'Left at the trailhead.')} ${t('ui.ask_waiting', 'Questions waiting: {n}', { n: r.queued })}`;
        status.classList.add('is-ok');
        $('ask-form').reset();
      } catch (err) { status.textContent = err.message; status.classList.add('is-error'); }
    });

    let timer = null;
    $('search-q').addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.query = $('search-q').value.trim(); loadCairn(); }, 250);
    });
    $('search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('search-q').value.trim();
      if (q.length < 3) { $('consult-result').textContent = t('ui.ask_too_short', 'Write your question in a few words first.'); return; }
      consult(q);
    });

    $('scene-pause').addEventListener('click', () => {
      // A plain action button whose label says what it will do next (no aria-pressed, which would say it twice).
      const b = $('scene-pause');
      const card = b.closest('.scene-card');
      const paused = !card.classList.contains('is-paused');
      card.classList.toggle('is-paused', paused);
      b.textContent = paused ? t('ui.play_motion', 'Play the scene') : t('ui.pause_motion', 'Pause the scene');
    });

    $('j-close').addEventListener('click', closeJournal);
    const flip = (by) => {
      const d = state.journal;
      const to = state.page + by;
      if (d && to >= 1 && to <= d.pages.length) showPage(to);
    };
    $('j-prev').addEventListener('click', () => flip(-1));
    $('j-next').addEventListener('click', () => flip(1));
    $('journal').addEventListener('click', (e) => { if (e.target === $('journal')) closeJournal(); });
    $('journal').addEventListener('keydown', (e) => {
      // Arrows flip pages, except with a modifier (Alt+Left is the browser's Back) or inside the page itself,
      // where they scroll a wide table.
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target && (/^(INPUT|TEXTAREA)$/.test(e.target.tagName) || (e.target.closest && e.target.closest('#j-page')))) return;
      if (e.key === 'ArrowRight') flip(1);
      if (e.key === 'ArrowLeft') flip(-1);
    });
    // When the journal closes, focus goes back to whatever opened it (or its stone, or the cairn).
    $('journal').addEventListener('close', () => {
      const back = state.opener && state.opener.isConnected ? state.opener
        : (state.journal && document.getElementById(`stone-${state.journal.id}`) && document.getElementById(`stone-${state.journal.id}`).querySelector('button')) || $('cairn');
      if (back && back.focus) back.focus();
    });
    $('ask-q').addEventListener('input', () => $('ask-q').removeAttribute('aria-invalid'));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pollStage(); });
  }

  async function boot() {
    try { COPY = await getJSON('/brand/copy.json'); } catch (_) { COPY = {}; }
    fillCopy();
    wire();
    await loadCairn();
    await pollStage();
    loadMarkers();
    setInterval(pollStage, 2000);
    setInterval(() => { if (!document.hidden) loadCairn(); }, 20000);
    // The examples: ?open=<id> opens a stone on load (used for screenshots and links from a session).
    const open = new URLSearchParams(location.search).get('open');
    if (open && /^[a-z0-9-]{12,82}$/.test(open)) openJournal(open);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}());
