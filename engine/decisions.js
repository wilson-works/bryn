'use strict';

/**
 * engine/decisions.js — reads what Bryn's table has produced, for the dashboard and the runbook. It only
 * reads; the skills and the runbook write. Node built-ins only.
 *
 *   list(cfg, { status, q })        { examples, decisions: [...], counts }
 *   get(cfg, id)                    one decision with its pages and reports, or null
 *   page(cfg, id, n)                { n, name, file, markdown } (at most 512 KB), or null
 *   report(cfg, id, file)           { file, html } for a skill's HTML report (served sandboxed), or null
 *   policies(cfg)                   { examples, policies: [...], records: [...] } from the decision log
 *   consult(cfg, q)                 { policy, decision, matches }: the best match in the log for a question
 *   node engine/decisions.js list | find "<words>" | policies
 *
 * Where it reads (engine/config.js): <data>/decisions/<YYYY-MM-DD>-<slug>/ and <data>/log/. While the data
 * folder holds no decision yet it reads examples/ instead and says so ("examples": true).
 *
 * One decision folder (DESIGN.md, "Where things land"):
 *   meta.json                     written by the runbook: the question, the door, the stakes, the status, the
 *                                 one-line verdict, the seats, the person's own outcome
 *   brief.md                      the question as framed
 *   brainstorm-pile.md            the options (brainstorm)
 *   council-transcript-<ts>.md    council-report-<ts>.html    (llm-council)
 *   premortem-transcript-<ts>.md  premortem-report-<ts>.html  (premortem)
 *   decision.md                   the decision in the person's own words, once they make it
 *
 * Containment: a decision id is a folder name of the form above; a page is one of the names above, found
 * by listing the folder (never by a path from a request); symbolic links are never followed; nothing
 * deeper than one folder is read. A meta.json over 64 KB or a page over 512 KB is refused with a reason.
 */

const fs = require('fs');
const path = require('path');

const ID_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{0,70}$/;
const STATUSES = ['in-progress', 'waiting', 'decided', 'parked', 'abandoned'];
const SEATS = ['contrarian', 'first-principles', 'expansionist', 'outsider', 'executor'];
const LEANS = ['for', 'against', 'split'];
const MAX_META = 64 * 1024;
const MAX_PAGE = 512 * 1024;
const TTL_MS = 3000;

// The pages of a decision, in reading order: the file pattern, its name on the page, the stage it comes from.
const PAGES = [
  { re: /^brief\.md$/, name: 'The question', stage: 'framing' },
  { re: /^brainstorm-pile\.md$/, name: 'The options', stage: 'brainstorm' },
  { re: /^council-transcript-[0-9A-Za-z_-]+\.md$/, name: 'The council', stage: 'council' },
  { re: /^premortem-transcript-[0-9A-Za-z_-]+\.md$/, name: 'The premortem', stage: 'premortem' },
  { re: /^decision\.md$/, name: 'Your decision', stage: 'filing' },
];
const REPORT_RE = /^(council|premortem)-report-[0-9A-Za-z_-]+\.html$/;

const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max || 300) : null);

function isDir(p) { try { return fs.lstatSync(p).isDirectory(); } catch (_) { return false; } }
function fileSize(p) { try { const s = fs.lstatSync(p); return s.isFile() ? s.size : -1; } catch (_) { return -1; } }

function hasDecisions(dir) {
  try { return fs.readdirSync(dir).some((n) => ID_RE.test(n) && isDir(path.join(dir, n)) && fileSize(path.join(dir, n, 'meta.json')) >= 0); } catch (_) { return false; }
}

/** Where to read: the data folder, or the examples while the data folder is empty. */
function source(cfg) {
  if (hasDecisions(cfg.decisions)) return { examples: false, decisions: cfg.decisions, log: cfg.log };
  return { examples: true, decisions: cfg.examples.decisions, log: cfg.examples.log };
}

function readMeta(dir) {
  const f = path.join(dir, 'meta.json');
  const size = fileSize(f);
  if (size < 0 || size > MAX_META) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); } catch (_) { return null; }
}

/** The pages present in one decision folder, in reading order (the newest transcript when there are several). */
function pagesIn(dir) {
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => fileSize(path.join(dir, n)) >= 0).sort(); } catch (_) { return { pages: [], reports: [] }; }
  const pages = [];
  for (const p of PAGES) {
    const hits = names.filter((n) => p.re.test(n));
    if (hits.length) pages.push({ n: pages.length + 1, name: p.name, stage: p.stage, file: hits[hits.length - 1] });
  }
  const reports = names.filter((n) => REPORT_RE.test(n)).map((n) => ({ file: n, kind: n.startsWith('council') ? 'council' : 'premortem' }));
  return { pages, reports };
}

function cleanSeats(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((s) => s && SEATS.includes(s.seat)).slice(0, 5)
    .map((s) => ({ seat: s.seat, lean: LEANS.includes(s.lean) ? s.lean : 'split', line: str(s.line, 200) }));
}

