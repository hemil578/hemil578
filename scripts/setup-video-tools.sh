#!/usr/bin/env bash
# Installs the video tools used by the skills in .claude/skills.
# Run once per fresh cloud session:  bash scripts/setup-video-tools.sh
set -euo pipefail

# System libraries (Manim needs Pango/Cairo; SoX for audio effects)
if command -v apt-get >/dev/null; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    libpango1.0-dev libcairo2-dev pkg-config sox fonts-noto-color-emoji >/dev/null
fi

# Python tools (uv avoids a Debian setuptools bug that breaks plain pip here)
command -v uv >/dev/null || pip3 install -q uv
uv pip install --system -q manim moviepy faster-whisper edge-tts yt-dlp piper-tts

# Offline voice for Piper TTS
VOICE_DIR="$HOME/.local/share/piper"
mkdir -p "$VOICE_DIR"
for f in en_US-ryan-high.onnx en_US-ryan-high.onnx.json; do
  [ -s "$VOICE_DIR/$f" ] || curl -sSfL -o "$VOICE_DIR/$f" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/$f"
done

echo "Video tools ready: $(manim --version | head -1), ffmpeg, moviepy, faster-whisper, yt-dlp, piper"
