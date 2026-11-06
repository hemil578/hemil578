# Working in parallel with subagents

The main session is the director: it talks to the user, gets every choice and every cost OK, owns
`reel.json`, and makes the creative calls (timeline, motion, final check). Subagents do bounded jobs in
parallel and report back. No Agent tool in this environment? Do the same jobs in order yourself.

## Match the model to the job

1. **Background Bash** (`run_in_background: true`) for a command that needs no judgment: `doctor.sh`, a
   Codex script round, `words.py`, a render. No agent; no tokens.
2. **Subagent** when a job needs several steps plus looking at results (images, frames, music pages).
3. **Main session** for anything the user sees or decides, and for paid generation.

Always set `model` on every Agent call, by what the job needs, not by price alone: a cheap model on a job
that needs taste costs a redo, and Opus on a mechanical job is waste. Opus is only for the final cut.

| Model | Jobs |
| --- | --- |
| `haiku` | Mechanical work: sound-effect lookups (library and Envato, one cue each), `words.py` over many clips, file moves, contact sheets, re-running a fixed command list. |
| `sonnet` | Work that needs judgment or taste: image batches (generate, look, check, trim, mouth edits, remake drift), the music shortlist (hearing the brief in the track's mood, tempo and length), fixing a render error. |
| `opus` | The **final-cut agent** (one per reel, below): reviews everything the workers made and makes the final cut. |
| main (inherit) | Brief, style, script choice, voice choice, cost OKs, ElevenLabs/Fish calls, `reel.json`, delivery. |

## Hard limits

- **Never in a subagent:** asking the user, paid generation (ElevenLabs, Fish), computer use (FDM), the
  Envato **Download** button. The main session does these.
- **ElevenLabs/Fish:** one call at a time, main session only (parallel calls get 429; its widgets render only in main).
- **Codex:** at most 3 calls running at once across all agents. Three image agents means one call each at a time.
- **Chrome:** one agent at a time owns the user's Chrome. Open its own tab; close only that tab.
- **Renders:** at most 2 `render.mjs` at once (each runs a browser and ffmpeg).
- **Files:** each agent writes only to its own paths (named in the brief). Only the main session writes
  `reel.json`, except `timeline`, which the final-cut agent owns. Agents return what to record.
- **Choices still gate:** an agent may prepare work ahead (search, previews, free checks), but nothing is
  shown out of order and no stage is locked before the user chooses.

## Where to fan out

| When | Run in parallel |
| --- | --- |
| Tools check | First run only (no `tools.md` yet): `doctor.sh` in background Bash while the main session asks the brief. |
| Stage 2 | Codex script round in background Bash, while the main session prepares the style notes for showing. |
| Stage 3 | One Codex sheet per character, in background Bash (≤3 at once). |
| Stage 4 | Up to 3 `sonnet` image agents, each owning a slice of the image list (by character or by scene). Main builds the contact sheet when all return. |
| Stage 4 → 7 | Once the script is locked, a `sonnet` music agent shortlists tracks (library, Envato search, preview URLs with `music.mjs add`) while images are made. Results wait until Stage 7. |
| Stage 5 | Main generates lines one by one; each saved clip starts `words.py` in background Bash at once. |
| Stage 6 | A `haiku` agent checks the library and Envato for each cue while main does voices. |
| Stage 8 + 9 | Codex writes the post captions in background Bash while the final-cut agent works. |
| Stage 8 | The final-cut agent writes the timeline, renders the stills, reviews, renders the reel and its variants (2 at a time) and checks them. Main shows the result and gets approval. |

Send independent agents in one message so they run together. Do not also do an agent's job yourself; wait
for its report, then check its files before telling the user.

## Brief template

Every brief is the only context the agent has. Include:

```
Goal: <one job>, for the reel project at <absolute project path>.
Read: <files: reel.json keys, the sheet, references/prompts.md section>.
Tools: $S = ~/.claude/skills/reel-studio; <exact commands to use>.
Write only: <paths>. Do not touch reel.json.
Do not: ask the user, run paid generation, use computer use, press Envato Download, run more than <n> Codex calls at once.
Done when: <check, e.g. every PNG passes img.py check and matches the sheet>.
Return: one line per file (path, what it is, any problem), and the reel.json fields to record.
Work cleanly: reuse the skill scripts, no stray files, no copies of the same image.
Shell is zsh: `for t in $LIST` does not split a string; loop over explicit words (`for t in 0.5 2.0 6.0`).
```

## The final-cut agent (opus)

One agent at the end, above all workers. Workers report to the main session; the main session hands the
final-cut agent everything at once. It reviews with fresh eyes, then makes the cut.

Give it:
- The project path and `reel.json` (brief, style, locked script, characters, voices, music, tools).
- Every worker report (images, music, sound effects, frame notes) and any problems they flagged.
- `references/reel-json.md`, `references/motion.md` and the safe zones.

It does, in order:
1. **Review inputs.** Every image against the sheet (drift, soft edges, bad cutouts, wrong mouth edit);
   every voice clip has its `words.json` and matches its script line; music and effects are the licensed
   files; nothing is missing for the script. Fix what it can with the skill scripts and free Codex remakes
   (≤3 at once). List what it cannot fix.
2. **Write the timeline** into `reel.json.timeline` (the renderer reads it there). It owns that one key;
   it changes no other key in `reel.json`.
3. **Stills:** render the timeline with `--stills scene --safe` and `--frame t` at the hook, each cut and the
   end card. Fix and repeat until clean against `references/motion.md`.
4. **Final cut:** render the main reel and every variant (`--no-captions`, `--hook N`, `--cover`, and each
   feed size in `brief.sizes` with `--size`), 2 at a
   time. Check loudness (−14 LUFS, true peak under −1 dB) and frames of each output.
5. **Report:** the output paths, the review verdict per asset, what it changed and why, and anything that
   needs the user or paid generation (for example "line 3 needs a new take: wrong stress on *free*").

It never asks the user, never runs paid generation, never touches Chrome or computer use. If a fix needs
any of those, it stops at step 5 and says so; the main session gets the OK, does it, and sends the
final-cut agent back (SendMessage, same agent, context kept). The main session checks the outputs itself, then shows the user.

### Image agent (sonnet)

Give: the image list for its slice (file name, pose, scene, mouth edit yes/no), the approved sheet path, the
prompt templates (`references/prompts.md`), and the rules from SKILL.md Stage 4. It runs `codex.sh image`,
looks at every result against the sheet, runs `img.py check`, `img.py trim` and `img.py mouth`, and remakes a
drifted image up to 2 times before reporting it as a problem.

### Music agent (sonnet)

Give: the mood words, length, BPM range, and how many picks (5, its best first). It runs `music.mjs find`, then Envato
`search_music`, opens each candidate in its own Chrome tab, reads the preview URL and BPM, and runs
`music.mjs add`. It returns the ids with one line each (title, author, BPM, length, why it fits).
