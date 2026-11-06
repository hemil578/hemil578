# Motion rules

## The hook (0–2 s)

- Something moves in the first frame. Never open on a still, a logo or a fade from black.
- The hook text is on screen at `at: 0` with `slam` or `pop`, big (100–130 px), top third.
- One hit inside the first second: a `punch` zoom, a `shake`, a card popping in with a sound, a character
  dropping in. Put the sound effect on the same frame.
- The first line of voice starts by 0.3 s.

## Pace

- A change every 1–2 s: a new pose, a card, a text line, a camera punch or a cut. Nothing holds still
  longer than 2 s.
- Cuts land on the music's beat when they can (beat = 60 / BPM seconds).
- Scene transitions: `whip` for energy, `flash` for a reveal or a fix, `zoom` into the end card, a hard cut
  (no `in`) for comedy timing.

## Characters

- Characters and backgrounds are separate layers. The background moves (push, pull, pan); characters keep
  a soft idle sway, so the frame always breathes.
- Enter on a beat: `drop` for a surprise arrival, `rise` for the opening, `slide-*` when walking on,
  `pop` for the end card.
- A new pose on each new line or emotion, swapped on the word that motivates it.
- Only the speaking character's mouth moves. Turns follow the script order. Leave 0.1–0.2 s between lines.

## Text and cards

- On-screen text: 2–5 words, readable in under a second. The key word in `*accent*`.
- Never put text over a face. Keep it out of the top 7%, the bottom 20% and the right 14%.
- Cards (notifications, chats, buttons) enter with a sound effect on the same frame and float gently.
- One idea on screen at a time: hide the old card (`until`) before the next one arrives.

## End card

- Product name, one-line promise, one button with the CTA. Hold it at least 2 s.
- The main character returns happy. Music swells; it fades in the last second (`fadeOut`, `music.fade`).

## Check before the full render

`render.mjs <project> --stills scene --safe`, then `--frame t` at the hook, each cut and the end card.
Fix anything in a safe zone, any text over a face, any frame that is fully white or black.
