---
name: reel-studio
description: Make a short vertical video ad or reel (Instagram Reels, TikTok, YouTube Shorts, Facebook) for any product or idea, with cartoon or illustrated characters, motion drawn in code, voiceover, music, sound effects and captions. Scripts and images come from ChatGPT through the Codex CLI, voices and effects from ElevenLabs (Fish Audio as fallback), music from Envato. Includes ready-made reel types, such as a retro anime suspense meme that hard-cuts into a real product demo. Use when the user asks for a reel, a short, a TikTok, a video ad, a UGC-style ad, an animated promo, a retro anime reel or an anime meme ad.
---

# Reel Studio

A reel is made in stages. **Every stage ends with the user's choice; never start the next stage until they
have chosen.** Everything chosen goes into `<project>/reel.json` the moment it is chosen, so the work can be
picked up in a new session (read `reel.json` first and continue from its `stage`) and re-rendered after one change.

Paths below: `$S` = `~/.claude/skills/reel-studio`. Project folder: `<cwd>/reels/<slug>/` unless the user names one.

## Tools, and only these

| Job | Tool | Notes |
| --- | --- | --- |
| Scripts, revisions | ChatGPT via `$S/scripts/codex.sh text` | Uses the user's ChatGPT plan. No API key. |
| Images | ChatGPT via `$S/scripts/codex.sh image` | Built-in `image_gen` on the plan. Real transparent PNGs. No API key, no model choice. |
| Motion | Code only: `$S/engine` + `$S/render.mjs` | No video model is used, ever. |
| Voice, sound effects | ElevenLabs MCP (`creative_*` tools), Fish Audio MCP if ElevenLabs is unavailable | Audio only, never video. One call at a time (parallel calls get 429). |
| Caption timing | `$S/scripts/words.py` (whisper.cpp, local, free) | Claude cannot hear audio, so a tool times the words. |
| Music, fallback effects | Envato MCP (search) + the user's Chrome (signed in to Envato Elements) + `$S/scripts/music.mjs` | Library first, Envato second. |

**Money rule:** before ANY paid generation (ElevenLabs/Fish voice or effects), show what will be generated and
the estimated credits (`estimate_only: true` first), and wait for an explicit OK. Codex images and Envato
downloads are covered by the user's existing plans and need no extra OK.

Codex model: `codex.sh` passes `-m gpt-6-sol` (override with `REEL_CODEX_MODEL`). If the user's
`~/.codex/config.toml` sets a model the ChatGPT plan rejects, Codex fails with "model is not supported when using
Codex with a ChatGPT account"; tell them to set `model = "gpt-6-sol"` there.

## Library first

Everything made or found once is kept in `$S/library/` and reused before any paid or slow call:
characters with their sheet, poses and voice (`scripts/cast.mjs`), the voice catalog and every generated line
(`cast.mjs voices`, `cast.mjs line`), music and sound effects with their licensed files (`scripts/music.mjs`).
Recommend from the library when it fits the product; go to Codex, ElevenLabs, Fish or Envato only for what is
missing.

## Working in parallel

The main session directs: it talks to the user, gets every choice and cost OK, writes `reel.json`, and does
the timeline. Independent work runs at the same time, each on the model its job needs: background Bash for
plain commands, `haiku` for mechanical jobs, `sonnet` for jobs that need judgment (images, music picks),
`opus` only for the final cut. Always set `model` on every Agent call. Subagents never ask the user, never run paid
generation, never use computer use. At the end one `opus` **final-cut agent** gets everything the workers
made, reviews it all, writes the timeline, renders and checks the final cut (Stage 8). Limits: ElevenLabs/Fish one call at a time in main; Codex ≤3 at once in
total; one agent owns Chrome at a time; ≤2 renders at once. Where to fan out and the brief template:
`references/agents.md`.

## Before Stage 0 — Tools check (first run only)

