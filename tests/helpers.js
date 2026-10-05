'use strict';

/**
 * tests/helpers.js — shared by Bryn's tests: a temporary home with its own data folder, so no test ever reads or
 * writes a real Hub, and a tiny HTTP client for the server tests. Node built-ins only.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const REPO = path.join(__dirname, '..');

/** A config like engine/config.js gives, pointing at a fresh temporary data folder and the repo's examples. */
function tempCfg() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bryn-test-'));
  const data = path.join(root, 'data');
  return {
    root,
    cfg: {
      home: REPO, key: 'bryn', port: 0, hub: null, source: 'config', data,
      decisions: path.join(data, 'decisions'), log: path.join(data, 'log'),
      stageFile: path.join(data, 'stage.json'), asksFile: path.join(data, 'asks.md'),
      examples: { decisions: path.join(REPO, 'examples', 'decisions'), log: path.join(REPO, 'examples', 'log') },
    },
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

/** One request: resolves { status, headers, body, json }. */
function request(port, opts) {
  const o = opts || {};
  return new Promise((resolve, reject) => {
    const body = o.body == null ? null : (typeof o.body === 'string' ? o.body : JSON.stringify(o.body));
    const req = http.request({
      host: '127.0.0.1', port, method: o.method || 'GET', path: o.path || '/',
      headers: Object.assign({ Host: o.host || `127.0.0.1:${port}` }, body != null ? { 'Content-Type': o.type || 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch (_) { json = null; }
        resolve({ status: res.statusCode, headers: res.headers, body: text, json });
      });
    });
    req.on('error', reject);
    if (body != null) req.write(body);
    req.end();
  });
}

module.exports = { REPO, tempCfg, request };
