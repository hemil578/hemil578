#!/usr/bin/env node
// Read-only. Checks a reel.json against the format's rules and that every file it
// names exists. Exits 1 when any rule fails, so it can gate a render.
//
//   node scripts/retro-check.mjs <projectDir>

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const project = resolve(process.argv[2] || process.cwd());
let reel;
try { reel = JSON.parse(readFileSync(join(project, 'reel.json'), 'utf8')); }
catch (e) { console.error(`retro-check: cannot read ${project}/reel.json: ${e.message}`); process.exit(1); }

const t = reel.timeline || {};
const scenes = t.scenes || [];
const voice = t.voice || [];
const fails = [], warns = [];
const fail = m => fails.push(m), warn = m => warns.push(m);
const byId = id => scenes.find(s => s.id === id);
const startOf = {};
let clock = 0;
for (const s of scenes) { startOf[s.id] = clock; clock += s.dur || 0; }

// ---- structure ----------------------------------------------------------------
for (const id of ['gulp', 'phone', 'phone-in', 'device', 'smug', 'shock', 'end'])
  if (!byId(id)) fail(`missing the "${id}" scene`);
if (clock < 25 || clock > 50) warn(`${clock.toFixed(1)} s is outside the usual 30–45 s`);
if (byId('phone')?.in) fail(`"phone" has an "in" transition: the reveal must be a hard cut`);
if (byId('gulp') && byId('gulp').dur > 0.8) warn(`"gulp" is ${byId('gulp').dur} s, keep it about 0.6 s`);
if (voice.some(v => v.scene === 'gulp')) fail(`"gulp" has speech: it must be silent`);

const opens = scenes.filter(s => /^open\d/.test(s.id));
for (const s of opens) if (s.dur < 0.5 || s.dur > 2) warn(`"${s.id}" is ${s.dur} s, opening shots run about 0.8–1.7 s`);

// ---- motion: the rules the user had to correct by hand ------------------------
const PUSH_OK = /^(open\d+|promise|ecu|phone-in|shock|device)$/;
for (const s of scenes) {
  for (const c of s.chars || [])
    if (!c.still) fail(`"${s.id}": character "${c.id}" lacks still: true, idle motion reads as bubbling`);
  const moving = s.bg?.move && s.bg.move !== 'still' && (s.bg.amount ?? 1) !== 0;
  if (moving && s.chars?.length && !PUSH_OK.test(s.id))
    fail(`"${s.id}": background moves (${s.bg.move}) on a shot with characters, use "still"`);
  if (s.punch?.length) fail(`"${s.id}": has punch-in zooms, add a real shot instead`);
}

// ---- captions -----------------------------------------------------------------
if (t.captions?.on === false) warn('captions are off');
if (t.captions?.on && t.captions.style !== 'steady') fail(`captions.style is "${t.captions.style}", use "steady"`);
if (t.captions?.pill) fail('captions have a pill background, use outlined text only');
for (const s of scenes) if (s.captions?.pill) fail(`"${s.id}": captions have a pill background`);
for (const [i, v] of voice.entries()) {
  const name = `voice[${i}] (${v.scene})`;
  if (!byId(v.scene)) fail(`${name}: scene "${v.scene}" does not exist`);
  if (v.scene === 'end') continue;   // the end card shows its line as the headline, so it has no captions
  if (!v.phrases?.length) fail(`${name}: no phrases, captions will hop word by word`);
  if (!v.words) fail(`${name}: no words file, captions need real timings`);
}

// ---- demo ---------------------------------------------------------------------
const pics = byId('device')?.pics || [];
const taps = pics.filter(p => /tap/.test(p.src));
if (byId('device') && pics.length - taps.length < 2) fail('"device" needs at least 2 real app screens');
if (byId('device') && !taps.length) warn('"device" has no tap markers yet');

// ---- sound --------------------------------------------------------------------
if (!t.music?.file) fail('no music track');
if (t.sfx?.length) warn(`${t.sfx.length} sound effect(s): this format normally has none`);
if (t.music?.ramp?.length && byId('phone')) {
  const reveal = startOf.phone;
  const lift = t.music.ramp.find(([, db], i, r) => i > 0 && db === 0 && r[i - 1][1] > 0);
  if (!lift) warn('music.ramp has no drop to 0 dB, so the lift may not land on the reveal');
  else if (Math.abs(lift[0] - reveal) > 0.25) fail(`music lift at ${lift[0]} s misses the reveal at ${reveal.toFixed(2)} s`);
} else if (t.music?.file) warn('no music.ramp, check the lift lands on the reveal by ear');

// ---- files --------------------------------------------------------------------
const need = new Set();
for (const s of [...scenes, ...(t.cover ? [t.cover] : [])]) {
  if (s.bg?.src) need.add(s.bg.src);
  for (const c of s.chars || []) for (const p of c.poses || []) { need.add(p.src); if (p.open) need.add(p.open); }
  for (const p of s.pics || []) need.add(p.src);
}
for (const v of voice) { need.add(v.file); if (v.words) need.add(v.words); }
if (t.music?.file) need.add(t.music.file);
const missing = [...need].filter(f => f && !existsSync(join(project, f)));
if (missing.length) fail(`${missing.length} missing file(s): ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}`);

// ---- report -------------------------------------------------------------------
for (const m of fails) console.log(`FAIL  ${m}`);
for (const m of warns) console.log(`warn  ${m}`);
console.log(`\n${scenes.length} scenes, ${clock.toFixed(2)} s, reveal at ${(startOf.phone ?? 0).toFixed(2)} s: ${fails.length} failed, ${warns.length} warning(s)`);
console.log('This checks the rules, not the look. Still watch the frames and listen.');
process.exit(fails.length ? 1 : 0);
