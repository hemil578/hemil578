# Video creation workspace

Claude Code skills and tools for making and editing videos. The skills in `.claude/skills/` load automatically in every Claude Code session that opens this repo.

## Setup (once per fresh cloud session)

```bash
bash scripts/setup-video-tools.sh
```

Installs Manim, MoviePy, faster-whisper, yt-dlp, Piper and Kokoro (free offline voices), rembg (background removal), SoX, and the Remotion starter's Node packages. Everything is free and runs locally: no paid service or API key needed. ffmpeg, ImageMagick, Node and Chromium are already on the cloud image.

## Skills

| Skill | Source | What it does |
|---|---|---|
| `ffmpeg-skill` | [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill) (MIT) | Edit existing video/audio with FFmpeg: cut, join, reframe, captions, overlays, loudness, exports |
| `remotion-*` (13) | [remotion-dev/skills](https://github.com/remotion-dev/skills) | Create videos from code with Remotion (React): animations, captions, maps, 3D, rendering |
| `manim-skill` | [Yusuke710/manim-skill](https://github.com/Yusuke710/manim-skill) | 3Blue1Brown-style animated explainers with narration and subtitles |
| `watch` | [bradautomates/claude-video](https://github.com/bradautomates/claude-video) (MIT) | Watch a video: frames + transcript so Claude can understand it |
| `moviepy` | [digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) (MIT) | Python video composition: text overlays, lower thirds, short ad spots |
| `playwright-recording` | same toolkit (MIT) | Record browser/app demo videos |
| `elevenlabs` | same toolkit (MIT) | AI voiceovers, sound effects and music. **Optional, needs an ElevenLabs account/key**; use Kokoro or Piper for free |

### Motion design (added later)

| Skill | Source | What it does |
|---|---|---|
| `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`, `reverse-any-video`, `style-sampling` | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0) | HTML + GSAP video engine, ~450 ready-made blocks (transitions, kinetic type, 3D titles, overlays), beat detection, free local music/SFX/cut-outs, rebuild any reference video |
| `hyperframes-motion-reel` | [Sunwood-ai-labs/hyperframes-motion-reel-skill](https://github.com/Sunwood-ai-labs/hyperframes-motion-reel-skill) (MIT) | Showreel-grade, beat-synced motion graphics |
| `breakdown`, `graph`, `map-route`, `minimalistic-graphics`, `stick-figure`, `zach-d-films` | [artemnovitckii/claude-animation-skills](https://github.com/artemnovitckii/claude-animation-skills) (MIT) | Reel styles: 3D exploded view, number graph, 3D map route, line art, stick-figure and 3D cartoon explainers |
| `motion-design` | [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) (MIT) | Timing, easing, choreography and animation principles |
| `gsap-web`, `lottie-animation`, `svg-animation` | [iart-ai/web-animation-skills](https://github.com/iart-ai/web-animation-skills) (MIT) | GSAP timelines, Lottie playback, SVG draw-on, morphing and motion paths |

### 3D and motion graphics (added later)

| Skill | Source | What it does |
|---|---|---|
| `threejs-*` (13) | [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) (MIT) | Three.js 3D: scenes, cameras, lighting, materials, post-processing, shaders, animation, R3F |
| `launch-video`, `apple-launch-film`, `title-sequence-3d`, `motion-effects`, `reference-to-motion`, `reel-export` and 9 more | [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) (MIT) | Launch films, 3D title sequences, reels made in code |
| `motion-design-pro`, `motion-design-critique`, `blender-motion`, `aftereffects-motion` | [lobzyjay/motion-design-with-claude](https://github.com/lobzyjay/motion-design-with-claude) (MIT) | Pro motion principles, critique, Blender and After Effects |
| `threejs-world-generation`, `3d-asset-generation`, `motion-graphics`, `music-to-video`, `gsap-*`, `hyperframes-*` and more (40) | [calesthio/openmontage](https://github.com/calesthio/openmontage) (**GPL-3.0**) | 3D worlds for video, GSAP, music-synced edits, AI video model guides |
| `creative-director`, `video`, `image` | [smixs/creative-director-skill](https://github.com/smixs/creative-director-skill), [smixs/visual-skills](https://github.com/smixs/visual-skills) by Serge Shima (CC-BY-4.0) | Creative director (concepts, scoring, refinement), video director (storyboards, shot lists, montage, camera direction), image prompts |
| `social-ad`, `launch-film`, `brand-film`, `motion-film`, `product-walkthrough`, `event-promo`, `explainer-video`, `data-story`, `feature-update`, `testimonial-video`, `tutorial-video` | [Neelshah1810/Claude-Video-Skills](https://github.com/Neelshah1810/Claude-Video-Skills) (MIT) | Motion-graphics films: vertical social ads, launch and brand films |
| `claude-motion-design` | [howseen-ai/claude-motion-design](https://github.com/howseen-ai/claude-motion-design) (MIT) | Motion design videos in pure code (HTML + Playwright + ffmpeg) |
| `take-one` | [talsiach/take-one](https://github.com/talsiach/take-one) (MIT) | Ads and music videos from one line: idea, script, visuals, voice, music, edit, review |
| `shaderera`, `shaderera-plugins` | [shaderera/shaderera](https://github.com/shaderera/shaderera) (MIT) | Shader-based ad films made in code (render(t)) |
| `video-effects` | [Vibha-Ramprakash/claude-video-effects](https://github.com/Vibha-Ramprakash/claude-video-effects) (MIT) | 51 effects for footage: orbit, glass widgets, match-cut, phone fan, behind-the-head layers |
| `vertical-video-editing` | [nopefallacy/vertical-video-editing-skills](https://github.com/nopefallacy/vertical-video-editing-skills) (MIT) | Creator-grade 9:16 edits with HyperFrames |
| `remotion-motion-graphics` | [haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill) (MIT) | Remotion motion graphics, B-roll, captions, sound design |
| `beat-sync-editing`, `motion-art-direction`, `motion-background`, `color-motion`, `shot-composition`, `animation-principles`, `logo-animation`, `remotion-video`, `iart-after-effects` | [iart-ai/motion-design-skills](https://github.com/iart-ai/motion-design-skills) (MIT) | Editing rhythm and transitions, art direction, shader backgrounds, colour, composition |
| `motion-designer`, `awwwards-animations`, `animated-component-libraries` | [Hainrixz/editor-pro-max](https://github.com/Hainrixz/editor-pro-max) (MIT) | Motion designer workflow, award-site animation patterns |
| `editing-videos` *(installed locally only; 53 MB of CC0 sounds)* | [kmilo93sd/agent-video-editor](https://github.com/kmilo93sd/agent-video-editor) (MIT) | Editing judgment: pacing, cuts, captions, audio, colour, plus CC0 sounds |
| `ad-creative-video`, `iart-launch-video`, `iart-testimonial-video` | [iart-ai/ad-video-skills](https://github.com/iart-ai/ad-video-skills) (MIT) | Ad creative in batches, A/B variants, multi-aspect exports |
| `reel-studio` | [mahmadmanzoor/reel-studio](https://github.com/mahmadmanzoor/reel-studio) (MIT) | Vertical reel ads with illustrated characters, voice, music, captions (needs `npm install` in its folder) |

Licences are in `.claude/skill-licenses/`.

HyperFrames cloud features (HeyGen) are optional and need a key; everything above renders locally for free. Telemetry is disabled with `DO_NOT_TRACK=1`.

Remotion is free for individuals and small teams; larger companies need a license (see `remotion-license`).

## Remotion starter

`remotion-starter/` is a ready Remotion project (vertical 1080x1920 kinetic-text video with a Kokoro voiceover).

```bash
cd remotion-starter
npx remotion render src/index.ts HelloClaude out/hello-claude.mp4 --browser-executable=/opt/pw-browsers/chromium
```

## Buyr promo (buyrshop.com)

**Newest: `videos/buyr-hf/buyr-ad-you-want-it.mp4`.** The "YOU DON'T NEED THIS. …YOU WANT IT." TikTok ad, made with every ad skill (see `videos/buyr-hf/BEST-SCRIPT.md` and `ADS-HOOKS.md`). It uses 30 real product demo clips from the store, cut to the track, with native text, real prices, the offer on the drop, and a bookend end card. Project: `videos/buyr-hf/ad/`. Note: this render came out tagged HLG/BT.2020, so it was converted back to SDR BT.709 with `zscale ... npl=203` (see the git log).


**Latest: `videos/buyr-hf/buyr-saw-want-got.mp4`.** A HyperFrames story film, "Saw it. Want it. Got it.": the real glow-penguin video in a phone feed → the penguin bursts out of the phone onto the real buyrshop.com product page → price punch-in → scroll → tap ADD TO CART → the button becomes the Buyr box → packed and labelled → flies a route across a city → lands at the door → on the drop the box bursts open and products rise out of it one per beat with their names and prices, then the rest fountain out → they collapse into the end card. Project: `videos/buyr-hf/film/` (SPEC.md, STORYLINES.md, one scene per file in `compositions/`). Render: `cd videos/buyr-hf/film && npx hyperframes render -q delivery`.


**Main version: `videos/buyr/buyr-story.mp4`.** A 24.6 s story edit cut to the track: scroll a TikTok-style feed → add to cart → pack the box → lid closes on the riser → FREE SHIPPING label and the box races off on the drop → unbox to logo and CTA. Each of the 25 products appears exactly once, and the cart count and total use real store prices. Source: `remotion-starter/src/BuyrStory.tsx` (composition `BuyrStory`).

**Previous: `videos/buyr/buyr-beat-edit.mp4`.** A 24.6 s music-video edit cut to `remotion-starter/public/buyr/track.mp3` (100 BPM, drop at 14.4 s), with no voiceover. It cuts on every beat, and on every half-beat after the drop. It mixes full-screen product photos with camera moves and background-removed product cut-outs (rembg) slamming onto colours, plus kinetic words, flashes, shake, film grain, a riser into the drop, and an orbiting-products end card. Source: `remotion-starter/src/BuyrBeatEdit.tsx`; photos in `public/buyr/shots/` (from the store's products.json) and cut-outs in `public/buyr/cut/`.

```bash
cd remotion-starter
npx remotion render src/index.ts BuyrBeatEdit out/beat-edit.mp4 --browser-executable=/opt/pw-browsers/chromium
```

Earlier versions:


`videos/buyr/buyr-promo-music-only.mp4`: music-only version (no voiceover; `VOICE = false` in BuyrPromo.tsx).

`videos/buyr/buyr-promo-music.mp4`: 24.6 s vertical (9:16) promo for Reels/TikTok/Shorts, cut to the beat of the supplied music track (`remotion-starter/public/buyr/track.mp3`, ~100 BPM, drop at 14.4 s). Source: `remotion-starter/src/BuyrPromo.tsx`; assets in `remotion-starter/public/buyr/` (product images and logo from buyrshop.com, Kokoro voiceover re-timed to the beat cuts).

`videos/buyr/buyr-promo-final.mp4`: earlier 25.5 s version with code-generated music.

```bash
cd remotion-starter
npx remotion render src/index.ts BuyrPromo out/buyr-promo.mp4 --browser-executable=/opt/pw-browsers/chromium
```

## Test videos

- `test-video/hello.mp4`: 5 s title card (ffmpeg-skill)
- `test-video/v2/how-claude-makes-video.mp4`: 10 s Manim explainer with offline Piper voiceover and burned-in captions
- `test-video/v3/remotion-vertical.mp4`: 8 s vertical (9:16) Remotion kinetic text with Kokoro voiceover

## Known limits in the cloud session

- edge-tts (Microsoft voices) uses WebSockets, which the session proxy blocks; use Kokoro or Piper (free, offline) instead.
- No GPU: long or 4K renders are slow.
