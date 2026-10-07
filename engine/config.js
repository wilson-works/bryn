'use strict';

/**
 * engine/config.js — where Bryn keeps what you bring her, and which port the dashboard uses.
 * Node built-ins only.
 *
 *   load(home)  { home, key, port, data, decisions, log, stageFile, asksFile, examples, hub, source, phoneHost, claude }
 *
 * Everything a person tells Bryn lives in one data folder, never in her own folder: her folder is the
 * package (it can be copied, zipped, replaced or archived), and your questions must not travel with it.
 * The data folder, first match wins:
 *   1. "data_dir" in bryn.config.json in her folder (machine-local, never committed; a relative path is
 *      read from her folder). bryn.config.example.json shows the shape.
 *   2. <Hub>/50-AI/agent-data/bryn/ when she lives inside a Hub: the Hub is the nearest folder above her
 *      own that holds .hub/hub.json.
 *   3. data/ in her own folder (git-ignored), when she runs straight from a copy of this repo.
 * Inside it:
 *   decisions/<YYYY-MM-DD>-<slug>/   one folder per question (meta.json, brief.md, the skills' files)
 *   log/                              the decision log: POLICIES.md, policies/, adr/
 *   stage.json                        what she is doing now (engine/stage.js)
 *   asks.md                           questions brought from the dashboard (engine/asks.js)
 *
 * examples/ in her folder has the same shape, invented. The dashboard shows it, marked as examples, only
 * while the data folder holds no decision yet, so a fresh install has something to look at.
 *
 * The port: "port" in the config, else probe.port in agent.json (the Workspace rewrites it when it installs
 * her where 7550 is taken), else 7550.
 *
 * Her phone address: "phone" in bryn.config.json (for example "https://desk.example-tailnet.ts.net:8445/", or a bare
 * host name), else door.phone in her agent.json. Her dashboard answers that host name as well as 127.0.0.1 and
 * localhost. load() returns it as phoneHost, and throws, in plain words, when "phone" cannot be read as an address.
 *
 * Claude Code for a run from her dashboard (engine/take.js): "claude" in bryn.config.json names its program (a
 * relative path is read from her folder); otherwise take.js looks on the PATH. load() returns it as claude, or null.
 */

const fs = require('fs');
const path = require('path');

const HOME = path.join(__dirname, '..');
const DEFAULT_PORT = 7550;
const KEY_RE = /^[a-z][a-z0-9-]{0,30}$/;

const portOk = (n) => Number.isInteger(n) && n >= 1024 && n <= 65535;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); } catch (_) { return null; }
}

/** The Hub this folder sits in: the nearest folder above it that holds .hub/hub.json, else null. */
function findHub(from) {
  let dir = path.resolve(from);
  for (let i = 0; i < 12; i += 1) {
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
    if (fs.existsSync(path.join(dir, '.hub', 'hub.json'))) return dir;
  }
  return null;
}

function phoneHostOf(manifest) {
  try { return manifest && manifest.door && manifest.door.phone ? new URL(manifest.door.phone).hostname.toLowerCase() : null; } catch (_) { return null; }
}

function load(home) {
  const h = path.resolve(home || HOME);
  const manifest = readJson(path.join(h, 'agent.json')) || {};
  const key = typeof manifest.key === 'string' && KEY_RE.test(manifest.key) ? manifest.key : 'bryn';
  const cfg = readJson(path.join(h, `${key}.config.json`)) || {};
  const hub = findHub(h);

  let port = DEFAULT_PORT;
  if (portOk(cfg.port)) port = cfg.port;
  else if (manifest.probe && portOk(manifest.probe.port)) port = manifest.probe.port;

  let data;
  let source;
  if (typeof cfg.data_dir === 'string' && cfg.data_dir.trim()) { data = path.resolve(h, cfg.data_dir.trim()); source = 'config'; }
  else if (hub) { data = path.join(hub, '50-AI', 'agent-data', key); source = 'hub'; }
  else { data = path.join(h, 'data'); source = 'local'; }

  // Her phone address: "phone" in bryn.config.json (this computer's own tailnet address, kept out of agent.json so
  // it is never committed), else door.phone in agent.json.
  let phoneHost = phoneHostOf(manifest);
  if (cfg.phone != null) {
    phoneHost = phoneHostOf({ door: { phone: String(cfg.phone).includes('://') ? cfg.phone : `https://${cfg.phone}` } });
    if (!phoneHost) throw new Error(`"phone" in ${key}.config.json must be an address, for example https://desk.example-tailnet.ts.net:8445/.`);
  }

  return {
    home: h, key, port, hub, source, data, phoneHost,
    claude: typeof cfg.claude === 'string' && cfg.claude.trim() ? path.resolve(h, cfg.claude.trim()) : null,
    decisions: path.join(data, 'decisions'),
    log: path.join(data, 'log'),
    stageFile: path.join(data, 'stage.json'),
    asksFile: path.join(data, 'asks.md'),
    examples: { decisions: path.join(h, 'examples', 'decisions'), log: path.join(h, 'examples', 'log') },
  };
}

// node engine/config.js   prints where everything is, for the runbook and for a person checking.
if (require.main === module) {
  const c = load();
  process.stdout.write([
    `Bryn's data folder: ${c.data} (from ${c.source === 'config' ? 'bryn.config.json' : c.source === 'hub' ? 'the Hub' : 'her own folder'})`,
    `  decisions:        ${c.decisions}`,
    `  stone path (log): ${c.log}`,
    `  stage:            ${c.stageFile}`,
    `  questions left:   ${c.asksFile}`,
    `Dashboard port:     ${c.port}`, '',
  ].join('\n'));
}

module.exports = { load, findHub, DEFAULT_PORT };