1. **Local tools, once per machine.** If `$S/tools.md` exists and says "All command-line tools ready", skip
   this step: do not run anything. Otherwise run `$S/scripts/doctor.sh` (background Bash). It checks Codex
   (installed and signed in with ChatGPT), ffmpeg, Node, Python with Pillow and numpy, Playwright, whisper-cli
   and its model, and (optional) Free Download Manager, and writes the result with the date to `$S/tools.md`.
   Run it again only when a tool fails during a stage (for example "ffmpeg not found", or Codex says it is
   signed out), fix that tool, and the run rewrites `tools.md`.
2. **Connectors, when their stage needs them.** They can change between sessions, so they are not kept in
   `tools.md` and not checked up front. At the stage that uses one, look for it in your tool list (load deferred
   tools with ToolSearch first) and make one free call: ElevenLabs (`creative_list_voices`) or Fish Audio
   (`get_credit_balance`) at Stage 5, Envato (`search_music`) and Claude in Chrome (`mcp__claude-in-chrome__*`)
   at Stages 6–7. Skip even that when the library already covers the stage (saved voice and lines, licensed
   music and effects).
3. **A local tool is missing: say what you will install, then install it.** In one message, list each MISSING
   line from `doctor.sh` with the exact command that fixes it (from its output and `references/setup.md`),
   for example "ffmpeg is missing. I'm going to install it with `brew install ffmpeg`." Ask once for the whole
   list. On a yes, run the commands yourself (background Bash for long ones such as the Playwright browser or
   the whisper model), then run `doctor.sh` again until every line is OK; it rewrites `tools.md`. Two things
   stay with the user: a command that needs their password (`sudo`, installing Homebrew itself; give them the
   line to run) and `codex login` (they sign in with ChatGPT in the browser).
4. **A connector is missing: tell the user which one to connect.** Claude cannot connect one (it needs the
   user's sign-in). Name it, what it is for, and the exact steps from `references/setup.md`, for example:
   "Connect ElevenLabs for the voices: Settings → Connectors → ElevenLabs → Connect, then sign in. Tell me when
   it's done." Then check it with its free call and carry on. If the user has no account or does not want to
   connect it, use the fallback in step 5 and say what changes.
5. What each tool is needed for, so a missing one only blocks its stage:
   Codex → scripts and images (required). ElevenLabs → voice and effects; Fish Audio only if ElevenLabs is
   missing; with neither, the reel has no voiceover (say so). Envato + Chrome → music; without them, use the
   library or music the user supplies. Local tools → render (required).

## Stage 0 — Brief (ask everything in one message)

1. **Product or idea.** If the cwd is the product's repo, read it (README, landing copy, brand files, logo,
   colours, fonts) instead of asking. Read any brand or character "bible" the user points to.
2. **Platform and length.** Always ask how long the user wants it: anything from 10 s to 2 min. Suggest a length
   from `references/formats.md` (e.g. Reels ads 9–15 s, TikTok 15–21 s, Shorts 20–30 s, a demo or explainer
   30 s–2 min), but the user decides. Always 9:16, 1080×1920. Say what a longer reel costs: more lines (voice
   credits), more images and a longer render; the script, images, voice and music all scale to the chosen length.
3. **Captions** on (default) or off. Off means no captions at all.
4. **Hook variants** for A/B tests: 2–3 different openings on the same body? (optional)
5. **Call to action and end card:** offer, URL, button words. **Brand:** logo, colours, fonts (skip if found in the repo).
6. **Characters on camera** talking to the viewer, or voiceover only? Run `node $S/scripts/cast.mjs list` first
   and offer any saved characters (name, look, voice): a saved one brings its sheet, poses and voice, so it
   costs nothing to reuse.
7. **Where will it be posted?** One or more: Instagram, TikTok, YouTube Shorts, Facebook, LinkedIn, X. This sets
   the post caption and hashtags (Stage 9) and the suggested sizes.
