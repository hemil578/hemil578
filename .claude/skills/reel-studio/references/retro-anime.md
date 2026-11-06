# Retro anime suspense: a reel type

A fixed format with a free story: a late-1970s TV anime suspense meme builds fake tension, then hard-cuts into a
warm hand-held demo of the real product and ends on a shocked reaction. The beats, look, sound and motion rules
stay the same. Only the world, the characters, the problem and the lines change, so **never ask for a story this
file already answers, and never reuse the lines of an earlier reel unless asked**.

Follow the stages in `SKILL.md`, with the changes below. Stages not named here run as written. Where this format
already fixes a choice, skip that stage's "five options" step.

Beat lengths, look, sound and voice settings: `references/retro-anime-template.md`. Prompts for every shot:
`references/retro-anime-prompts.md`.

## Stage 0: Brief

Skip the questions this format answers: length, style, hook variants and sound effects. Read what already exists
before asking anything: the product's repo for brand colours, font, logo and real screens, `cast.mjs list` for
saved characters, and any `reel.json` in the project, which means this is a revision. Real product screens are
required, because the demo can't use code-drawn cards or an AI mockup.

## Stage 2: Four slots and the lines (replaces the five scripts)

Propose these from what you read and ask only for what you can't work out. Ask in one message.

| Slot | Decide |
| --- | --- |
| **World** | One setting customers recognize, painted with no people in it |
| **Teller** | The confident one who knows the product. Reuse the saved face across reels |
| **Listener** | The worried one whose shock sells the payoff |
| **Problem** | One specific everyday pain. The demo must visibly solve exactly that |

Also choose the cut. **Core (about 31 s)** when the tease alone carries the idea. **Extended (about 42 s)** when
the story needs a narrated setting and a problem scene. Then scaffold:

```bash
node $S/scripts/retro-scaffold.mjs <project> --cut core|extended --app "App Name" --accent "#0E9F6E"
```

It writes `reel.json` with every scene already following the rules, and `SHOTS.md` listing every image to make. It
refuses to overwrite an existing `reel.json`.

Write the lines to the beat lengths and show them for approval before any image or voice. You write them yourself,
without the Codex script round. Rules:

- The tease is short enough to whisper in about 2 s, and the promise ends on one big word.
- Demo lines name real actions the viewer will see, one per screen, and describe only what the app really does.
- Read every line aloud in your head. Natural wording beats clever wording.
- No invented customers, numbers or claims the product can't back up.

## Stage 4: Images

Work through `SHOTS.md` using `references/retro-anime-prompts.md`, with the approved sheet attached to every call.
A character the narration talks about must appear in those shots.

### The hand-held phone

Make the hand once per teller, then composite real screens into it.

```bash
python3 $S/scripts/hand_screen.py images/hand-phone.png screens/*.png --out images/hand-screens
```

It keys out the green display, fits each screen with its status bar visible, removes any device frame baked into
the screenshot (`--raw` skips this), and writes `geometry.json` with the screen's position in the frame. Point the
timeline's `device.pics` at the files it writes. Use the geometry to place tap markers:

```
frame_x = screen.x0 + sx * (screen.x1 - screen.x0)
frame_y = screen.y0 + sy * (screen.y1 - screen.y0)
```

`sx` and `sy` are the tap target's position inside the screenshot, from 0 to 1. The scaffold copies the marker to
`images/ui-tap.png`. Show it for 0.18 s just before the screen changes. Use the same script with `--fit center` to
put the logo on the phone in the reveal pose, once for the closed-mouth image and once for the open-mouth image.

## Stage 5: Voices

Settings per role are in `references/retro-anime-template.md`. Speed-adjust each line, then run `words.py` on the
**final, speed-adjusted** file, without forcing the script text onto it. Listen for smeared timings: if
`ffmpeg silencedetect` disagrees with the word timings, fix the words file by hand.

## Stage 6: Sound effects

Skip it. This format normally has none.

## Stage 7: Music

One track for the whole reel: a tense, medium-slow intro that lifts into a warm retro groove. Set
`timeline.music.ramp` so the intro is audible under the opening and the lift lands exactly on the `phone` scene's
hard cut. For the extended cut, extend the intro rather than adding a second track. Check you can download a track
before offering it, and that the licence covers paid ads.

## Stage 8: Check, then render

Set each scene's `dur` from the voice timing and add `voice[]` with `phrases` and `emphasis`. Run the checker before
the stills, and fix every `FAIL`:

```bash
node $S/scripts/retro-check.mjs <project>
```

Then continue with Stage 8 as written. Check frames at the hook, each cut and the end card.

## When the user gives feedback

Change the one thing they named and re-render. Back up `reel.json` first as `reel.before-<change>.json`.

| They say | It usually means |
| --- | --- |
| "Bubbling", "shaking", "jumping" | Idle motion on a cutout. Set `still: true` and `bg.move: "still"` |
| "Make it fast paced" | Add real shots to the opening and shorten beats. Never add zooms |
| "Unnecessary zoom" | Remove the punch-in or the push on that talking scene |
| "Music doesn't blend" | Two tracks, or a level jump at the cut. Go back to one track |

## Keeping it original

Characters are invented for each brand. The prompts ask for the era's style, and never copy an existing anime or
film character.