/** One decision as the dashboard sees it: only known fields, each clipped. */
function summarise(id, dir, meta) {
  const m = meta || {};
  const { pages, reports } = pagesIn(dir);
  const pm = m.premortem && typeof m.premortem === 'object' ? m.premortem : null;
  return {
    id,
    question: str(m.question, 200) || id.slice(11).replace(/-/g, ' '),
    status: STATUSES.includes(m.status) ? m.status : 'in-progress',
    door: m.door === 'one-way' ? 'one-way' : (m.door === 'two-way' ? 'two-way' : null),
    stakes: m.stakes === 'high' ? 'high' : (m.stakes === 'low' ? 'low' : null),
    created: str(m.created, 40) || id.slice(0, 10),
    updated: str(m.updated, 40),
    planned: Array.isArray(m.planned) ? m.planned.filter((s) => typeof s === 'string').slice(0, 10) : [],
    options: Array.isArray(m.options) ? m.options.map((o) => str(o, 120)).filter(Boolean).slice(0, 8) : [],
    verdict: str(m.verdict, 300),
    first_step: str(m.first_step, 300),
    outcome: str(m.outcome, 300),
    filed_as: str(m.filed_as, 40),
    revisit: str(m.revisit, 40),
    seats: cleanSeats(m.seats),
    premortem: pm ? { likely: str(pm.likely, 240), dangerous: str(pm.dangerous, 240), assumption: str(pm.assumption, 240) } : null,
    models: m.models && typeof m.models === 'object' ? { advisors: str(m.models.advisors, 30), chairman: str(m.models.chairman, 30) } : null,
    pages: pages.length,
    stages_done: pages.map((p) => p.stage),
    reports: reports.length,
  };
}

let cache = { at: 0, dir: null, items: null };

function scan(dir) {
  if (cache.dir === dir && Date.now() - cache.at < TTL_MS) return cache.items;
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => ID_RE.test(n)).sort().reverse(); } catch (_) { names = []; }
  const items = [];
  for (const id of names) {
    const d = path.join(dir, id);
    if (!isDir(d)) continue;
    const meta = readMeta(d);
    if (!meta) continue;
    items.push(summarise(id, d, meta));
  }
  cache = { at: Date.now(), dir, items };
  return items;
}

function clearCache() { cache = { at: 0, dir: null, items: null }; }

const words = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2);
const STOP = new Set(['the', 'and', 'for', 'should', 'what', 'with', 'our', 'can', 'are', 'this', 'that', 'than', 'from', 'into', 'have', 'not', 'yes', 'you', 'your', 'one', 'how', 'when', 'will', 'would', 'about', 'more', 'less', 'now', 'next']);

/** How well a text matches a question: shared meaningful words, a whole-phrase hit counting extra. */
function score(q, text) {
  const qw = [...new Set(words(q).filter((w) => !STOP.has(w)))];
  if (!qw.length) return 0;
  const tw = new Set(words(text));
  let s = 0;
  for (const w of qw) if (tw.has(w) || [...tw].some((t) => t.length > 4 && (t.startsWith(w) || w.startsWith(t)))) s += 1;
  if (String(text).toLowerCase().includes(String(q).toLowerCase().trim())) s += 2;
  return s / qw.length;
}