8. **Sizes:** 9:16 (Reels, TikTok, Shorts; always made), plus 1:1 and/or 4:5 for feed posts. Suggest from the
   platforms (Instagram or Facebook feed → 4:5; LinkedIn or X → 1:1).
9. **Product screenshots or screen recordings?** Ask for them (files, a folder, or the live URL to capture). If
   the user has none, the product is shown with code-drawn cards (notifications, posts, buttons) instead.

Write `reel.json` with `stage: "style"` and the answers under `brief` (`platforms`, `sizes`, `screens`).

## Stage 1 — Style

Offer the style menu from `references/formats.md` (slideshow, UGC/talking head, cinematic, humor skit,
problem→solution, before/after, POV, listicle, explainer, product demo, testimonial, storytime, founder story,
trend/meme, kinetic type, green screen/reaction, day-in-the-life, retro anime suspense). Recommend two that suit the product. Save the choice.

**Retro anime suspense is a ready-made type** with its own beats, rules and tools. If the user asks for it, or
for a reel like an earlier one in this format, skip the menu and read `references/retro-anime.md` before going
further: it changes the stages from the brief onward.

## Stage 2 — Five scripts

Write the brief to `prompts/scripts.txt` from the template in `references/prompts.md` and run
`$S/scripts/codex.sh text prompts/scripts.txt scripts/round-1.json` (background Bash). Show all five compactly: title, hook line,
each beat's line and on-screen text, CTA, and any `policy_flags`. **Every script must open with a
stop-the-scroll hook in the first 2 seconds.** Rewrite flagged lines (no unproven claims, no invented
testimonials presented as real customers) before showing. The user picks one or asks for changes; send changes
back through Codex (`references/prompts.md` → revision) until they say it is final. If they asked for hook
variants, get 2–3 alternative hooks for the chosen script the same way. Save the locked script.

## Stage 3 — Characters: reference sheet

Saved characters picked in the brief: `node $S/scripts/cast.mjs use <name> <project>` copies the sheet, every
pose and the voice into the project and `reel.json`. Make only the poses this script needs that the character
does not have yet. For a new character, ask if they have a character sheet or action sheet (an image, a folder, or a claude.ai artifact link; read
artifacts with the Artifact tool and save their images into `ref/`). If not, make one per character with
Codex (`references/prompts.md` → character sheet; all characters at once in background Bash, ≤3), show it, and revise until approved. **No scene image is made
before the sheet is approved.** Record each character's look in `reel.json.characters`.

## Stage 4 — Images

From the locked script, list every image needed, then make them with Codex, passing the approved sheet
with every prompt (`codex.sh image <prompt> <out.png> ref/<sheet>`). Rules:

- **One pose per image, full size**, transparent background (ask for it; check with `img.py check`). Never pose
  grids: cells come out ~500 px and look soft when scaled.
- Backgrounds separately, 9:16, no people, with open space where characters will stand. Layers give parallax.
- For each pose of a character who speaks on camera, make an open-mouth edit of that same image
  (`references/prompts.md` → mouth), then `img.py mouth closed.png open.png pose-open.png` so only the mouth changes.
  If the open frame shows seams or a ghost of the old mouth, run `img.py remouth closed.png pose-open.png pose-open.png`:
  it fills the closed mouth with the face colour and pastes only the open-mouth shape.
- A pose that came out tilted can be levelled in the timeline with `rot` (degrees, per pose or per character)
  instead of a remake, when the tilt is the only problem.
- `img.py trim` every cutout.
- **Product shots:** use the screenshots or recordings the user gave in the brief (`pics` in the timeline; a
  long screenshot can scroll). With none, show the product with code-drawn cards (`cards`, `texts`). Never an AI
  mockup of the product's screens.
- Look at every image before using it. Remake any that drifts from the sheet.
- Split the image list across up to 3 `sonnet` image agents (by character or scene; `references/agents.md`),
  sent in one message. While they work, start a `sonnet` music agent on the Stage 7 shortlist (steps 1–3).
  Check their files yourself before showing anything.

