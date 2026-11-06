# Setting up the tools

Only what is missing. **Local tools:** tell the user what you are going to install and the command, ask once
for the whole list, then run the commands yourself and re-run `doctor.sh`. **Connectors:** tell the user which
one to connect, what it is for and the steps below; Claude cannot connect them. The user does every sign-in,
password, payment and account creation; commands that need `sudo` or a password go to the user to run.

## Codex CLI (scripts and images, on the ChatGPT plan)

Needs a ChatGPT Plus, Pro, Business or Enterprise plan. No OpenAI API key.

```bash
npm install -g @openai/codex
```

(or `brew install --cask codex`). Then the user runs `codex login` and picks **Sign in with ChatGPT** in the
browser window. Check: `codex login status` says "Logged in using ChatGPT".

If `~/.codex/config.toml` sets `model = "..."` to a model the plan rejects ("not supported when using Codex
with a ChatGPT account"), tell the user to set `model = "gpt-6-sol"` there. `codex.sh` passes
`-m gpt-6-sol` either way. Check images work with one small test:
`echo "a red circle on a transparent background" > /tmp/t.txt && $S/scripts/codex.sh image /tmp/t.txt /tmp/t.png`.

## ElevenLabs MCP (voice and sound effects)

Needs an ElevenLabs account with credits (free tier works for a test).

- **Claude desktop or claude.ai:** Settings → Connectors → find **ElevenLabs** and connect, or **Add custom
  connector** with `https://api.elevenlabs.io/v1/mcp`, then sign in to ElevenLabs when asked.
- **Claude Code (terminal):**
  ```bash
  claude mcp add --transport http -s user elevenlabs https://api.elevenlabs.io/v1/mcp
  ```
  then `/mcp` in a `claude` terminal → elevenlabs → Authenticate.

Check: `creative_list_voices` returns voices.

## Fish Audio MCP (fallback voice, only if ElevenLabs is not available)

Needs a Fish Audio account with credits. Settings → Connectors → find **Fish Audio** and connect, then sign
in and pick the team. If it is not in the list, look up the current MCP URL on fish.audio's docs and add it
as a custom connector (desktop) or with `claude mcp add --transport http -s user fish-audio <url>`.
Check: `get_credit_balance` answers.

## Envato MCP (music and sound-effect search)

Needs an Envato Elements subscription for licensed downloads (search works without one).

- **Claude Code:**
  ```bash
  claude mcp add --transport http -s user envato https://mcp.envato.com/mcp
  ```
  then `/mcp` in a `claude` terminal → envato → Authenticate, and sign in to Envato.
- **Claude desktop:** Settings → Connectors → Add custom connector → `https://mcp.envato.com/mcp`. If it
  fails with "Couldn't register with Envato MCP's sign-in service", use the Claude Code command above instead.

Check: `search_music` returns tracks.

## Claude in Chrome (previews and downloads from Envato Elements)

Install the Claude in Chrome extension from the Chrome Web Store, sign in with the same Claude account, and
sign in to Envato Elements in that Chrome. Check: open an Envato item page with the Chrome tools.

## Downloads (nothing to install)

The browser's own downloader is enough: Chrome saves Envato zips to `~/Downloads`, and `music.mjs full` reads
from there. Do not ask the user to install anything for downloads.

Free Download Manager is optional, for users who already catch downloads with it. Computer use then needs
access to "Free Download Manager" to answer its first save dialog (SKILL.md Stage 7 step 5).

## Local tools (free)

```bash
brew install ffmpeg whisper-cpp node python
python3 -m pip install --user pillow numpy
npm install --prefix ~/.claude/skills/reel-studio
npx --prefix ~/.claude/skills/reel-studio playwright install chromium
mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-small.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
```

No Homebrew? Its install line is on brew.sh; the user runs it (it asks for their password).
Then run `$S/scripts/doctor.sh` again until every line says OK; it records the result in `$S/tools.md`.
