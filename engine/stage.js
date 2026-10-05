'use strict';

/**
 * engine/stage.js — the stage: one small file that says what Bryn is doing right now, so the dashboard
 * can show the matching scene. Node built-ins only.
 *
 *   node engine/stage.js set <stage> [--question "..."] [--decision <id>] [--step n/of] [--note "..."]
 *   node engine/stage.js get
 *
 * The file is stage.json in her data folder (engine/config.js):
 *   { "stage", "question", "decision", "step": { "n", "of" } | null, "since", "note", "before" }
 *
 * The rules (DESIGN.md, "The stage"):
 *   - stage is one of STAGES; anything else is refused with a plain sentence.
 *   - The runbook sets a stage when that stage STARTS, so a session that stops shows where it stopped.
 *   - A working stage (WORKING) unchanged for 30 minutes is stalled: it reads as idle with
 *     "stalled": { "stage", "since" }, so the dashboard can say where the table went quiet, and her
 *     runbook offers to pick it up or close it the next time a session opens.
 *   - waiting (the advice is in; the decision is yours) never stalls. After 24 hours it reads as idle
 *     with "parked": { "since" }.
 *   - consulting is short: about eight seconds after it was set it falls back to the stage it
 *     interrupted (kept in "before"), under that stage's own rules.
 *   - No file, or a file that cannot be read: idle.
 *   - Only stage.json is written: to a temporary file first, then renamed into place, so the dashboard
 *     never reads half a file.
 */

const fs = require('fs');
const path = require('path');

const STAGES = ['idle', 'framing', 'brainstorm', 'council', 'review', 'verdict', 'waiting', 'premortem', 'filing', 'consulting'];
const WORKING = new Set(['framing', 'brainstorm', 'council', 'review', 'verdict', 'premortem', 'filing']);
const STALL_MS = 30 * 60 * 1000;
const PARK_MS = 24 * 60 * 60 * 1000;
const CONSULT_MS = 8000;
const MAX_TEXT = 300;

const clip = (s) => (s == null ? null : (String(s).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, MAX_TEXT) || null));
const toMs = (now) => (now == null ? Date.now() : (now instanceof Date ? now.getTime() : Number(now)));

function idle(extra) {
  return Object.assign({ stage: 'idle', question: null, decision: null, step: null, since: null, note: null }, extra || {});
}

/** "3/7" -> { n: 3, of: 7 }; anything else -> null. */
function parseStep(s) {
  const m = /^(\d{1,3})\s*\/\s*(\d{1,3})$/.exec(String(s == null ? '' : s).trim());
  if (!m) return null;
  const n = Number(m[1]);
  const of = Number(m[2]);
  return of >= 1 && n >= 1 && n <= of ? { n, of } : null;
}

function cleanStep(step) {
  return step && Number.isInteger(step.n) && Number.isInteger(step.of) && step.n >= 1 && step.n <= step.of ? { n: step.n, of: step.of } : null;
}

/** Apply the rules to one stored stage object at time t (epoch ms). Never throws. */
function resolve(raw, t, depth) {
  if (!raw || typeof raw !== 'object' || !STAGES.includes(raw.stage)) return idle();
  const sinceMs = Date.parse(raw.since);
  const since = Number.isFinite(sinceMs) ? new Date(sinceMs).toISOString() : null;
  const age = Number.isFinite(sinceMs) ? t - sinceMs : Infinity;
  if (raw.stage === 'consulting' && age > CONSULT_MS) {
    const back = (depth || 0) < 1 && raw.before && typeof raw.before === 'object' && raw.before.stage !== 'consulting';
    return back ? resolve(raw.before, t, 1) : idle({ since });
  }
  const out = { stage: raw.stage, question: clip(raw.question), decision: clip(raw.decision), step: cleanStep(raw.step), since, note: clip(raw.note) };
  if (WORKING.has(raw.stage) && age > STALL_MS) return idle({ question: out.question, decision: out.decision, stalled: { stage: raw.stage, since } });
  if (raw.stage === 'waiting' && age > PARK_MS) return idle({ question: out.question, decision: out.decision, parked: { since } });
  if (raw.stage === 'idle') return idle({ since });
  return out;
}

function readRaw(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); } catch (_) { return null; }
}

/** The stage as the dashboard shows it now. `now` (a Date or epoch ms) is for tests. */
function current(file, now) {
  return resolve(readRaw(file), toMs(now));
}

/**
 * Set the stage in `file`. opts { question, decision, step ("n/of" or {n, of}), note, now }.
 * Returns what was written. Throws a plain sentence for an unknown stage or a bad step.
 */
function set(file, stage, opts) {
  const o = opts || {};
  if (!STAGES.includes(stage)) throw new Error(`"${stage}" is not a stage. Use one of: ${STAGES.join(', ')}.`);
  let step = null;
  if (o.step != null && o.step !== '') {
    step = typeof o.step === 'object' ? cleanStep(o.step) : parseStep(o.step);
    if (!step) throw new Error(`--step must look like 3/7 (this step, of how many). "${typeof o.step === 'object' ? JSON.stringify(o.step) : o.step}" does not.`);
  }
  const t = toMs(o.now);
  const rec = { stage, question: clip(o.question), decision: clip(o.decision), step, since: new Date(t).toISOString(), note: clip(o.note) };
  if (stage === 'idle') { rec.question = null; rec.decision = null; rec.step = null; }
  if (stage === 'consulting') {
    // Keep the stage it interrupts, so the scene goes back to it afterwards.
    const raw = readRaw(file);
    const now = resolve(raw, t);
    if (raw && now.stage !== 'idle' && now.stage !== 'consulting') {
      rec.before = { stage: raw.stage, question: raw.question || null, decision: raw.decision || null, step: cleanStep(raw.step), since: raw.since, note: raw.note || null };
    } else if (raw && raw.stage === 'consulting' && raw.before) rec.before = raw.before;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(rec, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
  return rec;
}

/* ------------------------------------------------------------------ the command line */

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const m = /^--(question|decision|step|note)(?:=(.*))?$/.exec(argv[i]);
    if (!m) { out._.push(argv[i]); continue; }
    if (m[2] != null) out[m[1]] = m[2];
    else if (i + 1 < argv.length) { out[m[1]] = argv[i + 1]; i += 1; } else out[m[1]] = '';
  }
  return out;
}

function main(argv, opts) {
  const o = opts || {};
  const out = o.out || process.stdout;
  const err = o.err || process.stderr;
  const file = o.file || require('./config').load().stageFile;
  const args = parseArgs(argv);
  const [cmd, stage] = args._;
  try {
    if (cmd === 'get') { out.write(`${JSON.stringify(current(file), null, 2)}\n`); return 0; }
    if (cmd === 'set' && stage) {
      const rec = set(file, stage, { question: args.question, decision: args.decision, step: args.step, note: args.note });
      const step = rec.step ? ` (step ${rec.step.n} of ${rec.step.of})` : '';
      out.write(`Stage is now ${rec.stage}${step}${rec.question ? `: ${rec.question}` : ''}\n`);
      return 0;
    }
    out.write([
      'Set or read what Bryn is doing, for her dashboard.',
      '  node engine/stage.js set <stage> [--question "..."] [--decision <id>] [--step n/of] [--note "..."]',
      '  node engine/stage.js get',
      `The stages: ${STAGES.join(', ')}.`, '',
    ].join('\n'));
    return cmd ? 2 : 0;
  } catch (e) {
    err.write(`${e.message}\n`);
    return 2;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { STAGES, WORKING, STALL_MS, PARK_MS, CONSULT_MS, current, set, resolve, parseStep, main };
