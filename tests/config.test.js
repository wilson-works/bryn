'use strict';

/**
 * config.test.js — engine/config.js's phone address: "phone" in bryn.config.json wins over door.phone in agent.json,
 * a bare host name is accepted, an address that cannot be read is refused in plain words, and the dashboard's Host
 * rule answers the phone host from the config. Temporary folders and a port the system picks; no real Hub is read.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../engine/config');
const { start } = require('../dashboard/server');
const { tempCfg, request } = require('./helpers');

function home(agent, cfg) {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'bryn-config-'));
  fs.writeFileSync(path.join(h, 'agent.json'), JSON.stringify(Object.assign({ key: 'bryn' }, agent)));
  if (cfg) fs.writeFileSync(path.join(h, 'bryn.config.json'), JSON.stringify(cfg));
  return h;
}

test('the phone address comes from bryn.config.json first, then agent.json', () => {
  const agent = { door: { local: 'http://127.0.0.1:7550/', phone: 'https://laptop.example-tailnet.ts.net/' } };
  assert.equal(config.load(home(agent)).phoneHost, 'laptop.example-tailnet.ts.net');
  assert.equal(config.load(home(agent, { phone: 'https://desk.example-tailnet.ts.net:8445/' })).phoneHost, 'desk.example-tailnet.ts.net');
  assert.equal(config.load(home({ door: { phone: null } }, { phone: 'Desk.Example-Tailnet.ts.net' })).phoneHost, 'desk.example-tailnet.ts.net');
  assert.equal(config.load(home({ door: { phone: null } })).phoneHost, null);
});

test('a phone address that cannot be read is refused', () => {
  assert.throws(() => config.load(home({}, { phone: 'https://' })), /"phone" in bryn\.config\.json must be an address/);
  assert.throws(() => config.load(home({}, { phone: '' })), /"phone" in bryn\.config\.json/);
});

test('the dashboard answers the phone host from the config and refuses a foreign one', async (t) => {
  const h = tempCfg();
  const server = start({ cfg: Object.assign({}, h.cfg, { phoneHost: 'desk.example-tailnet.ts.net' }), port: 0, pidFile: false, quiet: true });
  await new Promise((r) => server.once('listening', r));
  t.after(() => new Promise((r) => server.close(() => { h.cleanup(); r(); })));
  const port = server.address().port;
  assert.equal((await request(port, { path: '/health', host: 'desk.example-tailnet.ts.net:8445' })).status, 200);
  assert.equal((await request(port, { path: '/health', host: 'laptop.example-tailnet.ts.net:8445' })).status, 403);
  assert.equal((await request(port, { path: '/health', host: `127.0.0.1:${port}` })).status, 200);
});
