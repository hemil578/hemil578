# Log

What this skill got wrong, or nearly did, in real use. Newest first. An entry
moves into `SKILL.md` once the same thing happens twice.

---

## 2026-11-04: building the retro anime type

**Marketing screenshots carry their own phone.** A screen that looked plain had dark rounded corners and a camera
pill baked in. In the drawn phone they became dark wedges and a doubled pill. `hand_screen.py` now strips them.
Cutting by position erased the app's title, so it removes only shapes connected to a corner or the pill. The first
flood fill changed nothing and raised no error: `Image.fromarray` is read-only and the writes vanished. Count the
changed pixels when a fix appears to do nothing.

**The end card's app name stayed white.** The accent marks one word at a time, so `*Demo App*` did nothing. Star
each word.

**The engine in this repo lagged the installed one.** A timeline can use features an older engine silently ignores,
so a reel renders and looks wrong instead of failing. The copies were synced when this type moved in. When the
engine changes on one computer, bring the change back here.

## 2026-11-04 (a mobile app): the second retro anime reel, with a narrated opening

**"Why are the characters bubbling up and down?"** Nothing looked wrong in single frames. The engine's idle breath
and talking bob, plus a slow camera push, made flat cutouts jitter once played. Now every character is
`still: true` on a `still` background, and `retro-check.mjs` fails anything else.

**Punch-ins do not read as pace.** Asked for a faster cut, I added zooms on the talking shots and was told most
frames were pointless. What worked was the seven real shots at the start. Fast means more shots, not more camera.

**A second music track never blends.** A new, heavier track for the opening was too loud, not intense enough, and
fought the groove at the cut. Quieter test mixes didn't fix it. The original track, with its tense intro extended
so the lift still landed on the reveal, did.

**A stock track can pass every check and still be unavailable.** The picked library track showed "Subscribe to
download" only at the last step. Check you can download before offering a track as a pick.

**The story's main character was missing from the story's shots.** The narration named a character while the
frames showed an empty room and a plate. It looked fine as art and was wrong as a story. Draw them into those shots.

**Whisper smeared the narrator.** A slow, deep voice with long pauses got word timings that ran through the
silences, so captions led the voice. `ffmpeg silencedetect` showed the real gaps, and the words file was fixed by
hand. Check slow reads this way.

## 2026-11-03 (a mobile app): the first retro anime reel

**Forcing the script onto the audio made captions drift.** Time from what was actually said, not from `--text`.

**Hopping word-by-word captions and dark boxes looked cheap** next to the art. Now steady phrase groups in outlined
white, with key words big from the start and turning the accent colour when spoken.

**A blank phone in the reveal killed the moment.** The phone must already show the logo.

**A calm thumbs-up flattened the payoff.** The shocked face is held through the entire line.

**A phone home screen wasted the demo's first seconds.** Go straight into the app, fit like a real iPhone with the
status bar visible, and never crop the top.

## 2026-10-28 (CredibleAI): the end-to-end test

A full run, brief to final cut, on a 15 s two-character skit. What broke:

**`--hook 2` asked for a hook that did not exist.** The timeline numbered hooks
from `hooks[1]`, so the first alternative was unreachable and the error named an
index nobody had written. Scene 1 is hook 1 now, and `--hook N` reads
`hooks[N - 2]`. A hook also carries its own `voice` and `sfx`: swapping only the
picture left scene 1's line playing under the new opening.

**The open mouth smeared an eye.** `remouth` diffed the closed and open poses
inside a box, and the image model had moved the eye a few pixels between the
two, so the eye was pasted too. It now takes the connected dark region that
grows between the poses, seeded from the new pixels only, and fills its holes so
the tongue comes along.

**`fill_holes` returned the whole image, silently.** `ImageDraw.floodfill` on an
image made with `Image.fromarray` did nothing and raised nothing, so every pixel
counted as "inside". `.copy()` first.

**True peak passed before the encode and failed after it.** The limiter held
−1 dB in the WAV; AAC overshot to −0.8 dB. The render now measures the final MP4
and lowers the ceiling until it is under −1.

**Two renders at once wrote the same `mix.wav`.** One reel came out with the
other's audio. The mix is per output name now.

**Music picks in a browser tab were the wrong place.** The user wanted them in
the chat: clips sent as files play inline, then a picker with five options, the
recommendation preselected. Two options was too few to feel like a choice.

**Not everyone has Free Download Manager.** The browser's own downloader is the
default; FDM is optional.

**The tools check ran on every reel.** It runs once per computer and writes
`tools.md`; later runs read that file.
