# The template

Timings come from two finished reels. Scene ids match what `retro-scaffold.mjs` writes and `retro-check.mjs` reads.

## Beats

| Scene id | Length | On screen | Sound |
| --- | --- | --- | --- |
| `open1`…`openN` (extended) | 0.8–1.7 s each, about 8 s in all | 5–7 establishing shots: place, arrival, detail, face, eyes. The character is drawn into the shots | Deep narrator, tense music rising |
| `problem1`, `problem2` (extended) | about 7.5 s | Side characters state the problem in panic | Nervous delivery |
| `tease` | 2.25 s | Two-shot. Teller leans in, listener braces | Whisper, slowest line in the reel |
| `reaction` (core) | 1 s | Listener close-up with sweat | One worried word |
| `promise` (core) | up to 4.9 s | Extreme close-up on the teller's eyes over red speed lines. Slow push that surges on the last word | Slow build to the biggest word |
| `gulp` | 0.5–0.6 s | Listener swallows | No speech |
| `phone` | 2.2 s | **Hard cut.** Teller grins, holding a phone with the logo on its screen | Music lifts on the cut |
| `phone-in` | 0.45 s | Fast push into the phone | Demo voice begins |
| `device` | about 11 s | Hand-held phone with real screens and tap markers | Voiceover only |
| `smug` | 1 s | Teller, pleased | Groove |
| `shock` | 3.9–5.4 s | Listener's jaw dropped, face held for the full line | Gasp, then shouted amazement |
| `end` | about 4.3 s | App icon and download line. Headline eases in, holds about 1.5 s | Line at 0.9×, music fades |

The extended cut drops `reaction` and `promise`. The eyes shot in its opening does that job instead.

## Voice

| Role | Delivery | Processing |
| --- | --- | --- |
| Narrator | Deep, gravelly, unhurried | 1.08× |
| Teller | Accented English, smug, whispered in the tease | Pitched down: `asetrate=44100*0.86,aresample=44100,atempo=1.163`, then a bass and low-mid boost |
| Listener | Accented English. Worried, then shocked with an audible gasp | None |
| Demo lines | Teller's voice, moving quickly | About 1.12×, gaps about 0.1 s |
| End card | Teller or listener | About 0.9× |

- Use English with a Japanese accent for characters on screen.
- The emotion in the voice must match the face in that shot.
- Speed up overall and slow down only for the whisper, the big word, payoffs and the end card.

## Music

- Use one track. `music.gain` about −6, `duck` about 5.
- `ramp` adds dB over reel time. It raises the quiet intro, then returns to 0 at the lift and falls at the end:
  `[[0, 14], [lift - 0.1, 9], [lift, 0], [end - 1.5, 0], [end - 0.75, -7]]`
- Use no sound-effect stingers.

## Captions

Set `timeline.captions` to `{ "on": true, "y": 0.7, "size": 72, "style": "steady" }`.

- Give every `voice[]` entry `phrases`, so groups are whole phrases. A `/` forces a line break.
- Give key words `emphasis`, about 1.3–1.7. The one big word uses `{ "s": 1.9, "upper": true, "hold": 0.4 }`.
- Never use `pill`. Text is white with a dark outline.
- Move captions per scene to stay off faces, with `scenes[].captions.y`.

## Motion

- Every character has `still: true`. Only the mouth moves.
- Talking scenes use `bg.move: "still"` with a slight `blur` of 2–4.
- A push is allowed only on `open*`, `promise`, `phone-in`, and a slow one on `shock`.
- Pose changes happen on cuts. Use `in: dip` between shots of different framing and a bare cut on `phone`.

## Layout

- `safe` is `{ "top": 0.07, "bottom": 0.2, "right": 0.14 }`.
- In the demo, fit the screen with its status bar and header visible. Never crop the top.
- Fill spare space with the hand and sleeve, not a larger screen.
