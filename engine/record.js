'use strict';

/**
 * engine/record.js — opens and updates one decision's folder and its meta.json, so the runbook never writes
 * that file by hand. Node built-ins only.
 *
 *   node engine/record.js new "<question>" [--door one-way|two-way] [--stakes low|high]
 *                                         [--planned framing,council,review,verdict,premortem,filing]
 *                                         [--options "first|second|third"]
 *        -> creates <data>/decisions/<YYYY-MM-DD>-<slug>/meta.json and prints its id and folder
 *   node engine/record.js set <id> [--status in-progress|waiting|decided|parked|abandoned] [--verdict "..."]
 *                                  [--first-step "..."] [--outcome "..."] [--filed-as POL-004] [--revisit YYYY-MM-DD]
 *                                  [--door ..] [--stakes ..] [--planned ..] [--options "a|b"] [--merge '<json>']
 *        -> updates those fields and "updated"; --merge takes only seats, premortem and models
 *   node engine/record.js path <id>        -> prints the folder
 *
 * Every value is checked against DESIGN.md section 5 before anything is written; a bad one is refused with a
 * plain sentence and exit 2. meta.json is written to a temporary file and renamed into place. Only folders
 * inside <data>/decisions are created or changed. "outcome" is for the person's own words, never Bryn's.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

const STATUSES = ['in-progress', 'waiting', 'decided', 'parked', 'abandoned'];
const STAGES = ['framing', 'brainstorm', 'council', 'review', 'verdict', 'waiting', 'premortem', 'filing'];
const SEATS = ['contrarian', 'first-principles', 'expansionist', 'outsider', 'executor'];
const LEANS = ['for', 'against', 'split'];
const ID_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{0,70}$/;

const refuse = (msg) => { throw Object.assign(new Error(msg), { refused: true }); };
const text = (v, max, name) => {
  const s = String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
  if (!s) refuse(`${name} is empty.`);
  if (s.length > max) refuse(`${name} is longer than ${max} characters.`);
  return s;
};

function today(d) {
  const x = d || new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** "Repair the old laptop, or replace it?" -> "repair-the-old-laptop-or-replace" */
function slug(question) {
  const words = String(question).toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
  let s = '';
  for (const w of words) {
    if ((s ? `${s}-${w}` : w).length > 48) break;
    s = s ? `${s}-${w}` : w;
  }
  return s || 'question';
}

function check(field, v) {
  switch (field) {
    case 'status': if (!STATUSES.includes(v)) refuse(`status must be one of: ${STATUSES.join(', ')}.`); return v;
    case 'door': if (!['one-way', 'two-way'].includes(v)) refuse('door must be one-way (cannot be undone) or two-way (can be undone).'); return v;
    case 'stakes': if (!['low', 'high'].includes(v)) refuse('stakes must be low or high.'); return v;
    case 'planned': {
      const list = String(v).split(',').map((s) => s.trim()).filter(Boolean);
      const bad = list.filter((s) => !STAGES.includes(s));
      if (bad.length || !list.length) refuse(`planned is a comma list of: ${STAGES.join(', ')}.`);
      return list;
    }
    case 'options': {
      const list = String(v).split('|').map((s) => s.trim()).filter(Boolean);
      if (!list.length || list.length > 8 || list.some((o) => o.length > 120)) refuse('options is a "|" list of at most 8, each at most 120 characters.');
      return list;
    }
    case 'revisit': if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) refuse('revisit is a date written YYYY-MM-DD.'); return v;
    case 'filed_as': if (!/^[A-Z]{2,5}-\d{1,4}$|^ADR-\d{4}$/.test(v)) refuse('filed-as is a record id such as POL-004 or ADR-0002.'); return v;
    case 'verdict': return text(v, 300, 'verdict');
    case 'first_step': return text(v, 300, 'first-step');
    case 'outcome': return text(v, 300, 'outcome');
    default: refuse(`${field} is not a field this command sets.`);
  }
  return v;
}

function checkMerge(json) {
  let o;
  try { o = JSON.parse(json); } catch (_) { refuse('--merge must be JSON, for example {"seats": [...]}.'); }
  if (!o || typeof o !== 'object' || Array.isArray(o)) refuse('--merge must be one JSON object.');
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === 'seats') {
      if (!Array.isArray(v) || v.length > 5) refuse('seats is a list of at most five.');
      out.seats = v.map((s) => {
        if (!s || !SEATS.includes(s.seat)) refuse(`each seat is one of: ${SEATS.join(', ')}.`);
        if (!LEANS.includes(s.lean)) refuse(`each lean is one of: ${LEANS.join(', ')}.`);
        return { seat: s.seat, lean: s.lean, line: text(s.line, 200, `the ${s.seat} line`) };
      });
    } else if (k === 'premortem') {
      if (!v || typeof v !== 'object') refuse('premortem is { "likely", "dangerous", "assumption" }.');
      out.premortem = { likely: text(v.likely, 240, 'premortem.likely'), dangerous: text(v.dangerous, 240, 'premortem.dangerous'), assumption: text(v.assumption, 240, 'premortem.assumption') };
    } else if (k === 'models') {
      if (!v || typeof v !== 'object') refuse('models is { "advisors", "reviewers", "chairman" }.');
      out.models = {};
      for (const r of ['advisors', 'reviewers', 'chairman']) out.models[r] = v[r] == null ? null : text(v[r], 30, `models.${r}`);
    } else refuse(`--merge takes only seats, premortem and models, not ${k}.`);
  }
  return out;
}

