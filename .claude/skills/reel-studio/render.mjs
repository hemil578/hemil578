#!/usr/bin/env node
/*
  Renders a reel from <project>/reel.json → <project>/out/.
  Playwright steps engine/index.html through time, screenshots every frame into ffmpeg, then mixes the
  sound (voice, ducked music, sound effects) to -14 LUFS and muxes one MP4.

  node render.mjs <project>                    out/reel.mp4
  node render.mjs <project> --no-captions      out/reel-nocaptions.mp4
  node render.mjs <project> --hook 2           scene 1 and its voice/sfx swapped for timeline.hooks[0] → out/reel-hook2.mp4
  node render.mjs <project> --stills 0.5       contact sheet, one still every 0.5 s (or "scene") → out/review/
  node render.mjs <project> --frame 3.2        one PNG → out/review/frame-3.200.png (add --safe for the UI guide)
  node render.mjs <project> --cover            out/cover.png from timeline.cover
  node render.mjs <project> --audio-only       rebuild the sound onto the last picture (fast)
  --size 1:1 | 4:5     feed sizes (1080×1080, 1080×1350) from the same timeline; works with every command above and
                       suffixes the output: reel-1x1.mp4, reel-hook2-4x5.mp4, cover-1x1.png. Default 9:16.
                       timeline.sizes["1:1"] holds per-size overrides (see references/reel-json.md)
  flags: --workers 4  --safe (draw the UI zones for the size)  --keep (keep out/.work)
*/
import { createRequire } from "node:module";
import { spawn, execFileSync, spawnSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKILL = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const PROJECT = path.resolve(argv[0] || ".");
const flag = (n) => argv.includes("--" + n);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const FF = "ffmpeg";
const OUT = path.join(PROJECT, "out"), WORK = path.join(OUT, ".work"), REVIEW = path.join(OUT, "review");
for (const d of [OUT, WORK, REVIEW]) fs.mkdirSync(d, { recursive: true });
const ff = (args) => execFileSync(FF, ["-hide_banner", "-v", "error", "-y", ...args], { maxBuffer: 1 << 30 });

function playwright() {
  const tries = [process.env.PLAYWRIGHT, path.join(SKILL, "node_modules", "playwright")].filter(Boolean);
  for (const p of tries) { try { return require(p); } catch {} }
  throw new Error(`Playwright not found. Run: npm install --prefix "${SKILL}"`);
}

// ------------------------------------------------------------------ timeline
const reel = JSON.parse(fs.readFileSync(path.join(PROJECT, "reel.json"), "utf8"));
const TL = structuredClone(reel.timeline);
const hook = +opt("hook", 0);
if (hook) {
  // hook 1 is scene 1 as written; hook N is timeline.hooks[N - 2]
  if (hook < 2 || !TL.hooks?.[hook - 2]) throw new Error(`--hook ${hook}: timeline.hooks[${hook - 2}] does not exist (hook 1 is scene 1; hook 2 is hooks[0])`);
  // a hook brings its own picture, voice and sound effects; scene 1's voice and effects leave with it
  const { voice = [], sfx = [], ...scene } = TL.hooks[hook - 2], id = TL.scenes[0].id;
  TL.scenes[0] = { ...scene, id };
  TL.voice = [...(TL.voice || []).filter((v) => v.scene !== id), ...voice.map((v) => ({ ...v, scene: id }))];
  TL.sfx = [...(TL.sfx || []).filter((x) => x.scene !== id), ...sfx.map((x) => ({ ...x, scene: id }))];
}
// feed sizes: 1080 wide, no right-hand button column, a thin top and bottom margin
const SIZES = { "9:16": {}, "1:1": { h: 1080, sfx: "-1x1" }, "4:5": { h: 1350, sfx: "-4x5" } };
const SIZE = opt("size", "9:16");
if (!SIZES[SIZE]) throw new Error(`--size ${SIZE}: use 9:16, 1:1 or 4:5`);
const SFX = SIZES[SIZE].sfx || "";
if (SFX) { TL.w = 1080; TL.h = SIZES[SIZE].h; TL.safe = { top: 0.04, bottom: 0.06, left: 0.05, right: 0.05 }; }
// timeline.sizes[size]: top-level keys merge over the timeline, `scenes` patches scenes by id (arrays replace)
const ov = TL.sizes?.[SIZE] || {};
for (const [k, v] of Object.entries(ov)) if (k !== "scenes") TL[k] = { ...TL[k], ...v };
for (const [id, patch] of Object.entries(ov.scenes || {})) {
  const s = TL.scenes.find((x) => x.id === id); if (!s) throw new Error(`timeline.sizes["${SIZE}"].scenes.${id}: no such scene`);
  Object.assign(s, patch);
}
const W = TL.w || 1080, H = TL.h || 1920, FPS = TL.fps || 30;
const url = (p) => (p && !/^(https?:|data:|file:)/.test(p) ? pathToFileURL(path.resolve(PROJECT, p)).href : p);
let t = 0;
for (const s of TL.scenes) { s.start = t; s.end = t + s.dur; t = s.end; }
const DURATION = t;
const sceneT = Object.fromEntries(TL.scenes.map((s) => [s.id, s.start]));
const absAt = (x) => (x.scene ? sceneT[x.scene] : 0) + (x.at || 0);
for (const s of TL.scenes) {
  if (s.bg?.src) s.bg.src = url(s.bg.src);
  for (const c of s.chars || []) for (const p of c.poses) { p.src = url(p.src); p.open = url(p.open); for (const o of p.over || []) o.src = url(o.src); }
  for (const p of s.pics || []) p.src = url(p.src);
  for (const c of s.cards || []) if (c.icon && /\.(png|jpe?g|webp|svg)$/i.test(c.icon)) c.icon = url(c.icon);
}

// ------------------------------------------------------------------ voice → mouth flaps and caption words
const SR = 16000;
const decodeMono = (file) => { const b = ff(["-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"]); return new Float32Array(b.buffer, b.byteOffset, b.length >> 2).slice(); };
const clipLen = (file) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim();
const N = Math.ceil(DURATION * FPS) + 1;
const mouth = {};
const words = [];
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
for (const v of TL.voice || []) {
  const file = path.resolve(PROJECT, v.file), at = absAt(v);
  const pcm = decodeMono(file), hop = SR / FPS;
  const rms = []; for (let i = 0; i * hop < pcm.length; i++) { let s = 0, n = 0; for (let j = Math.max(0, Math.round((i - 0.5) * hop)); j < Math.min(pcm.length, Math.round((i + 1.5) * hop)); j++) { s += pcm[j] * pcm[j]; n++; } rms.push(Math.sqrt(s / Math.max(1, n))); }
  const peak = Math.max(...rms), gate = peak * 0.14;
  const m = (mouth[v.char] ||= Array(N).fill("-"));
  // the mouth opens and shuts at an uneven 2-4 frame rhythm while the voice is loud, and stays shut in pauses
  let open = false, hold = 0;
  rms.forEach((r, i) => {
    const f = Math.round(at * FPS) + i; if (f < 0 || f >= N) return;
    if (r < gate) { m[f] = "0"; open = false; hold = 0; return; }
    if (hold-- <= 0) { open = !open; hold = 1 + Math.floor(rnd() * 3); }
    m[f] = open ? "1" : "0";
  });
  if (v.words) {
    const ws = JSON.parse(fs.readFileSync(path.resolve(PROJECT, v.words), "utf8"));
    // voice[].emphasis: { word: scale | { s, upper, hold } } (word lower-case, no punctuation) makes it a big caption word
    const nrm = (x) => x.toLowerCase().replace(/[^a-z0-9']/g, "");
    // voice[].phrases: ["Let me tell you / one thing, bro.", ...] fixes the caption groups of this line; tokens map 1:1 onto
    // the words in order ("/" is a line break and is not a token) and their text is what is shown
    let ph = null;
    if (Array.isArray(v.phrases)) {
      ph = []; let br = false;
      v.phrases.forEach((p, pi) => p.split(/ +/).filter(Boolean).forEach((tk) => { if (tk === "/") br = true; else { ph.push({ id: `${TL.voice.indexOf(v)}.${pi}`, tk, br }); br = false; } }));
      if (ph.length !== ws.length) { console.warn(`voice ${v.file}: phrases have ${ph.length} words, words.json has ${ws.length}; ignoring phrases`); ph = null; }
    }
    ws.forEach((w, i) => {
      let em = v.emphasis?.[nrm(w.w)];
      if (typeof em === "number") em = { s: em };
      const txt = ph ? ph[i].tk : w.w.replace(/\.\.\.$/, "\u2026");
      words.push({ w: em?.upper ? txt.toUpperCase() : txt, a: at + w.a, b: at + w.b, le: at + ws[ws.length - 1].b, char: v.char, ...(em ? { em } : {}), ...(ph ? { ph: ph[i].id, br: ph[i].br } : {}) });
    });
  }
}
for (const k in mouth) mouth[k] = mouth[k].join("");
// caption groups: up to 3 words / 20 characters, broken at punctuation and at pauses over 0.35 s
const groups = [];
for (const w of words.sort((a, b) => a.a - b.a)) {
  const g = groups[groups.length - 1], last = g && g.words[g.words.length - 1];
  const len = g ? g.words.map((x) => x.w).join(" ").length + 1 + w.w.length : 0;
  const solo = (x) => x && x.em && x.em.s >= 1.8;   // a very big word gets a line of its own
  const shotOf = (x) => TL.scenes.findIndex((s) => x.a >= s.start - 1e-6 && x.a < s.end);   // a group never spans a cut
  if (g && w.ph && last.ph) { if (w.ph !== last.ph || shotOf(w) !== shotOf(last)) groups.push({ a: w.a, b: w.b, words: [w] }); else { g.words.push(w); g.b = w.b; } continue; }
  if (!g || g.words.length >= 3 || len > 20 || w.a - last.b > 0.35 || /[.!?,:;]$/.test(last.w) || w.char !== last.char || solo(w) || solo(last) || shotOf(w) !== shotOf(last)) groups.push({ a: w.a, b: w.b, words: [w] });
  else { g.words.push(w); g.b = w.b; }
}
for (const g of groups) { const h = Math.max(0, ...g.words.map((w) => w.em?.hold || 0)); g.b += h; }   // hold a big word a beat longer
// a caption never outlives its line, never overlaps the next group, and is gone 2 frames before its shot ends
// (before a dip or dissolve starts), so no word is ever seen across a cut
groups.forEach((g, i) => {
  const sc = TL.scenes.find((s) => g.a >= s.start - 1e-6 && g.a < s.end) || TL.scenes[TL.scenes.length - 1];
  const nx = TL.scenes[TL.scenes.indexOf(sc) + 1], tr = nx?.in?.type ? (nx.in.d || 0.28) / 2 : 0;
  const cut = nx ? sc.end - tr - 2 / FPS : Infinity, le = Math.max(...g.words.map((w) => w.le ?? w.b));
  const next = groups[i + 1] ? groups[i + 1].a - 0.02 : Infinity;
  g.s = Math.max(g.a - 0.02, sc.in?.type === "dip" ? sc.start + (sc.in.d || 0.28) / 2 : -Infinity);   // not on the black of a dip
  const nextS = groups[i + 1] ? groups[i + 1].a - 0.02 : Infinity;
  // phrase groups stay up at least ~0.6 s and until their last word + 0.15 s, but never over the next group or a cut
  g.end = g.words[0].ph ? Math.min(Math.max(g.b + 0.15, g.a + 0.6), nextS, cut) : Math.min(g.b + 0.12, le, next, cut);
});
const capsOn = !flag("no-captions") && TL.captions?.on !== false;
const REEL = {
  w: W, h: H, fps: FPS, duration: DURATION, scenes: TL.scenes, mouth, brand: TL.brand || {}, safe: TL.safe || {},
  captions: { ...(TL.captions || {}), on: capsOn && groups.length > 0, groups }, fadeOut: TL.fadeOut || 0, showSafe: flag("safe"),
};

// ------------------------------------------------------------------ picture
async function openPage(R = REEL) {
  const { chromium } = playwright();
  const browser = await chromium.launch({ args: ["--force-color-profile=srgb", "--disable-lcd-text", "--font-render-hinting=none", "--hide-scrollbars", "--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { console.error("PAGE ERROR:", e.message); process.exitCode = 1; });
  page.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
  await page.addInitScript((r) => { window.REEL = r; }, R);
  await page.goto(pathToFileURL(path.join(SKILL, "engine", "index.html")).href);
  await page.evaluate(() => window.READY);
  return { browser, page, cdp: await page.context().newCDPSession(page) };
}
async function grab(w, t) {
  await w.page.evaluate((t) => new Promise((r) => { window.seek(t); requestAnimationFrame(() => requestAnimationFrame(() => r())); }), t);
  const { data } = await w.cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
  return Buffer.from(data, "base64");
}
async function renderVideo(file) {
  const total = Math.round(DURATION * FPS), workers = Math.min(+opt("workers", 4), total);
  const enc = spawn(FF, ["-hide_banner", "-v", "error", "-y", "-f", "image2pipe", "-c:v", "png", "-framerate", String(FPS), "-i", "-",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", String(FPS), "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  const ws = await Promise.all(Array.from({ length: workers }, () => openPage()));
  let next = 0, write = 0, flushing = false; const pending = new Map(); const t0 = Date.now();
  const flush = async () => {
    if (flushing) return; flushing = true;
    while (pending.has(write)) { const b = pending.get(write); pending.delete(write); if (!enc.stdin.write(b)) await once(enc.stdin, "drain"); write++; }
    flushing = false;
  };
  await Promise.all(ws.map(async (w) => {
    for (;;) {
      const i = next++; if (i >= total) break;
      pending.set(i, await grab(w, i / FPS)); await flush();
      while (i - write > 48) await new Promise((r) => setTimeout(r, 4));
    }
  }));
  await flush(); enc.stdin.end(); await once(enc, "close");
  await Promise.all(ws.map((w) => w.browser.close()));
  console.log(`picture: ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

// ------------------------------------------------------------------ sound
function loud(file) {
  const s = spawnSync(FF, ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { maxBuffer: 1 << 28 }).stderr.toString();
  const tail = s.slice(s.lastIndexOf("Summary:"));
  const num = (re) => { const m = re.exec(tail); return m ? +m[1] : NaN; };
  return { I: num(/I:\s+(-?[\d.]+) LUFS/), TP: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}
function buildAudio(file, ceiling = -2) {
  const inputs = [], chains = [], report = {};
  const add = (f, pre = []) => { inputs.push(...pre, "-i", path.resolve(PROJECT, f)); return inputs.filter((x) => x === "-i").length - 1; };
  const D = DURATION.toFixed(3);
  // every input is padded/trimmed to exactly the reel length before any amix or sidechain: unbounded inputs
  // (apad with no length) made ffmpeg spin for over an hour on some clips
  // voice bus: every clip at its time, levelled by a gentle compressor
  const vs = (TL.voice || []).map((v) => { const i = add(v.file); chains.push(`[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${v.gain || 0}dB,adelay=${Math.round(absAt(v) * 1000)}:all=1,apad=whole_dur=${D},atrim=0:${D}[v${i}]`); return `[v${i}]`; });
  if (vs.length) chains.push(`${vs.join("")}amix=inputs=${vs.length}:normalize=0:duration=first,atrim=0:${D},acompressor=threshold=0.08:ratio=3:attack=5:release=120:makeup=1,asplit=2[voice][key]`);
  // music.ramp: [[t, dB], ...] extra gain over reel time, linear between keys and held past the ends
  const rampExpr = (k) => {
    if (!k?.length) return "";
    let e = `${k[k.length - 1][1]}`;
    for (let j = k.length - 2; j >= 0; j--) {
      const [t0, g0] = k[j], [t1, g1] = k[j + 1];
      e = `if(lt(t,${t1}),${g0}+(${g1 - g0})*(t-${t0})/${t1 - t0 || 1},${e})`;
    }
    return `volume='pow(10,(if(lt(t,${k[0][0]}),${k[0][1]},${e}))/20)':eval=frame,`;
  };
  // music: from `offset` into the track, ducked ~10 dB under the voice, faded out at the end
  const M = TL.music;
  if (M?.file) {
    const i = add(M.file);
    const fade = M.fade || 1.2;
    chains.push(`[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=start=${M.offset || 0},asetpts=PTS-STARTPTS,apad=whole_dur=${D},atrim=0:${D},volume=${M.gain == null ? -6 : M.gain}dB,${rampExpr(M.ramp)}afade=t=in:d=0.05,afade=t=out:st=${(DURATION - fade).toFixed(3)}:d=${fade}[mus]`);
    if (vs.length) chains.push(`[mus][key]sidechaincompress=threshold=0.02:ratio=${M.duck || 6}:attack=15:release=350:makeup=1[music]`);
    else chains.push(`[mus]anull[music]`);
  }
  const xs = (TL.sfx || []).map((x) => { const i = add(x.file); chains.push(`[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${x.gain == null ? -4 : x.gain}dB,adelay=${Math.round(absAt(x) * 1000)}:all=1,apad=whole_dur=${D},atrim=0:${D}[x${i}]`); return `[x${i}]`; });
  const bus = [vs.length ? "[voice]" : "", M?.file ? "[music]" : "", ...xs].filter(Boolean);
  if (!bus.length) { ff(["-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo`, "-t", D, file]); return { silent: true }; }
  chains.push(`${bus.join("")}amix=inputs=${bus.length}:normalize=0:duration=first,atrim=0:${D}[mix]`);
  const pre = path.join(WORK, `${name}-mix.wav`);
  ff([...inputs, "-filter_complex", chains.join(";"), "-map", "[mix]", "-ar", "48000", "-c:a", "pcm_f32le", pre]);
  // master: one gain to -14 LUFS; the limiter caps sample peaks at `ceiling`, below -1 dB because AAC adds inter-sample peaks
  let gain = -14 - loud(pre).I, res;
  for (let k = 0; k < 3; k++) {
    ff(["-i", pre, "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=${Math.pow(10, ceiling / 20).toFixed(4)}:attack=4:release=60:level=false`, "-c:a", "pcm_s24le", file]);
    res = loud(file); if (Math.abs(res.I + 14) < 0.2) break; gain += -14 - res.I;
  }
  report.master = res;
  return report;
}

// ------------------------------------------------------------------ run
const name = (hook ? `reel-hook${hook}` : flag("no-captions") ? "reel-nocaptions" : "reel") + SFX;
if (opt("frame")) {
  const t = +opt("frame"), w = await openPage(), f = path.join(REVIEW, `frame-${t.toFixed(3)}${SFX}.png`);
  fs.writeFileSync(f, await grab(w, t)); await w.browser.close(); console.log(f); process.exit(process.exitCode || 0);
}
if (opt("stills")) {
  const step = opt("stills"), times = [];
  if (step === "scene") for (const s of TL.scenes) times.push(s.start + Math.min(s.dur * 0.6, s.dur - 0.05));
  else for (let x = 0; x < DURATION; x += +step) times.push(x);
  const w = await openPage(), dir = path.join(WORK, "stills");
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i++) fs.writeFileSync(path.join(dir, `${String(i).padStart(4, "0")}.png`), await grab(w, times[i]));
  await w.browser.close();
  const cols = Math.min(6, times.length), rows = Math.ceil(times.length / cols), f = path.join(REVIEW, `sheet-${name}.jpg`);
  ff(["-framerate", "1", "-i", path.join(dir, "%04d.png"), "-vf", `scale=270:${Math.round(270 * H / W)}:flags=lanczos,tile=${cols}x${rows}:padding=4:color=0x202020`, "-frames:v", "1", "-q:v", "3", f]);
  console.log(f, times.map((x) => x.toFixed(2)).join(" ")); process.exit(process.exitCode || 0);
}
if (flag("cover")) {
  if (!TL.cover) throw new Error("timeline.cover is missing (a scene object, with optional `at`)");
  const c = { ...TL.cover, id: "cover", start: 0, end: TL.cover.dur || 2, dur: TL.cover.dur || 2 };
  if (c.bg?.src) c.bg.src = url(c.bg.src);
  for (const ch of c.chars || []) for (const p of ch.poses) { p.src = url(p.src); p.open = url(p.open); for (const o of p.over || []) o.src = url(o.src); }
  for (const p of c.pics || []) p.src = url(p.src);
  const w = await openPage({ ...REEL, scenes: [c], duration: c.dur, captions: { on: false }, mouth: {}, fadeOut: 0 });
  const f = path.join(OUT, `cover${SFX}.png`); fs.writeFileSync(f, await grab(w, TL.cover.at ?? 1.2)); await w.browser.close();
  console.log(f); process.exit(process.exitCode || 0);
}
const video = path.join(WORK, `${name}-video.mp4`), audio = path.join(WORK, `${name}-audio.wav`), final = path.join(OUT, `${name}.mp4`);
if (flag("audio-only")) { if (!fs.existsSync(video)) throw new Error(`no picture yet at ${video}; render once without --audio-only`); }
else await renderVideo(video);
// the true peak is measured on the encoded file; if AAC pushed it over -1 dB, lower the ceiling and mux again
let rep, fin;
for (let ceiling = -2; ; ceiling -= 0.75) {
  rep = buildAudio(audio, ceiling);
  ff(["-i", video, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", DURATION.toFixed(3), "-movflags", "+faststart", final]);
  fin = loud(final);
  if (rep.silent || !(fin.TP > -1) || ceiling <= -4) break;
}
console.log(JSON.stringify({ file: final, duration: +DURATION.toFixed(3), captions: REEL.captions.on, captionGroups: groups.length, speakers: Object.keys(mouth), ...rep, final: fin }, null, 1));
if (!flag("keep")) fs.rmSync(path.join(WORK, `${name}-mix.wav`), { force: true });
