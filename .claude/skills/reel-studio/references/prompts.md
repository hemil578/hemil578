# Codex prompt templates

Fill the `<…>` parts, write the prompt to `prompts/<name>.txt`, then run it with `$S/scripts/codex.sh`.
Text prompts ask for JSON only, so the output can be parsed.

## Five scripts → `codex.sh text prompts/scripts.txt scripts/round-1.json`

```
You write short vertical video ads. Write 5 different scripts for this reel and return JSON only.

Product: <what it is, who it is for, what it does; only facts from the brief or repo>
Platform: <platform>, length <N> s, 9:16
Style: <chosen style>
Characters: <name: look and personality, one line each; or "none, voiceover only">
Call to action: <CTA words, offer, URL>
Must not: promise results the product cannot prove (leads, sales, rankings, money), invent customers,
present fiction as a real testimonial, use competitor names.

Rules:
- The first 2 seconds are a stop-the-scroll hook: a surprising line, a strong visual, or a question that
  makes the viewer need the next second. No slow intros, no logo first.
- Spoken lines short enough to say in the time: about 2.5 words per second.
- On-screen text is 2–5 words per beat and readable in under a second.
- End on the call to action and the product name.
- Each script takes a different angle.
- Fill the full <N> s, no more. Over 30 s: a beat every 3–6 s, a re-hook every 15–20 s (a new question or
  twist), and the call to action once mid-way as well as at the end.

JSON: {"scripts":[{"title":"","angle":"","hook":{"visual":"","line":"","onscreen":""},
"beats":[{"t":"0-2","visual":"","speaker":"","line":"","delivery":"[excited]","onscreen":"","sfx":""}],
"cta":"","policy_flags":["any line that could be read as an unproven claim or fake testimonial"]}]}
```

## Revision → `codex.sh text prompts/rev-N.txt scripts/round-N.json`

```
Here is a reel script as JSON:
<the script JSON>

Change it like this: <the user's words>.
Keep everything else the same, keep the same JSON shape, keep the hook in the first 2 seconds, and return
JSON only.
```

Hook variants: same as revision, with "Write 3 different hooks for this script. Keep the beats after the
hook unchanged. Return {"hooks":[{"visual":"","line":"","onscreen":""}]}."

## Character sheet → `codex.sh image prompts/sheet-<char>.txt ref/<char>-sheet.png`

```
Character reference sheet for <name>, <one-line role>. <look: age, build, hair, clothes, colours, props>.
Style: <e.g. clean bold cartoon, thick outlines, flat cel shading, warm palette>.
Show the same character: front view, three-quarter view, side view, back view, and 4 expressions (happy,
annoyed, surprised, talking). Plain white background, labels under each view, every view full body,
consistent proportions and colours. 16:9.
```

## One pose → `codex.sh image prompts/<char>-<pose>.txt images/<char>-<pose>.png ref/<char>-sheet.png`

```
Use the attached reference sheet. Draw exactly this character, matching face, proportions, clothes and
colours.
One single pose, full body, centred, large in the frame: <pose and expression, what the hands do, what they
hold, where they look>.
Transparent background (real alpha, no checkerboard, no floor, no shadow). No text. One character only, no
grid, no second view. Portrait 2:3.
```

## Background → `codex.sh image prompts/bg-<name>.txt images/bg-<name>.png ref/<any sheet>.png`

```
Background for a vertical 9:16 video, in the same art style as the attached sheet: <place, time of day,
mood>. No people, no characters, no text. Keep the lower middle open (characters will stand there) and keep
the top third simple (titles go there). Slightly wider than the frame on every side for camera moves.
The middle square must also work alone (1:1 and 4:5 versions crop the top and bottom).
```

## Open mouth → `codex.sh image prompts/<char>-<pose>-mouth.txt images/<char>-<pose>-mouthraw.png images/<char>-<pose>.png`

```
Edit the attached image. Change only the mouth: open it as if mid-word (a relaxed "ah" shape). Keep
everything else pixel-identical: pose, face, eyes, colours, outline, size, position, transparent background.
```

Then `python3 $S/scripts/img.py mouth images/<pose>.png images/<pose>-mouthraw.png images/<pose>-open.png`
so only the mouth area is taken from the edit.

## Post caption and hashtags → `codex.sh text prompts/post.txt scripts/post-1.json`

```
Write the post text for this reel, one version per platform, and return JSON only.

Product: <facts from the brief>
Reel: <the locked script: hook line and beats>
Call to action: <CTA words, URL>
Platforms: <from the brief, e.g. Instagram, TikTok, LinkedIn>
Must not: promise results the product cannot prove, invent customers, use competitor names.

Rules per platform:
- Instagram: first line is a hook (it shows before "more"), 2–4 short lines, the CTA, then 5–10 hashtags
  (mix broad and niche) on their own line. Note "link in bio" when a URL cannot be clicked.
- TikTok: one or two short lines, 3–5 hashtags, under 150 characters before the hashtags.
- YouTube Shorts: a title under 60 characters plus a 1–2 line description with the URL and 3 hashtags.
- Facebook: 1–3 plain sentences, the URL, at most 3 hashtags.
- LinkedIn: 3–5 short lines in a plain professional voice, the URL, 3 hashtags.
- X: under 250 characters including the URL and at most 2 hashtags.
Plain words, no em dashes, no emoji unless the brand uses them.

JSON: {"posts":[{"platform":"","title":"","caption":"","hashtags":["#…"],"first_comment":""}],
"policy_flags":["any line that could be read as an unproven claim"]}
```

## Cover → built in code from `timeline.cover` (no image call)

Use the reel's strongest frame: the hook line big in the top third, the main character(s) large, no UI. If the
scene needs a new pose, make it with the one-pose template.
