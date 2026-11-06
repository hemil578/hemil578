#!/usr/bin/env bash
# Checks the command-line tools reel-studio needs. MCP connectors (ElevenLabs, Fish Audio, Envato) and
# Claude in Chrome are not visible from a shell: Claude checks those in its own tool list.
# Prints one line per tool: OK or MISSING, and the fix (details in references/setup.md).
# Writes the result to <skill>/tools.md, so later reels skip the check while it says every tool is ready.
S="$(cd "$(dirname "$0")/.." && pwd)"
miss=0; log=""
ok() { log+="$(printf 'OK       %-14s %s' "$1" "$2")"$'\n'; }
no() { log+="$(printf 'MISSING  %-14s %s' "$1" "$2")"$'\n'; miss=$((miss + 1)); }

if command -v codex >/dev/null; then
  if codex login status 2>&1 | grep -qi 'chatgpt'; then ok codex "$(codex --version 2>/dev/null), signed in with ChatGPT"
  else no codex "installed but not signed in with ChatGPT: run codex login"; fi
  m=$(grep -E '^model *=' ~/.codex/config.toml 2>/dev/null | head -1)
  [ -n "$m" ] && log+="$(printf '         %-14s config default %s (reel-studio passes -m gpt-6-sol anyway)' "" "$m")"$'\n'
else no codex "npm install -g @openai/codex, then codex login"; fi

command -v ffmpeg >/dev/null && ok ffmpeg "$(ffmpeg -version | head -1 | cut -d' ' -f3)" || no ffmpeg "brew install ffmpeg"
command -v node >/dev/null && ok node "$(node --version)" || no node "brew install node"
if command -v python3 >/dev/null; then
  python3 -c 'import PIL, numpy' 2>/dev/null && ok python3 "Pillow and numpy present" || no python3 "python3 -m pip install --user pillow numpy"
else no python3 "brew install python"; fi

# same places render.mjs looks
pw=""; for d in "$PLAYWRIGHT" "$S/node_modules/playwright"; do
  [ -n "$d" ] && [ -d "$d" ] && pw="$d" && break; done
if [ -n "$pw" ]; then ok playwright "$pw"
else no playwright "npm install --prefix $S && npx --prefix $S playwright install chromium"; fi

command -v whisper-cli >/dev/null && ok whisper-cli "found" || no whisper-cli "brew install whisper-cpp"
model=$(find ~/.cache -name 'ggml-*.bin' 2>/dev/null | head -1)
[ -n "$model" ] && ok whisper-model "$model" || no whisper-model "mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-small.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin"

if [ -d "/Applications/Free Download Manager.app" ]; then ok fdm "Free Download Manager installed (optional)"
else log+="$(printf 'optional %-14s %s' fdm "not installed; the browser downloads straight to ~/Downloads")"$'\n'; fi

[ $miss -eq 0 ] && verdict="All command-line tools ready." || verdict="$miss missing."
printf '%s\n%s\n' "$log" "$verdict"
{ echo "# reel-studio tools"; echo; echo "Checked $(date '+%Y-%m-%d %H:%M') by scripts/doctor.sh. $verdict"
  echo "Later reels skip the check while this says every tool is ready. Run doctor.sh again when a tool fails."
  echo; echo '```'; printf '%s' "$log"; echo '```'; } > "$S/tools.md"
exit $miss
