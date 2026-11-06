#!/usr/bin/env node
// Writes a new reel project whose timeline already follows the format: reel.json
// plus SHOTS.md, the list of images to make. Refuses to overwrite a reel.json.
//
//   node scripts/retro-scaffold.mjs <projectDir> --cut core|extended --app "App Name"
//        [--accent "#0E9F6E"] [--teller teller] [--listener listener] [--shots 5]

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };
const fail = msg => { console.error(`retro-scaffold: ${msg}`); process.exit(1); };

if (!argv[0] || argv[0].startsWith('--')) fail('usage: retro-scaffold.mjs <projectDir> --cut core|extended --app "App Name"');
const project = resolve(argv[0]);
const cut = opt('cut', 'core');
const app = opt('app', 'App Name');
const accent = opt('accent', '#0E9F6E');
const T = opt('teller', 'teller');
const L = opt('listener', 'listener');
const shots = Number(opt('shots', 5));

if (!['core', 'extended'].includes(cut)) fail('--cut must be core or extended');
if (!(shots >= 3 && shots <= 7)) fail('--shots must be 3 to 7');
if (existsSync(join(project, 'reel.json'))) fail(`${project}/reel.json already exists, nothing was changed`);

const WORLD = 'images/bg-world.png';
const DRAMA = 'images/bg-drama.png';

const char = (id, pose, { speaks = true, x = 0.5, base = 1.05, h = 0.68 } = {}) => ({
  id, x, base, h, still: true, sway: 0, pop: false, enter: { type: 'none' },
  poses: [{ at: 0, src: `images/${id}-${pose}.png`, ...(speaks ? { open: `images/${id}-${pose}-open.png` } : {}) }],
});
const still = (src, extra = {}) => ({ src, move: 'still', amount: 0, zoom: 1, focus: [0.5, 0.5], parallax: 1, ...extra });

const opening = () => {
  const each = +(8 / shots).toFixed(2);
  return Array.from({ length: shots }, (_, i) => ({
    id: `open${i + 1}`, dur: each, captions: { y: 0.13 },
    bg: { src: `images/shot-${i + 1}.png`, move: 'push', amount: 1.2, zoom: 1.05, focus: [0.5, 0.5], parallax: 1 },
  }));
};

const problem = () => ['problem1', 'problem2'].map((id, i) => ({
  id, dur: i ? 4.75 : 2.75, captions: { y: 0.15 },
  bg: still(WORLD, { zoom: 1.35, focus: [0.3, 0.35], blur: 4 }),
  chars: [char(`side${i + 1}`, 'panic', { base: 1.1, h: 0.76 })],
}));

const tease = {
  id: 'tease', dur: 2.25, captions: { y: 0.56 }, ...(cut === 'extended' ? { in: { type: 'dip', d: 0.2 } } : {}),
  bg: still(WORLD, { zoom: 1.08 }),
  chars: [
    char(L, 'listen', { x: 0.76, base: 1, h: 0.44 }),
    char(T, 'lean', { x: 0.25, base: 1, h: 0.48 }),
  ],
};
const reaction = {
  id: 'reaction', dur: 1, in: { type: 'dip', d: 0.2 }, captions: { y: 0.2 },
  bg: still(WORLD, { zoom: 1.2, blur: 3 }), chars: [char(L, 'listen', { base: 1.02, h: 0.66 })],
};
const promise = {
  id: 'promise', dur: 4.9, in: { type: 'dip', d: 0.2 }, captions: { y: 0.3 },
  bg: { src: `images/${T}-eyes.png`, move: 'push', amount: 2.2, zoom: 1, focus: [0.5, 0.74],
        curve: [[0, 0], [3.5, 0.3, 'lin'], [4.4, 1, 'out3']] },
};
const gulp = {
  id: 'gulp', dur: cut === 'core' ? 0.6 : 0.5, ...(cut === 'core' ? { in: { type: 'dip', d: 0.2 } } : {}),
  bg: still(DRAMA), chars: [char(L, 'gulp', { speaks: false })],
};
// focus: move it onto the phone in your own reveal pose, phone-in pushes into that point.
const phoneChar = () => char(T, 'phone', { x: 0.46, base: 1, h: 0.62 });
const phone = { id: 'phone', dur: 2.2, bg: still(WORLD), chars: [phoneChar()] };
const phoneIn = {
  id: 'phone-in', dur: 0.45, chars: [phoneChar()],
  bg: { src: WORLD, move: 'push', amount: 36.3, zoom: 1.08, focus: [0.16, 0.57], parallax: 1 },
};

