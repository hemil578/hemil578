# reel.json

One file per project. The top level records the choices; `timeline` drives the render. Paths are relative
to the project folder.

```json
{
  "title": "…",
  "stage": "brief | style | scripts | sheet | images | voices | sfx | music | render | done",
  "brief": { "product": "", "platform": "", "length": 15, "captions": true, "hookVariants": 2, "cta": "", "bible": "" },
  "style": "humor skit",
  "script": { "...the locked script JSON..." },
  "characters": { "dale": { "sheet": "ref/dale.jpg", "voice": { "id": "", "name": "" } } },
  "music": { "envato": "TRCFCAX", "title": "", "author": "" },
  "timeline": { "...below..." }
}
```

## timeline

| Key | Meaning |
| --- | --- |
| `w`, `h`, `fps` | 1080, 1920, 30 |
| `brand` | `{ accent, font }`: accent colours `*starred*` words, buttons and the current caption word |
| `safe` | `{ top: 0.07, bottom: 0.2, right: 0.14 }`. Text and cards centre left of the right zone |
| `captions` | `{ on, y, size, accent, style, pill, shadow }`. `style: "steady"` turns off the karaoke highlight: each group is laid out once with emphasis words at their final big size from the start (natural spacing, no reflow), words stay white, and an emphasis word turns accent when spoken with a tiny 1.0→1.08 pulse that settles in 0.15 s, and groups fade in/out over 0.08 s. `pill` (0..1) puts a dark rounded backing behind each line, `shadow` (0..1) a soft dark shadow; both can also be set per scene in `scenes[].captions`. Group by phrase with `voice[].phrases` (see `voice`); phrase groups stay up at least ~0.6 s and until their last word + 0.15 s. Words come from `voice[].words`. A caption group never spans a cut, never shows after its line ends or over the next group, is gone 2 frames before its shot's cut (before a dip or dissolve starts) and does not appear on the black half of a dip-in |
| `fadeOut` | seconds of fade to black at the end |
| `scenes` | in order; each has `dur`, start times are computed |
| `hooks` | alternative first scenes: scene 1 is hook 1, `hooks[0]` is `--hook 2`, `hooks[1]` is `--hook 3`. Same shape as a scene (`id` taken from scene 1), plus optional `voice` and `sfx` arrays (no `scene` key; times from the hook's start) that replace scene 1's voice and effects |
| `voice` | `[{ char, file, words, scene, at, gain, emphasis, phrases }]`: one clip per line; `char` drives that character's mouth. `phrases: ["Let me tell you / one thing, bro.", ...]` fixes the caption groups: tokens map 1:1 onto the words in order, their text is what is shown, and `/` forces a line break (ignored with a warning if the word counts differ). Tokens split on plain spaces only, so a no-break space (U+00A0) joins two shown words onto one spoken word's timing (e.g. `A\u00a0r-receipt,` for a stammer the transcript dropped) |
| `sfx` | `[{ file, scene, at, gain }]` (gain dB, default −4) |
| `music` | `{ file, offset, gain (dB, default −6), fade, duck (ratio, default 6), ramp }`. `ramp: [[t, dB], ...]` adds extra gain over reel time, linear between keys and held past the ends (e.g. lift a quiet intro: `[[0, 15], [6.5, 6.5], [12.5, 0]]`) |
| `cover` | one still scene for `--cover` |
| `sizes` | per-size overrides for `--size 1:1` and `--size 4:5` (below) |

Times inside a scene (`at`, `until`) are seconds from that scene's start. `x`, `y` are fractions of the frame.

## sizes

`render.mjs --size 1:1` (1080×1080) and `--size 4:5` (1080×1350) render the same timeline for the feed. The 9:16
layout carries over: x is remapped into the width left by the feed safe zones (no button column: 5% left and
right, 4% top, 6% bottom, which `--safe` draws), characters grow a little and text and cards shrink, so most
reels need no overrides. `timeline.sizes["1:1"]` (or `"4:5"`) is merged over the timeline for that size only:

```json
"sizes": { "1:1": {
  "captions": { "y": 0.7, "size": 60 },
  "safe": { "bottom": 0.1 },
  "scenes": { "hook": { "texts": [{ "at": 0, "text": "Wrong *tool!*", "style": "slam", "y": 0.08, "size": 110 }] } }
} }
```

- Top-level keys (`captions`, `safe`, `cover`, `brand`…) merge over the base object, key by key.
- `scenes` is keyed by scene id; each patch replaces those keys of the scene, so give the whole array
  (`texts`, `chars`, `cards`…) you change. A `--hook N` swap keeps scene 1's id, so its patch applies too.
- Outputs carry the size: `reel-1x1.mp4`, `reel-hook2-4x5.mp4`, `cover-1x1.png`, `frame-3.500-4x5.png`.

## scene

```json
{
  "id": "hook", "dur": 3.0,
  "in": { "type": "whip | slide | zoom | flash", "d": 0.35 },
  "bg": { "src": "images/bg.png" | "color": "#111" | "gradient": "radial-gradient(...)",
          "move": "push | pull | pan-left | pan-right | rise | still", "amount": 1 },
  "punch": [{ "at": 1.0, "z": 0.06 }],
  "shake": [{ "at": 1.0, "amount": 0.6 }],
  "flash": [2.0],
  "chars": [{
    "id": "dale", "x": 0.5, "base": 0.86, "h": 0.52, "flip": false, "sway": 1.2, "until": 2.8,
    "enter": { "type": "none | fade | drop | rise | slide-left | slide-right | slam | pop", "at": 0, "d": 0.5 },
    "exit": { "type": "fade | drop | rise | slide-left | slide-right | pop | none", "at": 2.5 },
    "poses": [{ "at": 0, "src": "images/dale-phone.png", "open": "images/dale-phone-open.png" }]
  }],
  "texts": [{ "at": 0, "until": 2, "text": "LAST POST:\n*MARCH.*", "style": "slam | pop | rise | type | ease",
              "y": 0.07, "size": 110, "color": "#fff", "stroke": 12, "bg": "#000a", "stagger": 0.09 }],
  "cards": [{ "at": 1, "until": 2.5, "kind": "notification | chat | chat-me | button | stat",
              "app": "Messages", "icon": "👵" | "images/icon.png", "iconBg": "#8e6bbf",
              "title": "Mom", "body": "…", "x": 0.46, "y": 0.29, "w": 0.78, "enter": "pop", "exit": "fade", "float": true }],
  "pics": [{ "src": "images/screen.png", "at": 0.3, "until": 3, "x": 0.46, "y": 0.45, "w": 0.6,
             "h": 0.5, "frame": "phone | shadow", "scroll": { "at": 0.6, "d": 2, "to": 1 },
             "enter": "rise", "exit": "fade", "float": true, "tilt": 4 }]
}
```

- `bg.zoom` frames the same background closer (a medium shot, e.g. 1.15), `bg.focus: [x, y]` is the point the
  camera zooms on (default the centre), and `bg.parallax: 1` locks the background to the characters so people
  sitting on a bench in the picture stay on it while the camera moves (default 0.6: the background lags).
- Text `style: "ease"` fades each word in and drifts it up gently over `d` seconds (default 0.9) for calm
  end cards.
- `captions: { y, size, em }` on a scene moves or resizes the captions for that scene only (off a face, under a big
  device); `em` scales how much emphasised words grow there (0.6 = 60% of their growth).
- `voice[].emphasis: { "word": 1.6, "forever": { "s": 1.9, "upper": true, "hold": 0.4 } }` (keys lower-case, no
  punctuation) makes those caption words grow to that size (with reflow) over ~0.12 s and stay big and in the
  accent colour; a word of 1.8x or more gets a caption line of its own, and `hold` keeps it up that much longer.
- `bg.curve: [[t, k, ease], ...]` replaces the move's default ease-in-out with keyed progress (k 0..1 of `amount`
  over scene time; ease `lin`, `io3`, `out3`, `in3` into each key), e.g. a slow push that surges on one word.