Show the images as one contact sheet and get approval.

## Stage 5 — Voices (if anyone speaks)

A saved character already has its voice: skip the choice. For a new character, look in the saved catalog first
(`cast.mjs voices find <words>`); call the provider's list (`creative_list_voices`, filtered by gender, age,
accent, mood) only when the catalog has no good fit, and keep what it returns with `cast.mjs voices add
<provider> <result.json>`. Pick 3–4, send their previews (the local files from the catalog, or the free
`preview_url`s) and the user picks one voice per character.

Before generating, check every line with `cast.mjs line get <provider> <voice id> <model> "<text with tags>"`:
a line said before by that voice is reused for free. Show the voiceover plan (lines × voice, marking the reused
ones) and the credit estimate for the rest only, and wait for OK.
Generate one line per call with `eleven_v4` and the script's delivery tags (`[excited]`, `[whispers]`,
`[laughs softly]`…), `generations_count: 1`, then fetch each file's `full_res_url` with
`creative_get_generations` and save it to `audio/vo/NN-<char>.mp3`. Some ElevenLabs connectors are speech-only
and have no `creative_get_generations`; there `creative_get_flow_run_status` returns the file's `content_url`.
If one call fails with 429 `rate_limited` (nothing is charged), wait or retry the same line on another ElevenLabs
connector in the tool list; never send two calls at once. Then for every clip:
`python3 $S/scripts/words.py audio/vo/NN.mp3 audio/vo/NN.words.json --text "<the line>"`, in background Bash
as soon as each clip is saved, so timing runs while the next line generates. Then keep each new line:
`cast.mjs line add <provider> <voice id> <model> "<text with tags>" audio/vo/NN-<char>.mp3` (its words.json
goes with it). Start a `haiku` agent on the
Stage 6 library and Envato lookups at the same time.

## Stage 6 — Sound effects

List the cues from the script (a message arrives → notification ding or message pop; a tap → soft click; a
reveal → whoosh). For each cue, find 5 candidates and let the user pick in the chat (`references/picker.md`):
`music.mjs clips <project> <id×5> --kind sfx --cue <cue>` per cue, send the joined `picks/sfx/<cue>.mp3` files,
then one `show_widget` picker with a row of 5 per cue, your pick first, marked Recommended and selected.
Candidates come from the library first (`music.mjs find <words> --kind sfx`), then Envato. Otherwise ElevenLabs
`creative_generate_in_flow` with `node_type: "sfx"`, `model_id: "eleven_text_to_sound_v2"` (after the cost OK),
or Envato's sound effects (same flow as music, `--kind sfx`). Save to `audio/sfx/`. Run `music.mjs full` after
each download, before the next one: it files the newest download. Some Envato effects are packs of several
sounds; `full` keeps the biggest file in the zip, so when the cue matters, unzip it and pass the right file to
`full <id> <file> --kind sfx`. The download step (Stage 7 step 5) is the same for effects.

## Stage 7 — Music

If the music agent already shortlisted tracks during Stage 4, start at step 4 with its ids.

1. `node $S/scripts/music.mjs find <mood words>`: library tracks first.
2. Then the Envato MCP `search_music` (filters: mood, genre, tempo, `max_media_length`, `vocals_in_audio: "No Vocals"`).
   The track must run at least the reel's length from its offset; the render pads a short track with silence.
3. For each candidate, open its Envato page in the user's Chrome (Claude in Chrome), press play, read the
   preview URL with `document.querySelector('audio').currentSrc`, and pause. Read BPM and length from the page.
   `music.mjs add <id> --preview <url> --title … --author … --url … --bpm … --tags …`.
4. Offer exactly 5 tracks, your pick first, in the chat (`references/picker.md`): `music.mjs clips <project>
   <id×5>`, send the five clips with SendUserFile so they play in the chat, then one `show_widget` picker with
   the 5 options and your pick marked Recommended and already selected. Five more on request.