const SCREENS = 4;
const HAND = { float: false, enter: 'none', exit: 'none', x: 0.46, w: 1.06389, y: 0.5644 };
const device = {
  id: 'device', dur: 10.9, in: { type: 'fade', d: 0.3 }, captions: { y: 0.765, size: 56, em: 0.6, shadow: 0.8 },
  bg: { src: WORLD, move: 'rise', amount: 0.4, zoom: 0.926, focus: [0.5, 0.5], parallax: 1, blur: 18 },
  pics: Array.from({ length: SCREENS }, (_, i) => ({
    src: `images/hand-screens/hand-${i + 1}.png`,
    at: +(i * 10.9 / SCREENS).toFixed(2),
    until: i === SCREENS - 1 ? null : +((i + 1) * 10.9 / SCREENS + 0.05).toFixed(2),
    ...HAND,
  })),
};
const smug = {
  id: 'smug', dur: 1, in: { type: 'dip', d: 0.2 },
  bg: still(WORLD, { zoom: 1.2, focus: [0.3, 0.5], blur: 2 }), chars: [char(T, 'smug', { speaks: false, x: 0.45, base: 1.02, h: 0.66 })],
};
const shock = {
  id: 'shock', dur: cut === 'core' ? 3.9 : 5.35, captions: { y: 0.2 }, shake: [{ at: 0.17, amount: 0.6 }],
  bg: { ...still(DRAMA), move: 'push', amount: 1.2, focus: [0.5, 0.45] }, chars: [char(L, 'shock', { speaks: false })],
};
const end = {
  id: 'end', dur: 4.29, in: { type: 'fade', d: 0.5 },
  bg: { gradient: 'radial-gradient(120% 70% at 46% 32%, #17483A 0%, #12241F 38%, #14181F 78%)' },
  pics: [{ src: 'images/logo.png', at: 0, x: 0.46, y: 0.3, w: 0.27, frame: 'appicon', enter: 'fade', float: true }],
  // The accent marks one word at a time, so star each word of the name.
  texts: [{ at: 0.15, text: `Download ${app.split(/\s+/).map(w => `*${w}*`).join(' ')}`, style: 'ease', d: 1, y: 0.43, size: 88, color: '#FBFBF9', stroke: 0, stagger: 0.14 }],
};

const scenes = cut === 'core'
  ? [tease, reaction, promise, gulp, phone, phoneIn, device, smug, shock, end]
  : [...opening(), ...problem(), tease, gulp, phone, phoneIn, device, smug, shock, end];

const reveal = +scenes.slice(0, scenes.indexOf(phone)).reduce((a, s) => a + s.dur, 0).toFixed(2);
const total = +scenes.reduce((a, s) => a + s.dur, 0).toFixed(2);

const reel = {
  title: app, stage: 'lines', type: 'retro-anime', cut,
  brief: { product: app, platforms: ['instagram'], sizes: ['9:16'], captions: true },
  slots: { world: '', teller: T, listener: L, problem: '' },
  timeline: {
    w: 1080, h: 1920, fps: 30,
    brand: { accent, font: "'Helvetica Neue',Arial,sans-serif",
             css: `.txt{letter-spacing:-.03em;font-weight:800}.pic.appicon{filter:drop-shadow(0 22px 40px rgba(0,0,0,.35))}.pic.appicon .clip{border-radius:27%}` },
    safe: { top: 0.07, bottom: 0.2, right: 0.14 },
    captions: { on: true, y: 0.7, size: 72, style: 'steady' },
    fadeOut: 0.3,
    scenes,
    voice: [],
    sfx: [],
    music: { file: 'audio/music.mp3', offset: 0, gain: -6, fade: 1.4, duck: 5,
             ramp: [[0, 14], [+(reveal - 0.1).toFixed(2), 9], [reveal, 0], [+(total - 1.5).toFixed(2), 0], [+(total - 0.75).toFixed(2), -7]] },
  },
};

// Every image the timeline names, in making order, with the prompt type to use.
const kinds = [
  [/^images\/bg-world/, 'Background'],
  [/^images\/bg-drama/, 'Tension backdrop'],
  [/shot-\d/, 'Establishing shot. Draw the character into any shot they appear in'],
  [/-eyes\.png$/, 'Extreme close-up on the eyes'],
  [/-open\.png$/, 'Open-mouth edit, then img.py mouth'],
  [/-phone\.png$/, 'Character pose: grin with phone. Add the logo with hand_screen.py --fit center'],
  [/hand-screens/, 'Made by hand_screen.py from images/hand-phone.png and a real screen'],
  [/logo\.png$/, "The product's real app icon"],
  [/images\//, 'Character pose'],
];
const files = new Set();
for (const s of scenes) {
  if (s.bg?.src) files.add(s.bg.src);
  for (const c of s.chars || []) for (const p of c.poses) { files.add(p.src); if (p.open) files.add(p.open); }
  for (const p of s.pics || []) files.add(p.src);
}
const rows = [...files].map(f => `| \`${f}\` | ${kinds.find(([re]) => re.test(f))[1]} |`);

mkdirSync(project, { recursive: true });
for (const d of ['images/hand-screens', 'audio/vo', 'prompts', 'ref', 'screens', 'out']) mkdirSync(join(project, d), { recursive: true });
copyFileSync(join(here, '../assets/ui-tap.png'), join(project, 'images/ui-tap.png'));
writeFileSync(join(project, 'reel.json'), JSON.stringify(reel, null, 2) + '\n');
writeFileSync(join(project, 'SHOTS.md'), `# Images to make: ${cut} cut, ${total} s

Approve the character sheets in \`ref/\` first. Prompts are in \`references/retro-anime-prompts.md\`.

| File | Prompt |
| --- | --- |
${rows.join('\n')}
| \`images/hand-phone.png\` | Hand holding the phone |
| \`screens/*.png\` | Real product screens, one per demo step |

The music lift is set to ${reveal} s, the start of the \`phone\` scene. Update \`music.ramp\` if scene lengths change.
`);
console.log(`scaffolded ${cut} cut, ${scenes.length} scenes, ${total} s: ${project}`);
console.log(`next: fill slots in reel.json, write the lines, then make the ${files.size + 2} images in SHOTS.md`);
