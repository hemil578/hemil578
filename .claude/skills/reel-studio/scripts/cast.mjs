#!/usr/bin/env node
/*
  The local cast, voice and line library, so characters, voices and spoken lines are made once and reused in any
  later reel, for any product, without calling Codex, ElevenLabs or Fish again.
  Library: <skill>/library/cast/<name>/   cast.json, the sheet(s) and every pose image
           <skill>/library/voices/index.json, previews/<provider>-<id>.mp3    voice catalog seen so far
           <skill>/library/lines/index.json, <hash>.mp3 (+ .words.json)     generated lines, keyed by voice + model + text

  cast.mjs save <project dir> <char> [--look "one line"]       keep a character: sheet, poses and voice from reel.json
  cast.mjs list [words...]                                    saved characters (name, look, voice, poses, used in)
  cast.mjs use <name> <project dir> [--as <char>]              copy a saved character into a project and reel.json
  cast.mjs voices add <provider> <voices.json>                 merge a list_voices / search_voices result; previews kept locally
  cast.mjs voices find <words...> [--provider p]               search the saved catalog (name, gender, age, accent, tags)
  cast.mjs line get <provider> <voice id> <model> <text>       print the saved file for this exact line, or exit 1
  cast.mjs line add <provider> <voice id> <model> <text> <mp3> keep a generated line (and its .words.json if next to it)
*/
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SKILL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const LIB = path.join(SKILL, "library");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const pos = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--")));
const readJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const writeJSON = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(x, null, 1)); };
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const today = () => new Date().toISOString().slice(0, 10);
const [cmd, sub] = pos;

