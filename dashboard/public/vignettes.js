'use strict';

/*
 * dashboard/public/vignettes.js — which picture the trailhead shows while nothing is on the table, and when it changes.
 *
 * Contract:
 *   - Three idle vignettes, each a scene in art/: idle (Bryn on her rock with her tin cup), idle-trail (walking the
 *     red trail, deer and a moose far off) and idle-kayak (paddling down the stream).
 *   - On load the page shows one at random. Every ROTATE_MS it crossfades to one of the other two, but only while the
 *     stage is idle, the tab is visible, the scene is not paused, and the person has not asked for reduced motion.
 *   - Reduced motion: always the rock (the still the art direction was approved on), and no rotation.
 *   - No randomness of its own: the caller passes rand(), so the tests can drive it.
 * Plain browser script with no build step: app.js reads window.BrynVignettes. Node's tests require() the same file.
 */

(function (root) {
  const VIGNETTES = ['idle', 'idle-trail', 'idle-kayak'];
  const STILL = 'idle';
  const ROTATE_MS = 150000; // two and a half minutes: "every few minutes"

  /** The vignette for the first idle on this visit. `wanted` is a copy key from the address bar (?idle=kayak). */
  function first(opts) {
    const o = opts || {};
    if (o.reduced) return STILL;
    const asked = VIGNETTES.find((v) => key(v) === o.wanted);
    if (asked) return asked;
    const r = typeof o.rand === 'function' ? o.rand() : 0;
    return VIGNETTES[Math.min(VIGNETTES.length - 1, Math.floor(r * VIGNETTES.length))];
  }

  /** The next vignette: always a different one from `current`. */
  function next(current, rand) {
    const others = VIGNETTES.filter((v) => v !== current);
    const r = typeof rand === 'function' ? rand() : 0;
    return others[Math.min(others.length - 1, Math.floor(r * others.length))];
  }

  /** Whether the picture may change on its own right now. */
  function rotates(s) {
    const o = s || {};
    return o.stage === 'idle' && !o.reduced && !o.paused && !o.hidden;
  }

  /** The copy key for a vignette: idle -> rock, idle-trail -> trail, idle-kayak -> kayak. */
  function key(v) { return v === STILL ? 'rock' : String(v).replace(/^idle-/, ''); }

  const api = { VIGNETTES, STILL, ROTATE_MS, first, next, rotates, key };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BrynVignettes = api;
}(typeof window !== 'undefined' ? window : this));
