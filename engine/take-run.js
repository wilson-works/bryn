'use strict';

/**
 * engine/take-run.js — the runner for one headless run started from Bryn's dashboard (engine/take.js starts it
 * detached; on Windows through engine/detach.vbs, so it holds none of the dashboard's handles). Node built-ins only.
 * Louise's engine/research-run.js, for Bryn.
 *
 *   node engine/take-run.js <job file>
 *
 * The job file (<data>/take-job.json, written by take.js) holds { token, cwd, log, runFile, stageFile, program, args,
 * image } and nothing else: no environment, which this runner inherits instead. It starts the program with its output
 * appended to the log, in its own process group, and keeps the run file:
 *   { token, pid, runner, image, program, started, beat }   the heartbeat (beat) every 10 seconds while it runs
 *   + { ended, code, signal }                               when the program exits
 * When the program exits with her stage still on a working step (it stopped early), her stage goes to idle with a plain
 * note, so her dashboard never shows her on a trail that has gone quiet. `waiting` (the advice is in) is left alone.
 */

const fs = require('fs');
const { spawn } = require('child_process');
const stage = require('./stage');

const BEAT_MS = 10 * 1000;

function main() {
  let job;
  try { job = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); } catch (e) { return; }
  const note = (m) => { try { fs.appendFileSync(job.log, `[${new Date().toISOString()}] ${m}\n`); } catch (_) { /* no log */ } };
  const write = (obj) => {
    const tmp = `${job.runFile}.${process.pid}.tmp`;
    try { fs.writeFileSync(tmp, `${JSON.stringify(obj, null, 2)}\n`); fs.renameSync(tmp, job.runFile); } catch (_) {
      try { fs.writeFileSync(job.runFile, `${JSON.stringify(obj, null, 2)}\n`); fs.rmSync(tmp, { force: true }); } catch (__) { /* nothing more to do */ }
    }
  };
  const record = { token: job.token, pid: null, runner: process.pid, image: job.image, program: job.program, started: new Date().toISOString(), beat: null };

  let child;
  let out;
  try {
    out = fs.openSync(job.log, 'a');
    note(`Taking up the next question: ${job.program}`);
    child = spawn(job.program, job.args, { cwd: job.cwd, detached: true, stdio: ['ignore', out, out], windowsHide: true });
  } catch (e) {
    note(`The run could not start: ${e.message}`);
    write(Object.assign(record, { ended: new Date().toISOString(), error: e.message }));
    return;
  } finally {
    if (out != null) fs.closeSync(out);
  }

  let done = false;
  let timer = null;
  const finish = (code, signal, error) => {
    if (done) return;
    done = true;
    clearInterval(timer);
    write(Object.assign(record, { beat: new Date().toISOString(), ended: new Date().toISOString(), code, signal, error: error || undefined }));
    note(error ? `The run could not start: ${error}` : `The run ended (exit code ${code == null ? signal : code}).`);
    try {
      const own = stage.current(job.stageFile);
      if (own && stage.WORKING.has(own.stage)) {
        stage.set(job.stageFile, 'idle', { note: 'The run stopped before the question reached your call. The details are in take.log.' });
      }
    } catch (_) { /* her stage is a nicety here */ }
  };
  child.on('error', (e) => finish(null, null, e.message));
  child.on('exit', (code, signal) => finish(code, signal));
  if (!child.pid) return;
  record.pid = child.pid;
  record.beat = new Date().toISOString();
  write(record);
  timer = setInterval(() => { record.beat = new Date().toISOString(); write(record); }, BEAT_MS);
}

main();
