'use strict';

/**
 * dashboard/server.js — Bryn's dashboard: the page, her scenes, and a small JSON API over her data folder.
 * Node built-ins only; nothing to install.
 *
 *   node dashboard/server.js [--port <n>]     (run from Bryn's folder; "start" in agent.json says so)
 *
 * The contract (DESIGN.md, section 6):
 *   - Listens on 127.0.0.1 only, on the port engine/config.js gives (7550 unless bryn.config.json or
 *     agent.json says otherwise, or --port). Writes its pid to dashboard/.pid once it listens.
 *   - Answers only Host 127.0.0.1, localhost or the name in its own door.phone. Anything else gets 403.
 *   - GET /health is {"ok":true}: no login and no token, ever (the office checks it every 20 seconds).
 *   - Serves files only from dashboard/public/, art/ and brand/ (plus mark.svg and art.svg), by plain file
 *     name only: no folders, no "..", no hidden files, no links.
 *   - Reads decisions only through engine/decisions.js (her data folder, or examples/ while that is empty).
 *   - Writes only stage.json and asks.md in her data folder.
 *   - The page and the API refuse to be framed; the skills' HTML reports are served sandboxed (no scripts).
 *
 * The API:
 *   GET  /api/stage                          the stage now (engine/stage.js)
 *   GET  /api/decisions?status=&q=           { examples, total, counts, decisions: [...], where }
 *   GET  /api/decision/<id>                  one decision, its pages and its reports
 *   GET  /api/decision/<id>/page/<n>         { n, name, stage, file, markdown }
 *   GET  /api/decision/<id>/report/<file>    a skill's HTML report, sandboxed
 *   GET  /api/policies                       { examples, policies: [...], records: [...] }
 *   POST /api/consult  { q }                 { policy, decision, matches }; the stage goes to consulting
 *   POST /api/ask      { question, context } { queued: n }: left at the trailhead for the next session
 *   GET  /api/asks                           { asks: [...] }
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const HOME = path.join(__dirname, '..');
const config = require('../engine/config');
const stage = require('../engine/stage');
const decisions = require('../engine/decisions');
const asks = require('../engine/asks');

const PUBLIC = path.join(__dirname, 'public');
const STATIC_DIRS = { '/art/': path.join(HOME, 'art'), '/brand/': path.join(HOME, 'brand') };
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
};
const MAX_BODY = 16 * 1024;
const PAGE_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const SVG_CSP = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
const REPORT_CSP = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'";

function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(HOME, 'agent.json'), 'utf8').replace(/^﻿/, ''));
}

function hostsAllowed(m) {
  const hosts = new Set(['127.0.0.1', 'localhost']);
  try { if (m && m.door && m.door.phone) hosts.add(new URL(m.door.phone).hostname.toLowerCase()); } catch (_) { /* no phone door */ }
  return hosts;
}

function send(res, code, body, type, extra) {
  res.writeHead(code, Object.assign({
    'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
  }, extra || {}));
  res.end(body);
}

const json = (res, code, obj) => send(res, code, JSON.stringify(obj), 'application/json; charset=utf-8');

/** A file directly inside `dir`, by a plain name only: no folders, no "..", no hidden files, no links. */
function plainFileIn(dir, name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}$/.test(name) || name.includes('..')) return null;
  const file = path.join(dir, name);
  if (path.dirname(file) !== path.resolve(dir)) return null;
  try { return fs.lstatSync(file).isFile() ? file : null; } catch (_) { return null; }
}

function serveFile(res, file, head) {
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) { send(res, 404, 'not found'); return; }
  const extra = type.startsWith('text/html') ? { 'Content-Security-Policy': PAGE_CSP }
    : (type === 'image/svg+xml' ? { 'Content-Security-Policy': SVG_CSP } : {});
  send(res, 200, head ? undefined : fs.readFileSync(file), type, extra);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let done = false;
    const chunks = [];
    req.on('data', (c) => {
      if (done) return;
      size += c.length;
      if (size > MAX_BODY) { done = true; reject(Object.assign(new Error('That is more than this form takes (16 KB).'), { code: 413 })); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (done) return;
      done = true;
      try {
        const v = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('not an object');
        resolve(v);
      } catch (_) { reject(Object.assign(new Error('The request was not a JSON object.'), { code: 400 })); }
    });
    req.on('error', (e) => { if (!done) { done = true; reject(e); } });
  });
}

/** Where her data lives, said plainly for the page footer: no more of the path than a person needs. */
function where(cfg) {
  if (cfg.source === 'hub') return path.join('50-AI', 'agent-data', cfg.key).replace(/\\/g, '/');
  if (cfg.source === 'local') return `data/ in ${path.basename(cfg.home)}`;
  return cfg.data;
}