5. For the chosen track: press **Download** on its Envato page in Chrome. Elements licenses it automatically
   (no project name is asked; a "licensed" toast shows). By default the browser's own downloader saves the zip
   to `~/Downloads`; nothing else is needed. Wait until the file is there (`ls -t ~/Downloads | head`).
   **Only if the user has Free Download Manager (FDM)** catching browser downloads: the first time, its
   new-download dialog asks for a folder. Answer it with computer use (`request_access` for "Free Download
   Manager"): set `~/Downloads/reel-studio-downloads` and press Download. FDM then remembers the folder and later
   downloads save there with no dialog. Background clicks and typing do not reach FDM's dialog, so this needs
   full-screen control, and Chrome may cover the dialog: bring FDM to the front with `open_application` first.
6. `music.mjs full <id>` (takes the newest download from `~/Downloads` or `~/Downloads/reel-studio-downloads`), `music.mjs use <id> <project>`, then
   `music.mjs clips <project> <id>` and send the clip with SendUserFile so the user hears the licensed track in
   the chat before it goes in the reel.

## Stage 8 — The plan, then the render

Hand everything to the `opus` final-cut agent (`references/agents.md` → the final-cut agent): `reel.json`,
every worker report and flagged problem. It reviews all assets, fixes what it can for free, writes the
timeline into `reel.json.timeline` (the one key it owns; format: `references/reel-json.md`; motion rules:
`references/motion.md`), checks stills, renders every output and checks them. If it reports something that
needs the user or paid generation, get the OK, do it, and send the same agent back to finish. Check its outputs yourself. The commands it uses:

```bash
node $S/render.mjs <project> --stills scene --safe   # contact sheet with the platform UI zones drawn
```

On the sheet: nothing important in the bottom 20% or behind the right-side buttons, no text over faces,
the hook readable in the first second. Then show the user one page with the final script, the
images, the voice per character, the music and effects, the contact sheet and the final-cut agent's review,
and get approval. If the user wants changes, send them to the same final-cut agent. Its render commands:

```bash
node $S/render.mjs <project>                    # out/reel.mp4
node $S/render.mjs <project> --no-captions      # out/reel-nocaptions.mp4 (only when captions are on)
node $S/render.mjs <project> --hook 2           # each hook variant, with its own voice and sfx → out/reel-hook2.mp4
node $S/render.mjs <project> --cover            # out/cover.png, a designed cover from timeline.cover
node $S/render.mjs <project> --size 4:5         # each feed size from the brief → out/reel-4x5.mp4, out/reel-1x1.mp4
```

Feed sizes come from the same timeline; the final-cut agent checks frames at each size (`--frame t --size 4:5`)
and adds `timeline.sizes` overrides only where a scene needs them (`references/reel-json.md`).

Renders run 2 at a time. The render prints the final loudness (target −14 LUFS, true peak under −1 dB). Watch the result (frames at the
hook, each cut and the end card with `--frame t`) before sending it.

## Stage 9 — Post caption and hashtags

While the final cut renders, write the post text with Codex (`references/prompts.md` → post caption), one
version per platform from the brief, in background Bash. Rewrite any `policy_flags` line. Show the versions,
the user picks or asks for changes (same revision loop as the scripts), and save the final text to
`out/post.md` (one section per platform: title if any, caption, hashtags, first comment) and under
`reel.json.post`.

## Stage 10 — Deliver and keep

Send with SendUserFile: every MP4 (each size, each hook, no-captions), the cover and `out/post.md`. Then offer
to keep the characters for later reels (`cast.mjs save <project> <char> --look "…"` for each; poses, sheet and
voice). Lines, voices, music and effects are kept as they are made, so a later reel for any product starts
from the library and calls Codex, ElevenLabs, Fish or Envato only for what is new.

## Setup

See the tools check above, `scripts/doctor.sh` and `references/setup.md`.
