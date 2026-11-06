#!/usr/bin/env node
/*
  The local music and sound-effect library, so a track found once is never fetched again.
  Library: <skill>/library/<kind>/index.json, previews/<id>.m4a, full/<id>.wav   (kind = music | sfx)

  music.mjs find <words...> [--kind sfx]                       search the library (title, tags, mood, genre)
  music.mjs add <id> --preview <audio url> --title T --author A --url <envato page> [--bpm 120] [--tags "a,b"] [--length 56] [--kind sfx]
                                                               save Envato's free preview (watermarked) and the item's details
  music.mjs full <id> [<zip|wav|mp3>] [--kind sfx]             file the licensed download; with no file, takes the newest
                                                               .zip/.wav/.mp3 in ~/Downloads/reel-studio-downloads or ~/Downloads from the last 15 minutes
  music.mjs clips <project dir> <id...> [--kind sfx] [--cue c] clips to play in the chat → <project>/picks/<kind>/[<cue>/]N-<id>.mp3
                                                               (music 20 s, effects 4 s); --cue also joins them → picks/sfx/<cue>.mp3
  music.mjs use <id> <project dir> [--kind sfx]                copy the licensed file into the project and note the project
*/
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SKILL = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const pos = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--")));
const kind = opt("kind", "music");
const LIB = path.join(SKILL, "library", kind);
for (const d of ["previews", "full"]) fs.mkdirSync(path.join(LIB, d), { recursive: true });
const IDX = path.join(LIB, "index.json");
const lib = fs.existsSync(IDX) ? JSON.parse(fs.readFileSync(IDX, "utf8")) : [];
const save = () => fs.writeFileSync(IDX, JSON.stringify(lib, null, 1));
const get = (id) => lib.find((x) => x.id === id) || (() => { throw new Error(`${id} is not in the ${kind} library`); })();
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...args]);
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
const [cmd] = pos;