async function api(req, res, url, cfg) {
  const p = url.pathname;
  const get = req.method === 'GET' || req.method === 'HEAD';
  if (get && p === '/api/stage') return json(res, 200, stage.current(cfg.stageFile));
  if (get && p === '/api/decisions') {
    const r = decisions.list(cfg, { status: url.searchParams.get('status'), q: url.searchParams.get('q') });
    return json(res, 200, Object.assign(r, { where: where(cfg) }));
  }
  if (get && p === '/api/policies') return json(res, 200, decisions.policies(cfg));
  if (get && p === '/api/asks') return json(res, 200, { asks: asks.list(cfg.asksFile) });

  let m = /^\/api\/decision\/([a-z0-9-]{12,82})$/.exec(p);
  if (get && m) {
    const d = decisions.get(cfg, m[1]);
    return d ? json(res, 200, d) : json(res, 404, { error: 'There is no decision with that name.' });
  }
  m = /^\/api\/decision\/([a-z0-9-]{12,82})\/page\/(\d{1,2})$/.exec(p);
  if (get && m) {
    const pg = decisions.page(cfg, m[1], Number(m[2]));
    if (pg && pg.error) return json(res, pg.code || 404, { error: pg.error });
    return pg ? json(res, 200, pg) : json(res, 404, { error: 'That page is not there.' });
  }
  m = /^\/api\/decision\/([a-z0-9-]{12,82})\/report\/([A-Za-z0-9_.-]{1,120})$/.exec(p);
  if (get && m) {
    const r = decisions.report(cfg, m[1], m[2]);
    if (r && r.error) return json(res, r.code || 404, { error: r.error });
    if (!r) return json(res, 404, { error: 'That report is not there.' });
    return send(res, 200, r.html, 'text/html; charset=utf-8', { 'Content-Security-Policy': REPORT_CSP });
  }

  if (req.method === 'POST' && (p === '/api/consult' || p === '/api/ask')) {
    if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) {
      return json(res, 415, { error: 'Send JSON (Content-Type: application/json).' });
    }
    let body;
    try { body = await readBody(req); } catch (e) { return json(res, e.code || 400, { error: e.message }); }
    if (p === '/api/consult') {
      const q = String(body.q == null ? '' : body.q).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, 200);
      if (q.length < 3) return json(res, 400, { error: 'Say what you are deciding, in a few words.' });
      const found = decisions.consult(cfg, q);
      const note = found.policy ? `Found ${found.policy.id}` : (found.decision ? 'Found a past decision' : 'Nothing on file');
      stage.set(cfg.stageFile, 'consulting', { question: q, decision: found.decision, note });
      return json(res, 200, found);
    }
    try {
      return json(res, 200, { queued: asks.add(cfg.asksFile, { question: body.question, context: body.context }) });
    } catch (e) { return json(res, 400, { error: e.message }); }
  }
  if (p.startsWith('/api/')) return json(res, req.method === 'GET' || req.method === 'POST' ? 404 : 405, { error: 'not found' });
  return null;
}

/** The request handler. getCfg gives the config for each API call (engine/config.js; tests pass their own). */
const makeHandler = (getCfg) => function handler(req, res) {
  let m;
  try { m = readManifest(); } catch (e) { send(res, 500, `agent.json could not be read: ${e.message}`); return; }
  const host = String(req.headers.host || '').toLowerCase().replace(/:\d+$/, '');
  if (!hostsAllowed(m).has(host)) { send(res, 403, 'unknown host'); return; }
  let url;
  try { url = new URL(req.url, 'http://127.0.0.1'); } catch (_) { send(res, 400, 'bad address'); return; }
  const p = url.pathname;

  if (p === '/health') { send(res, 200, '{"ok":true}', 'application/json'); return; }
  if (p.startsWith('/api/')) {
    let cfg;
    try { cfg = getCfg(); } catch (e) { json(res, 500, { error: `Bryn's settings could not be read: ${e.message}` }); return; }
    api(req, res, url, cfg).catch((e) => json(res, 500, { error: `Something went wrong reading Bryn's notes: ${e.message}` }));
    return;
  }
  const head = req.method === 'HEAD';
  if (req.method !== 'GET' && !head) { send(res, 405, 'method not allowed'); return; }
  if (p === '/' || p === '/index.html') { serveFile(res, path.join(PUBLIC, 'index.html'), head); return; }
  if (p === '/mark.svg' || p === '/art.svg') {
    const f = plainFileIn(HOME, p.slice(1));
    if (f) serveFile(res, f, head); else send(res, 404, 'not found');
    return;
  }
  let name = p.slice(1);
  let dir = PUBLIC;
  for (const [prefix, d] of Object.entries(STATIC_DIRS)) {
    if (p.startsWith(prefix)) { name = p.slice(prefix.length); dir = d; break; }
  }
  try { name = decodeURIComponent(name); } catch (_) { send(res, 400, 'bad address'); return; }
  const f = plainFileIn(dir, name);
  if (f) serveFile(res, f, head); else send(res, 404, 'not found');
};

const handler = makeHandler(() => config.load(HOME));

/**
 * Start listening. opts { port (0 for any free port), cfg (a fixed config, for tests), pidFile (false: do not
 * write dashboard/.pid), quiet }. Returns the http.Server.
 */
function start(opts) {
  const o = opts || {};
  const cfg = o.cfg || config.load(HOME);
  const port = o.port != null ? o.port : cfg.port;
  const server = http.createServer(o.cfg ? makeHandler(() => o.cfg) : handler);
  server.on('error', (e) => {
    process.stderr.write(e.code === 'EADDRINUSE'
      ? `Port ${port} is already in use. Give Bryn another port: "port" in bryn.config.json, or probe.port and door.local in agent.json.\n`
      : `${e.message}\n`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    if (o.pidFile !== false) {
      try { fs.writeFileSync(path.join(__dirname, '.pid'), `${process.pid}\n`); } catch (_) { /* the office keeps its own record */ }
    }
    if (o.quiet !== true) process.stdout.write(`${readManifest().name} is on http://127.0.0.1:${server.address().port}/ (her notes: ${cfg.data})\n`);
  });
  return server;
}

if (require.main === module) {
  const i = process.argv.indexOf('--port');
  const port = i > 0 ? Number(process.argv[i + 1]) : undefined;
  if (port !== undefined && !(Number.isInteger(port) && port >= 1024 && port <= 65535)) {
    process.stderr.write('--port needs a number from 1024 to 65535. Nothing was started.\n');
    process.exitCode = 2;
  } else start({ port });
}

module.exports = { handler, makeHandler, start, hostsAllowed, plainFileIn, where };