if (cmd === "save") {
  const proj = path.resolve(pos[1]), char = pos[2], reel = readJSON(path.join(proj, "reel.json"));
  const c = reel?.characters?.[char];
  if (!c) throw new Error(`reel.json has no characters.${char}`);
  const dir = path.join(LIB, "cast", slug(char)), old = readJSON(path.join(dir, "cast.json"), {});
  fs.mkdirSync(dir, { recursive: true });
  const refs = [c.sheet, c.poses].filter(Boolean).map((f) => { fs.copyFileSync(path.join(proj, f), path.join(dir, path.basename(f))); return path.basename(f); });
  const imgs = fs.existsSync(path.join(proj, "images")) ? fs.readdirSync(path.join(proj, "images")).filter((f) => f.startsWith(char + "-") && f.endsWith(".png")) : [];
  for (const f of imgs) fs.copyFileSync(path.join(proj, "images", f), path.join(dir, f));
  writeJSON(path.join(dir, "cast.json"), { ...old, name: char, look: opt("look", old.look || c.look || ""), sheet: c.sheet && path.basename(c.sheet),
    poseSheet: c.poses && path.basename(c.poses), poses: [...new Set([...(old.poses || []), ...imgs])], voice: c.voice || old.voice,
    projects: [...new Set([...(old.projects || []), path.basename(proj)])], added: old.added || today(), updated: today() });
  console.log(`${char} saved: ${dir} (${refs.length} sheet(s), ${imgs.length} poses, voice ${c.voice?.name || "none"})`);
} else if (cmd === "list") {
  const q = pos.slice(1).map((w) => w.toLowerCase()), dir = path.join(LIB, "cast");
  const all = fs.existsSync(dir) ? fs.readdirSync(dir).map((d) => readJSON(path.join(dir, d, "cast.json"))).filter(Boolean) : [];
  const hits = all.filter((c) => q.every((w) => JSON.stringify(c).toLowerCase().includes(w)));
  for (const c of hits) console.log(`${c.name}\t${c.look || "-"}\tvoice: ${c.voice ? `${c.voice.name} (${c.voice.id})` : "none"}\t${c.poses.length} poses\tused in: ${c.projects.join(", ")}`);
  if (!hits.length) console.log("no saved characters match");
} else if (cmd === "use") {
  const name = pos[1], proj = path.resolve(pos[2]), as = opt("as", name), dir = path.join(LIB, "cast", slug(name));
  const c = readJSON(path.join(dir, "cast.json"));
  if (!c) throw new Error(`no saved character ${name}; see cast.mjs list`);
  for (const d of ["ref", "images"]) fs.mkdirSync(path.join(proj, d), { recursive: true });
  for (const f of [c.sheet, c.poseSheet].filter(Boolean)) fs.copyFileSync(path.join(dir, f), path.join(proj, "ref", f));
  for (const f of c.poses) fs.copyFileSync(path.join(dir, f), path.join(proj, "images", f.replace(c.name + "-", as + "-")));
  const rf = path.join(proj, "reel.json"), reel = readJSON(rf, {});
  reel.characters = { ...reel.characters, [as]: { sheet: c.sheet && `ref/${c.sheet}`, ...(c.poseSheet && { poses: `ref/${c.poseSheet}` }), look: c.look, voice: c.voice, from: `cast/${slug(name)}` } };
  writeJSON(rf, reel);
  c.projects = [...new Set([...c.projects, path.basename(proj)])]; writeJSON(path.join(dir, "cast.json"), c);
  console.log(`${name} → ${as}: sheet in ref/, ${c.poses.length} poses in images/, voice ${c.voice?.name || "none"}`);
} else if (cmd === "voices" && sub === "add") {
  const provider = pos[2], src = readJSON(path.resolve(pos[3]));
  const list = Array.isArray(src) ? src : src.voices || src.items || [];
  const f = path.join(LIB, "voices", "index.json"), idx = readJSON(f, []), prev = path.join(LIB, "voices", "previews");
  fs.mkdirSync(prev, { recursive: true });
  let n = 0;
  for (const v of list) {
    const id = v.voice_id || v.id || v._id; if (!id) continue;
    const e = idx.find((x) => x.provider === provider && x.id === id) || (idx.push({ provider, id, added: today() }), idx[idx.length - 1]);
    Object.assign(e, { name: v.name || v.title || e.name, description: v.description || e.description,
      labels: v.labels || v.tags || e.labels, previewUrl: v.preview_url || v.sample_url || e.previewUrl });
    const local = path.join(prev, `${provider}-${id}.mp3`);
    if (e.previewUrl && !fs.existsSync(local)) { try { execFileSync("curl", ["-sfL", "-o", local, e.previewUrl]); e.preview = path.relative(path.join(LIB, "voices"), local); } catch {} }
    n++;
  }
  writeJSON(f, idx); console.log(`${n} voices merged; catalog has ${idx.length}`);
} else if (cmd === "voices" && sub === "find") {
  const q = pos.slice(2).map((w) => w.toLowerCase()), p = opt("provider");
  const idx = readJSON(path.join(LIB, "voices", "index.json"), []);
  const hits = idx.filter((v) => (!p || v.provider === p) && q.every((w) => JSON.stringify([v.name, v.description, v.labels]).toLowerCase().includes(w)));
  for (const v of hits) console.log(`${v.provider}\t${v.id}\t${v.name}\t${JSON.stringify(v.labels || {})}\t${v.preview ? path.join(LIB, "voices", v.preview) : "no local preview"}`);
  if (!hits.length) console.log("no saved voice matches; list voices from the provider, then: cast.mjs voices add");
} else if (cmd === "line") {
  const [, , provider, voice, model, text] = pos;
  const hash = crypto.createHash("sha1").update([provider, voice, model, text.trim()].join("\n")).digest("hex").slice(0, 16);
  const f = path.join(LIB, "lines", "index.json"), idx = readJSON(f, []), hit = idx.find((x) => x.hash === hash);
  if (sub === "get") {
    if (!hit) { console.log(`not saved (${hash})`); process.exit(1); }
    console.log(path.join(LIB, "lines", hit.file));
  } else if (sub === "add") {
    const src = path.resolve(pos[6]), dst = path.join(LIB, "lines", `${hash}.mp3`), words = src.replace(/\.mp3$/, ".words.json");
    fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst);
    if (fs.existsSync(words)) fs.copyFileSync(words, dst.replace(/\.mp3$/, ".words.json"));
    if (!hit) idx.push({ hash, provider, voice, model, text: text.trim(), file: `${hash}.mp3`, added: today() });
    writeJSON(f, idx); console.log(dst);
  }
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
}