- `bg.blur` (px) blurs only the background picture, e.g. to soften it behind a tight insert.
- `chars[].path: [{at, x, base, h, rot, o, ease}]` moves a character (or a prop drawn as one) over time: a walk
  across the frame, a receipt flying out of a pocket, a heap that grows. Missing values carry over; `ease`
  (`lin` default, `out3`, `io3`, `soft`…) shapes the way into that key.
- `chars[].pop: false` (or `poses[].pop: false`) swaps poses without the springy pop: walk cycles (one pose
  every 1/8–1/10 s), quiet changes of expression. `poses[].dx`, `dy` (frame fractions) and `hs` (height
  scale) line up poses whose drawings sit differently.
- `chars[].xfade` (or `poses[].xfade`) crossfades every pose change over that many seconds (0.5–0.8 for slow,
  smooth changes; about 0.06 inside a walk cycle): the new pose fades in over the old one, then the old one fades
  out under it. `poses[].flip` mirrors one pose (a walk cycle drawn facing right, then a pose already facing left).
- `poses[].over: [{src, x, y, w, anchor, rot, slide}]` lays an image on a pose and moves with it (sway, breath,
  crossfade): a paper sticking out of a pocket. `x`, `y` are the anchor point as fractions of the pose image,
  `w` a share of its width; `anchor: "bottom"` (default) sticks up out of the anchor line, `"top"` hangs down
  from it; `slide: [{at, v}]` (scene time, v 0 hidden in the pocket … 1 fully out) slides it out or back in. Each segment eases in and out; a key with `ease: "linear"` makes the segment into it linear, so one eased curve sampled densely (say every 0.1 s) can carry across a cut into another shot without a jump. `unroll: true` (anchor top) keeps the paper's top end at the anchor and grows it downward instead, so its header shows first; `tuck` (fraction of its height) hides that much of the top inside the pocket. An unrolled paper gets a soft shadow under the pocket lip; `lip` sets its strength (0 to 1, default 0.55).
  Give each pose its own `over` positions so the paper stays on the pocket when the pose changes.
