'use strict';

/**
 * engine/asks.js — questions left at Bryn's trailhead from the dashboard, waiting for a Claude session to take
 * them up. Nothing runs by itself: a question here only waits. Node built-ins only.
 *
 *   add(file, { question, context })   append one; returns how many are waiting
 *   list(file)                         [{ question, context, at }], oldest first
 *   take(file)                         remove the oldest and return it (the runbook's "take up the next question")
 *   node engine/asks.js list | take
 *
 * The file is asks.md in her data folder (engine/config.js): plain markdown a person can read and edit, one
 * block per question:
 *
 *   ## <question>
 *   - asked: 2026-10-05T19:40:00.000Z
 *   - context: <a sentence or two>
 *
 * Rules: a question is 3 to 200 characters, the context at most 600; line breaks and control characters are
 * folded to spaces and a leading "#" is dropped, so a question can never forge a second block. At most 50
 * wait at once. Only this one file is written.
 */

const fs = require('fs');
const path = require('path');

const MAX_WAITING = 50;
const HEAD = '# Questions left at the trailhead\n\nEach waits for a Claude session: say "Bryn, take up the next question". Edit or remove any by hand.\n';

const flat = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/^#+\s*/, '').slice(0, max).trim();

function parse(text) {
  const out = [];
  for (const block of String(text || '').split(/^## /m).slice(1)) {
    const lines = block.split(/\r?\n/);
    const question = lines[0].trim();
    if (!question) continue;
    const field = (k) => {
      const l = lines.find((x) => x.startsWith(`- ${k}: `));
      return l ? l.slice(k.length + 4).trim() : null;
    };
    out.push({ question, context: field('context'), at: field('asked') });
  }
  return out;
}

const render = (items) => HEAD + items.map((a) => `\n## ${a.question}\n- asked: ${a.at || new Date().toISOString()}\n${a.context ? `- context: ${a.context}\n` : ''}`).join('');

function list(file) {
  try { return parse(fs.readFileSync(file, 'utf8')); } catch (_) { return []; }
}

function write(file, items) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, render(items), 'utf8');
  fs.renameSync(tmp, file);
}

function add(file, item) {
  const question = flat(item && item.question, 200);
  const context = flat(item && item.context, 600);
  if (question.length < 3) throw new Error('Write the question you are weighing, in a few words.');
  const waiting = list(file);
  if (waiting.length >= MAX_WAITING) throw new Error(`There are already ${MAX_WAITING} questions waiting. Take some up first.`);
  waiting.push({ question, context: context || null, at: new Date().toISOString() });
  write(file, waiting);
  return waiting.length;
}

function take(file) {
  const waiting = list(file);
  if (!waiting.length) return null;
  const first = waiting.shift();
  write(file, waiting);
  return first;
}

if (require.main === module) {
  const file = require('./config').load().asksFile;
  const cmd = process.argv[2] || 'list';
  if (cmd === 'take') {
    const a = take(file);
    process.stdout.write(a ? `${a.question}${a.context ? `\nContext: ${a.context}` : ''}\n` : 'No questions are waiting.\n');
  } else {
    const items = list(file);
    if (!items.length) process.stdout.write('No questions are waiting.\n');
    for (const [i, a] of items.entries()) process.stdout.write(`${i + 1}. ${a.question}${a.context ? ` (${a.context})` : ''}\n`);
  }
}

module.exports = { add, list, take, parse, MAX_WAITING };