function writeMeta(dir, meta) {
  const file = path.join(dir, 'meta.json');
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}

function folder(cfg, id) {
  if (!ID_RE.test(String(id || ''))) refuse(`"${id}" is not a decision id (it looks like 2026-10-05-some-words).`);
  const dir = path.join(cfg.decisions, id);
  if (!fs.existsSync(path.join(dir, 'meta.json'))) refuse(`There is no decision ${id} in ${cfg.decisions}.`);
  return dir;
}

function create(cfg, question, opts) {
  const o = opts || {};
  const q = text(question, 200, 'The question');
  const base = `${today(o.date)}-${slug(q)}`;
  let id = base;
  for (let n = 2; fs.existsSync(path.join(cfg.decisions, id)); n += 1) id = `${base}-${n}`;
  const now = new Date().toISOString();
  const meta = {
    schema: 1, id, question: q,
    door: o.door != null ? check('door', o.door) : null,
    stakes: o.stakes != null ? check('stakes', o.stakes) : null,
    status: 'in-progress',
    planned: o.planned != null ? check('planned', o.planned) : ['framing'],
    created: now, updated: now,
    options: o.options != null ? check('options', o.options) : [],
    verdict: null, first_step: null, seats: [], premortem: null, models: null,
    outcome: null, filed_as: null, revisit: null,
  };
  const dir = path.join(cfg.decisions, id);
  fs.mkdirSync(dir, { recursive: true });
  writeMeta(dir, meta);
  return { id, dir, meta };
}

function update(cfg, id, fields, merge) {
  const dir = folder(cfg, id);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8').replace(/^﻿/, ''));
  for (const [k, v] of Object.entries(fields || {})) if (v !== undefined) meta[k] = check(k, v);
  if (merge) Object.assign(meta, checkMerge(merge));
  meta.updated = new Date().toISOString();
  writeMeta(dir, meta);
  return { id, dir, meta };
}

/* ------------------------------------------------------------------ the command line */

const FLAGS = { '--door': 'door', '--stakes': 'stakes', '--planned': 'planned', '--options': 'options', '--status': 'status',
  '--verdict': 'verdict', '--first-step': 'first_step', '--outcome': 'outcome', '--filed-as': 'filed_as', '--revisit': 'revisit', '--merge': 'merge' };

function parse(argv) {
  const out = { _: [], f: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const k = FLAGS[argv[i]];
    if (k) {
      if (i + 1 >= argv.length) refuse(`${argv[i]} needs a value.`);
      out.f[k] = argv[i + 1];
      i += 1;
    } else if (argv[i].startsWith('--')) refuse(`${argv[i]} is not an option here.`);
    else out._.push(argv[i]);
  }
  return out;
}

function main(argv, opts) {
  const o = opts || {};
  const out = o.out || process.stdout;
  const err = o.err || process.stderr;
  try {
    const cfg = o.cfg || config.load();
    const { _: [cmd, arg], f } = parse(argv);
    if (cmd === 'new' && arg) {
      const r = create(cfg, arg, f);
      out.write(`${r.id}\n${r.dir}\n`);
      return 0;
    }
    if (cmd === 'set' && arg) {
      const { merge, ...fields } = f;
      const r = update(cfg, arg, fields, merge);
      out.write(`Updated ${r.id}: status ${r.meta.status}${r.meta.verdict ? `; advice: ${r.meta.verdict}` : ''}\n`);
      return 0;
    }
    if (cmd === 'path' && arg) { out.write(`${folder(cfg, arg)}\n`); return 0; }
    out.write('node engine/record.js new "<question>" [--door ..] [--stakes ..] [--planned ..] [--options "a|b"]\n'
      + 'node engine/record.js set <id> [--status ..] [--verdict ..] [--first-step ..] [--outcome ..] [--filed-as ..] [--revisit ..] [--merge <json>]\n'
      + 'node engine/record.js path <id>\n');
    return cmd ? 2 : 0;
  } catch (e) {
    err.write(`${e.message}\n`);
    return e.refused ? 2 : 1;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { create, update, slug, check, checkMerge, main, STATUSES };