function list(cfg, opts) {
  const o = opts || {};
  const src = source(cfg);
  const all = scan(src.decisions);
  const counts = Object.fromEntries(STATUSES.map((s) => [s, all.filter((d) => d.status === s).length]));
  let out = all;
  if (o.status && STATUSES.includes(o.status)) out = out.filter((d) => d.status === o.status);
  const q = str(o.q, 120);
  if (q) out = out.map((d) => ({ d, s: score(q, `${d.question} ${d.verdict || ''} ${d.options.join(' ')}`) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.d);
  return { examples: src.examples, total: all.length, counts, decisions: out };
}

function folderFor(cfg, id) {
  if (!ID_RE.test(String(id || ''))) return null;
  const src = source(cfg);
  const dir = path.join(src.decisions, id);
  return isDir(dir) && path.dirname(dir) === path.resolve(src.decisions) ? { dir, src } : null;
}

function get(cfg, id) {
  const f = folderFor(cfg, id);
  if (!f) return null;
  const meta = readMeta(f.dir);
  if (!meta) return null;
  const { pages, reports } = pagesIn(f.dir);
  return Object.assign(summarise(id, f.dir, meta), { examples: f.src.examples, pages: pages.map(({ n, name, stage }) => ({ n, name, stage })), reports });
}

function page(cfg, id, n) {
  const f = folderFor(cfg, id);
  if (!f) return null;
  const p = pagesIn(f.dir).pages.find((x) => x.n === n);
  if (!p) return null;
  const file = path.join(f.dir, p.file);
  const size = fileSize(file);
  if (size < 0) return null;
  if (size > MAX_PAGE) return { error: `${p.file} is larger than 512 KB, so it is not shown here. Open it from the folder.`, code: 413 };
  return { n: p.n, name: p.name, stage: p.stage, file: p.file, markdown: fs.readFileSync(file, 'utf8').replace(/^﻿/, '') };
}

function report(cfg, id, file) {
  const f = folderFor(cfg, id);
  if (!f || !REPORT_RE.test(String(file || ''))) return null;
  const full = path.join(f.dir, file);
  const size = fileSize(full);
  if (size < 0) return null;
  if (size > MAX_PAGE) return { error: 'That report is larger than 512 KB.', code: 413 };
  return { file, html: fs.readFileSync(full) };
}

/* ------------------------------------------------------------------ the decision log */

/** "- **Trigger:** text" -> text, for one field of a policy file. */
function field(text, name) {
  const m = new RegExp(`^\\s*-\\s*\\*\\*${name}:\\*\\*\\s*(.+)$`, 'im').exec(text);
  return m ? str(m[1].replace(/\*\*/g, ''), 300) : null;
}

function readSmall(file, max) {
  const size = fileSize(file);
  if (size < 0 || size > (max || MAX_PAGE)) return null;
  try { return fs.readFileSync(file, 'utf8').replace(/^﻿/, ''); } catch (_) { return null; }
}

function policies(cfg) {
  const src = source(cfg);
  const out = [];
  const pdir = path.join(src.log, 'policies');
  let names = [];
  try { names = fs.readdirSync(pdir).filter((n) => /^[a-z0-9][a-z0-9-]{0,80}\.md$/.test(n)).sort(); } catch (_) { names = []; }
  for (const n of names) {
    const text = readSmall(path.join(pdir, n), 64 * 1024);
    if (!text) continue;
    const h = /^#\s+([A-Z]+-\d+):\s*(.+?)\s*(?:\((v\d+)[^)]*\))?\s*$/m.exec(text);
    const statusLine = field(text, 'Status') || '';
    out.push({
      id: h ? h[1] : n.replace(/\.md$/, ''),
      title: h ? str(h[2], 160) : n.replace(/\.md$/, '').replace(/-/g, ' '),
      version: h && h[3] ? h[3] : null,
      status: /retired|superseded/i.test(statusLine) ? 'retired' : 'active',
      trigger: field(text, 'Trigger'), rule: field(text, 'Rule'), escalate_if: field(text, 'Escalate-if'),
      provenance: field(text, 'Provenance'), file: `policies/${n}`,
    });
  }
  out.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  const records = [];
  const adir = path.join(src.log, 'adr');
  try {
    for (const n of fs.readdirSync(adir).filter((x) => /^\d{4}-[a-z0-9-]{1,80}\.md$/.test(x)).sort()) {
      const text = readSmall(path.join(adir, n), 64 * 1024);
      if (!text) continue;
      const t = /^#\s+(.+)$/m.exec(text);
      const st = /^\s*(?:-\s*)?\**Status:?\**:?\s*(.+)$/im.exec(text);
      records.push({ id: n.slice(0, 4), title: t ? str(t[1], 160) : n, status: st ? str(st[1].replace(/\*\*/g, ''), 60) : null, file: `adr/${n}` });
    }
  } catch (_) { /* no records yet */ }
  return { examples: src.examples, policies: out, records };
}

/** The best match in the log for a question: a standing policy first, then a past decision. */
function consult(cfg, q) {
  const pol = policies(cfg).policies.filter((p) => p.status === 'active')
    .map((p) => ({ p, s: score(q, `${p.title} ${p.trigger || ''} ${p.rule || ''}`) })).filter((x) => x.s >= 0.5).sort((a, b) => b.s - a.s);
  const dec = list(cfg, { q }).decisions.slice(0, 5);
  return {
    policy: pol.length ? pol[0].p : null,
    decision: dec.length ? dec[0].id : null,
    matches: dec.map((d) => d.id),
  };
}

/* ------------------------------------------------------------------ the command line */

if (require.main === module) {
  const cfg = require('./config').load();
  const [cmd, ...rest] = process.argv.slice(2);
  const say = (s) => process.stdout.write(`${s}\n`);
  if (cmd === 'find') {
    const q = rest.join(' ');
    const r = consult(cfg, q);
    if (r.policy) say(`Standing policy ${r.policy.id}: ${r.policy.title}\n  Rule: ${r.policy.rule || '(see the file)'}\n  Escalate if: ${r.policy.escalate_if || '(none written)'}`);
    if (r.matches.length) for (const id of r.matches) { const d = get(cfg, id); say(`${id}: ${d.question} [${d.status}]${d.verdict ? `\n  Verdict: ${d.verdict}` : ''}`); }
    if (!r.policy && !r.matches.length) say(`Nothing on file for "${q}".`);
  } else if (cmd === 'policies') {
    const p = policies(cfg);
    for (const x of p.policies) say(`${x.id} (${x.status}): ${x.title}`);
    for (const x of p.records) say(`ADR ${x.id}: ${x.title}${x.status ? ` [${x.status}]` : ''}`);
    if (!p.policies.length && !p.records.length) say('The decision log is empty.');
  } else {
    const r = list(cfg, {});
    say(r.examples ? 'No decisions yet; these are the invented examples:' : `${r.total} decisions:`);
    for (const d of r.decisions) say(`${d.id}  [${d.status}]  ${d.question}`);
  }
}

module.exports = { list, get, page, report, policies, consult, source, score, clearCache, ID_RE, STATUSES, SEATS, PAGES };
