#!/bin/zsh
# Codex CLI on the user's ChatGPT plan (built-in tools, no API key).
#
#   codex.sh text  <prompt-file> <out-file>                 one answer, written to out-file (scripts, revisions)
#   codex.sh image <prompt-file> <out.png> [ref.png ...]    one image from the built-in image_gen tool, copied to out.png
#
# The prompt goes in on stdin: `-i` takes several files and would swallow a prompt argument.
# Model: $REEL_CODEX_MODEL, default gpt-6-sol (the ChatGPT plan rejects some config defaults, such as gpt-6.1-sol).
set -euo pipefail
mode=$1 prompt=$2 out=${3:A}
shift 3
model=${REEL_CODEX_MODEL:-gpt-6-sol}
dir=${out:h}
mkdir -p "$dir"
log="$dir/.codex-${out:t:r}.log"

if [[ $mode == text ]]; then
  codex exec -m "$model" --skip-git-repo-check -s read-only -C "$dir" -o "$out" - < "$prompt" > "$log" 2>&1
elif [[ $mode == image ]]; then
  refs=()
  for r in "$@"; do refs+=(-i "${r:A}"); done
  { cat "$prompt"; print "\n\nUse your built-in image generation tool. Then copy the generated PNG to exactly this path: $out\nReply with only that path."; } |
    codex exec -m "$model" --skip-git-repo-check -s workspace-write -C "$dir" "${refs[@]}" - > "$log" 2>&1
else
  print -u2 "mode must be text or image"; exit 2
fi

if [[ ! -s $out ]]; then
  print -u2 "codex produced no $out — last lines of $log:"; tail -5 "$log" >&2; exit 1
fi
rm -f "$log"
print "$out"