if (cmd === "find") {
  const q = pos.slice(1).map((w) => w.toLowerCase());
  const hits = lib.map((x) => ({ x, s: q.filter((w) => JSON.stringify([x.title, x.tags, x.mood, x.genre, x.author]).toLowerCase().includes(w)).length }))
    .filter((h) => !q.length || h.s).sort((a, b) => b.s - a.s);
  for (const { x } of hits) console.log(`${x.id}\t${x.title} — ${x.author}\t${x.bpm ? x.bpm + " BPM\t" : ""}${x.length ? x.length + "s\t" : ""}${x.full ? "LICENSED" : "preview only"}\t${(x.tags || []).join(",")}\tused in: ${(x.projects || []).join(", ") || "-"}`);
  if (!hits.length) console.log("nothing in the library matches; search Envato");
} else if (cmd === "add") {
  const id = pos[1], src = opt("preview");
  if (!id || !src) throw new Error("add <id> --preview <audio url> ...");
  const ext = (src.match(/\.(m4a|mp3|wav|ogg)(\?|$)/) || [, "m4a"])[1];
  const f = path.join(LIB, "previews", `${id}.${ext}`);
  execFileSync("curl", ["-sfL", "-o", f, src]);
  const entry = lib.find((x) => x.id === id) || (lib.push({ id }), lib[lib.length - 1]);
  Object.assign(entry, { title: opt("title", entry.title), author: opt("author", entry.author), url: opt("url", entry.url),
    bpm: opt("bpm") ? +opt("bpm") : entry.bpm, length: +(opt("length") || dur(f).toFixed(1)), tags: opt("tags") ? opt("tags").split(",").map((s) => s.trim()) : entry.tags || [],
    mood: opt("mood", entry.mood), genre: opt("genre", entry.genre), preview: path.relative(LIB, f), added: entry.added || new Date().toISOString().slice(0, 10) });
  save(); console.log(`${id} preview saved: ${f}`);
} else if (cmd === "full") {
  const e = get(pos[1]);
  let src = pos[2];
  if (!src) {
    const dls = [path.join(os.homedir(), "Downloads", "reel-studio-downloads"), path.join(os.homedir(), "Downloads")].filter((d) => fs.existsSync(d)), now = Date.now();
    src = dls.flatMap((d) => fs.readdirSync(d).map((f) => path.join(d, f))).filter((f) => /\.(zip|wav|mp3|aif+)$/i.test(f) && now - fs.statSync(f).mtimeMs < 15 * 60e3)
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
    if (!src) throw new Error("no download in ~/Downloads/reel-studio-downloads or ~/Downloads from the last 15 minutes; pass the file");
  }
  let audio = src;
  if (/\.zip$/i.test(src)) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reel-zip-"));
    execFileSync("unzip", ["-o", "-q", src, "-d", tmp]);
    const files = execFileSync("find", [tmp, "-type", "f", "(", "-iname", "*.wav", "-o", "-iname", "*.mp3", "-o", "-iname", "*.aif*", ")", "-not", "-path", "*__MACOSX*"]).toString().trim().split("\n").filter(Boolean);
    if (!files.length) throw new Error(`no audio inside ${src}`);
    audio = files.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];   // the main mix is the biggest file
    e.zipFiles = files.map((f) => path.basename(f));
  }
  const f = path.join(LIB, "full", `${e.id}.wav`);
  ff(["-i", audio, "-c:a", "pcm_s16le", f]);
  Object.assign(e, { full: path.relative(LIB, f), fullName: path.basename(audio), length: +dur(f).toFixed(1), licensed: new Date().toISOString().slice(0, 10) });
  save(); console.log(`${e.id} licensed file saved: ${f} (from ${path.basename(src)} → ${path.basename(audio)})`);
} else if (cmd === "clips") {
  // short clips to play in the chat (SendUserFile), plus the details for the picker; with --cue, the clips are
  // also joined into one file that plays option 1, 2, 3… with a second of silence between them
  const proj = path.resolve(pos[1]), ids = pos.slice(2), cue = opt("cue"), out = path.join(proj, "picks", kind, cue || "");
  if (!ids.length) throw new Error("clips <project dir> <id...>");
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const picks = ids.map((id, n) => {
    const e = get(id), src = path.join(LIB, e.full || e.preview), len = dur(src);
    const clip = kind === "sfx" ? Math.min(len, 4) : Math.min(20, len), start = kind === "sfx" ? 0 : Math.max(0, Math.min(len * 0.15, len - clip));
    const f = path.join(out, `${n + 1}-${id}.mp3`);
    ff(["-ss", start.toFixed(2), "-t", clip.toFixed(2), "-i", src, "-af", `afade=t=in:d=${kind === "sfx" ? 0.01 : 0.2},afade=t=out:st=${Math.max(0, clip - (kind === "sfx" ? 0.3 : 1)).toFixed(2)}:d=${kind === "sfx" ? 0.3 : 1},aformat=sample_rates=44100:channel_layouts=stereo`, "-b:a", "160k", f]);
    return { n: n + 1, id, title: e.title, author: e.author, bpm: e.bpm, length: e.length && Math.round(e.length), licensed: !!e.full, file: f };
  });
  let joined;
  if (cue) {
    joined = path.join(path.dirname(out), `${cue}.mp3`);
    const inputs = picks.flatMap((p) => ["-i", p.file]), n = picks.length;
    const parts = picks.map((_, i) => `[${i}:a]apad=pad_dur=1[p${i}]`).join(";");
    ff([...inputs, "-filter_complex", `${parts};${picks.map((_, i) => `[p${i}]`).join("")}concat=n=${n}:v=0:a=1[a]`, "-map", "[a]", "-b:a", "160k", joined]);
  }
  console.log(JSON.stringify({ kind, cue, joined, picks }, null, 1));
} else if (cmd === "use") {
  const e = get(pos[1]), proj = path.resolve(pos[2]);
  if (!e.full) throw new Error(`${e.id} has no licensed file yet: download it through Envato, then run: music.mjs full ${e.id}`);
  const dst = path.join(proj, "audio", kind === "sfx" ? "sfx" : "", `${e.id}.wav`);
  fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(path.join(LIB, e.full), dst);
  e.projects = [...new Set([...(e.projects || []), path.basename(proj)])]; save();
  console.log(path.relative(proj, dst));
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
}
