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

Remotion is free for individuals and small teams; larger companies need a license (see `remotion-license`).

## Remotion starter

`remotion-starter/` is a ready Remotion project (vertical 1080x1920 kinetic-text video with a Kokoro voiceover).

```bash
cd remotion-starter
npx remotion render src/index.ts HelloClaude out/hello-claude.mp4 --browser-executable=/opt/pw-browsers/chromium
```

## Buyr promo (buyrshop.com)

`videos/buyr/buyr-promo-final.mp4`: 25.5 s vertical (9:16) promo for Reels/TikTok/Shorts. Source: `remotion-starter/src/BuyrPromo.tsx`, assets in `remotion-starter/public/buyr/` (product images and logo from buyrshop.com, Kokoro voiceover, original code-generated music).

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
