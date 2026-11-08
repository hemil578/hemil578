<div align="center">

# Smart Video Editor

**An AI editing skill that actually watches your footage**

It doesn't just stitch clips end to end. It looks at every clip first — what was filmed, which seconds are usable — then decides what to cut, in what order, at what pace, with which color grade and soundtrack.

English · [中文](./README.md)

</div>

---

## The problem this solves

You have 5 travel clips on your phone. You want one short vertical video for social media.

**What ordinary AI editing tools do**: read filenames → concatenate 1, 2, 3, 4, 5 → add a transition → apply a filter → export. They never know what's actually in your footage.

The result: the shaky blurry first 2 seconds stay in, the 8 seconds pointing at the same tree stay in, and your best 3 seconds get the same screen time as the throwaway shots.

**What this skill does**:

```
extract frames → understand each frame → score usability → cut the dead weight
→ reorder by narrative → tune pacing → pick a grade → add music → render
```

It knows the first 4 seconds of clip 3 are out of focus. It knows clips 1 and 4 show the same scene (so they shouldn't be adjacent). It knows the last clip has a person walking into frame (so it works as an ending).

---

## What makes it smart

### 1. It actually looks — it doesn't guess

Every clip is sampled at fixed intervals, and **each frame goes to a vision model**:

- What's the subject, what's the scene, is there a person
- How's the composition, is there a clear visual focus
- Any blur, out-of-focus, shake, overexposure, crushed blacks, lens obstruction, empty shot, mid-transition state
- An overall usability score of 1–5

Frame filenames encode the timestamp (`clip1__t3.5.jpg`), so visual judgments **map back to the timeline unambiguously** — if the frame at 3.5s is blurry, the cut starts exactly at 3.5s.

### 2. It makes choices — it doesn't keep everything

Given a 15-second clip where seconds 5–8.5 are nearly identical to the frame at 4.5s, it cuts them. **A segment can be technically flawless and still add zero information — keeping it only drags the pacing.**

In the real case below, 36.5 seconds of raw footage became 18.8 seconds, and every cut had a stated reason.

### 3. It orders by narrative — not by filename

With all the visual information in hand, it reorders by content logic:

| Structure | Approach |
|-----------|----------|
| Spatial | Wide establishing → medium → detail → subject/closing |
| Temporal | Chronological order of events |
| Emotional | Calm open → peak → settle and close |

One source clip can be split into multiple segments placed at different points, or dropped entirely.

### 4. Pacing and grading are judgments — not defaults

**Pacing**: 1.5–3 seconds per segment for short-form, 4–6 seconds for slower vlogs. Visually similar shots in a row get shortened automatically. With BGM, cut points land near the beat.

**Grading**: 9 presets, chosen by content — never a blanket default.

| Look | Best for |
|------|----------|
| `clean` | General purpose, slight contrast and sharpness lift, safest |
| `film` | Cinematic — medium contrast curve + subtle vignette + cool shadows |
| `warm` | Food, interiors, people, golden hour |
| `cool` | Cities, snow, rain, tech |
| `soft` | Japanese-style muted, gentle and airy |
| `vivid` | Landscapes, bright and lively, needs to grab attention |
| `fresh` | **Overcast / diffuse-light outdoors** — adds clarity without color casting, best for greenery |
| `bw` | Black and white |
| `none` | No grading |

### 5. It finds royalty-free BGM on its own

You don't have to supply music. It searches Pixabay Music, Free Music Archive (CC0), Incompetech, and Musopen, verifies the download is real audio, and caches it locally for reuse.

If nothing works out, it **renders a silent version first so you can see the edit**, plus concrete guidance for picking music yourself: style keywords, BPM range (matched to your cut density), mood description, minimum length, and where to look. Once you have a track, it re-renders in one pass — no re-analysis of the footage.

**It never scrapes copyrighted commercial music** from YouTube, Spotify, or streaming services — those get muted or throttled on social platforms.

### 6. Designed title cards

No system default fonts (they read instantly as "nobody designed this"). A bundled library of 15 free-for-commercial-use typefaces, chosen by the mood of the footage:

| Footage type | Typeface direction |
|--------------|-------------------|
| Sports, cycling, city walk, streetwear | Smiley Sans — oblique heavy, conveys speed |
| Landscapes, travel, healing, slow living | LXGW WenKai, Noto Serif SC — literary texture |
| Product, UI, data, tutorials | Noto Sans SC, Inter — clean and restrained |
| Daily life, casual, lighthearted | Chill Round Gothic, ZCOOL KuaiLe — approachable |
| Traditional Chinese aesthetics | Ma Shan Zheng — brush calligraphy |
| Latin / numerals only | Bebas Neue, Playfair Display |

7 entrance animations: `fade` / `fade-up` / `zoom-in` / `zoom-out` / `blur-in` / `typewriter` / `slide-left`

![Font preview](./docs/font-preview.png)

---

## When to use it

### ✅ Great fit

| Use case | Notes |
|----------|-------|
| **Short-form vertical video** | 15–30s vertical cuts with title cards and BGM |
| **Travel vlogs** | Scattered phone clips, auto-picks the good shots and orders them spatially |
| **Social posts** | Quick short film that doesn't look amateur |
| **Product demos** | Screen recordings cut into tight feature walkthroughs |
| **Landscape → vertical** | Detects subject position, picks crop or blur-pad automatically |
| **Uneven footage quality** | Automatically drops blurry, shaky, and empty shots |

### ❌ Not a fit

- **AI video generation** — this is a pure editing tool, no text-to-video
- **Frame-accurate professional editing** — judgments come from sampled frames; use Final Cut / Premiere for frame precision
- **Complex VFX or compositing** — only basic grading, transitions, and speed changes
- **Removing filler words from talking-head video** — no ASR
- **Long videos (>5 min)** — frame extraction and vision analysis costs climb noticeably

---

## Real case: Green Gaps in the City

> 5 phone-shot cycling clips (36.5s total) → one 18.8s vertical cut

![Result frames](./examples/cycling-greenway/storyboard.jpg)

### The footage

| File | Length | Content |
|------|--------|---------|
| IMG_8071.mov | 4.62s | POV riding a tree-lined greenway |
| IMG_8072.mov | 5.64s | Green metal fence at the roadside |
| IMG_8074.mov | 7.10s | Empty greenway, a pedestrian appears later |
| IMG_8075.mov | 15.48s | Longest clip, riding through a park greenway |
| IMG_8076.mov | 3.68s | Different angle, flowers in the right foreground |

### Vision analysis (excerpt)

```
IMG_8071 | 2.31s | Clean converging lines, centered symmetry, soft light | No issues        | 5/5
IMG_8072 | 3.66s | Trees behind fence, messy verticals, no subject      | Grid interference | 3/5
IMG_8074 | 6.80s | Pedestrian centered, path recedes to vanishing point | None              | 5/5
IMG_8075 | 6.68s | Nearly identical to the frame at 4.55s               | Zero new info     | 5/5*
IMG_8076 | 3.50s | Trees form a natural frame, best clarity            | Sky slightly hot  | 5/5
```

\* Technically flawless but redundant — cut in the end

### Editing decisions

| # | Source | Used | Why |
|---|--------|------|-----|
| 1 | IMG_8075 | 0.3–3.2s | Cleanest leading-line composition, establishing shot |
| 2 | IMG_8071 | 1.8–4.62s | Highest average score (4.7/5), clean framing and light |
| 3 | IMG_8072 | 4.5–5.64s | Only 1.1s as a bridge — weakest clip overall |
| 4 | IMG_8075 | 8.5–11.7s | Canopy deepens, layers get richer |
| 5 | IMG_8075 | 12.6–15.4s | Most dappled light, the visual peak |
| 6 | IMG_8076 | 1.4–3.68s | Angle change, flower foreground, best clarity |
| 7 | IMG_8074 | 3.4–7.1s | Pedestrian in the distance, only shot with a subject — the close |

**What got cut**:
- IMG_8075 at 3.2–8.5s (5 seconds) — mid-section duplicates earlier frames, pure drag
- IMG_8072 at 0–4.5s — fence grid, visually cluttered with no subject
- IMG_8074 at 0–3.4s — empty shot, there are already enough of those
- First 0.3s of every clip — blown-out sky

**Narrative logic**: empty establishing → canopy deepens → dappled peak → angle change for clarity → a person appears to close. The arc is "enter → go deeper → encounter."

### Grading

Overcast diffuse light. `clean` left it too flat; `vivid` overshot (asphalt turned blue-green, leaves went near-fluorescent). Final choice was `fresh` — adds clarity without a global color cast, with restrained sharpening.

### Title

![Title](./examples/cycling-greenway/title-frame.jpg)

- Text: 城市里的绿色缝隙 ("Green Gaps in the City")
- Font: **Smiley Sans Oblique** — oblique heavy with beveled corners, matches the motion of cycling
- Animation: `fade-up`, rises from below. Appears at 0.4s → holds 2.5s → gone at 3.6s
- Color: warm white `#FFF3E0` with dark brown outline `#3D1F0C` (softer than pure white on pure black, and closer to the natural palette of the greenway)

### BGM

**LoFi Chill** (Pixabay, free for commercial use, no attribution required, ~112 BPM). 112 BPM lines up well with 2–3 second cuts. Original audio was dropped — POV cycling wind noise is a distraction in short-form video.

### Result

[▶ demo.mp4](./examples/cycling-greenway/demo.mp4) · [full EDL](./examples/cycling-greenway/edl.json)

---

## Installation

### Prerequisites

```bash
# macOS
brew install ffmpeg

# Confirm ffmpeg has libass (required for titles)
ffmpeg -version | grep libass

# Python dependency (only needed for font name lookup)
pip3 install fonttools
```

> **Note**: some ffmpeg distributions ship without `ffprobe`. Check `which ffprobe`; if it's missing, grab it separately from [evermeet.cx](https://evermeet.cx/ffmpeg/).

### Install the skill

**Claude Code / Cola**

```bash
git clone https://github.com/Fagan1024/smart-video-editor.git
cp -R smart-video-editor ~/.claude/skills/     # Claude Code
cp -R smart-video-editor ~/.cola/skills/       # Cola
```

**OpenClaw**

```bash
npx clawhub install smart-video-editor
```

**Other tools compatible with the Agent Skills format**

```bash
npx skills add Fagan1024/smart-video-editor --global
```

### Font library (optional, needed for titles)

Fonts aren't bundled due to size. [docs/FONTS.md](./docs/FONTS.md) lists all 15 with download sources and family names. Drop them in `~/.cola/assets/fonts/`.

---

## Usage

Once installed, just say what you want:

```
Cut the videos in this folder into something I can post
```

```
Make a 20-second vlog from these clips, with the title "Found a new spot this weekend"
```

```
Turn this landscape travel footage vertical and add some light music
```

The agent handles the rest: probe footage → extract frames → vision analysis → editing decisions → find BGM → generate title → render → explain why each segment was cut the way it was.

### Manual invocation (advanced)

```bash
# 1. Probe footage
python3 scripts/probe.py ~/Videos/raw/

# 2. Extract frames
python3 scripts/extract_frames.py ~/Videos/raw/clip1.mov /tmp/frames --interval 1.5 --max 8

# 3. Generate title
python3 scripts/make_title.py \
  --text "Green Gaps" --font "Bebas Neue" \
  --out title.ass --anim fade-up --size 142 \
  --color "#FFF3E0" --outline 1.7 --outline-color "#3D1F0C"

# 4. Validate the EDL
python3 scripts/build.py edl.json --dry-run

# 5. Render
python3 scripts/build.py edl.json
```

---

## EDL structure

Editing decisions live in JSON — readable and writable by both humans and agents:

```json
{
  "output": "output/final.mp4",
  "aspect": "9:16",
  "fps": 30,
  "look": "fresh",
  "fill_mode": "crop",
  "transition": { "type": "cut" },
  "keep_original_audio": false,
  "bgm": {
    "path": "assets/bgm/music.mp3",
    "volume": 0.9,
    "fade_in": 0.8,
    "fade_out": 1.8,
    "original_volume": 0.25
  },
  "title": {
    "ass": "title.ass",
    "fonts_dir": "~/.cola/assets/fonts"
  },
  "segments": [
    { "src": "raw/clip1.mov", "in": 0.3, "out": 3.2 },
    { "src": "raw/clip2.mov", "in": 1.8, "out": 4.6, "speed": 1.0 }
  ]
}
```

| Field | Description |
|-------|-------------|
| `aspect` | `9:16` `16:9` `1:1` `4:5` `3:4` |
| `resolution` | Optional `[w,h]`, overrides aspect when present |
| `look` | See the grading table above |
| `fill_mode` | `crop` fill / `pad` letterbox / `blur_pad` blurred backdrop |
| `transition.type` | `cut` `fade` `dissolve` `fadeblack` `wipeleft` `slideleft` `smoothleft` |
| `keep_original_audio` | Keep source audio; mixes automatically when BGM is also set |
| `segments[].in/out` | Start and end seconds within the source clip |
| `segments[].speed` | `2.0` for 2× speed, `0.5` for slow motion |

**Revising one segment**: the EDL is plain text. Edit it, run `build.py` once — no need to re-analyze the footage.

---

## One lesson learned the hard way

During development, a vision model was used to verify whether a font had loaded. It reported LXGW WenKai as "the system default sans-serif — font loading failed."

The font was loading fine. **Vision models can't reliably distinguish a Kai (regular script) typeface from a sans-serif.**

When libass can't find a font family name, it **silently falls back to the system default without raising an error**. To verify objectively, render a control version with a deliberately nonexistent font name and compare PSNR:

```bash
# PSNR well below inf (in the 15–20dB range) = the frames differ = the font is actually applied
ffmpeg -y -i candidate.png -i fallback-control.png -lavfi psnr -f null - 2>&1 \
  | grep -o "average:[0-9.]*"
```

This is documented in SKILL.md.

---

## Repository layout

```
smart-video-editor/
├── SKILL.md                        Instruction file the agent reads
├── scripts/
│   ├── probe.py                    Probe footage (duration/resolution/orientation/audio/rotation)
│   ├── extract_frames.py           Extract frames with timestamps encoded in filenames
│   ├── make_title.py               Generate title ASS subtitles (7 animations)
│   └── build.py                    Render from an EDL
├── examples/cycling-greenway/      Real case: greenway cycling
│   ├── demo.mp4                    Final cut
│   ├── edl.json                    Complete editing decisions
│   ├── title.ass                   Title subtitle
│   ├── storyboard.jpg              Key frames
│   └── title-frame.jpg             Title in context
└── docs/
    ├── FONTS.md                    Index of 15 free-for-commercial-use fonts
    └── font-preview.png            Font preview
```

---

## License

MIT

Fonts and BGM remain under their original licenses (see [docs/FONTS.md](./docs/FONTS.md)). No font or music files are included in this repository.