- `poses[].head: [x, y]` (the face centre as fractions of the pose image; an optional third value, the head
  height, also eases the scale): when both poses of a crossfade have it, the two layers slide so their heads sit
  on one point moving from the old head to the new one, so a pose change reads as a head turn, not two people.
  Overlays on the outgoing pose fade out in the first half of the crossfade.
- `in: { "type": "dip", "d": 0.4 }` dips through black between shots of different framing (no superimposed faces).
- `in: { "type": "fade", "d": 0.6 }` is a dissolve: the scene fades in over the one before.
- `sway` is the idle rock in degrees (0 = still). `still: true` removes all idle motion (breathing, talking bob, sway); the mouth still moves. `until` hides the character.
- `rot` is a fixed turn in degrees, on a pose (`poses[].rot`) or on the character (`chars[].rot`), to level a
  pose that came out tilted (positive = clockwise).
- `y` means different things: on `cards` and `pics` it is the **centre**; on `texts` and `captions` it is the **top**.
- `pics[].scroll.at: 0` starts the scroll at once (it defaults to 0.6 s only when left out).
- `pics[].h` crops a long screenshot to that share of the frame height; `scroll` then moves through it.
- `base` is where the feet sit (fraction of height), `h` the character's height (fraction of frame height).
- A pose with `open` flaps its mouth while that character's voice clip is loud; other characters stay closed.
- `*word*` in text is drawn in the accent colour.
- Default card width 0.78 and default x centre the card in the space left of the right safe zone.
