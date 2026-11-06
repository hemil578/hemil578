#!/usr/bin/env python3
"""Word timings for captions, from whisper.cpp (local, free).

  words.py <voice clip> <out.json> [--text "the line as written"]

Writes [{"w": word, "a": start_s, "b": end_s}, ...] relative to the clip's start. With --text, the words
shown are the script's own words (spelling, brand names, punctuation) carrying Whisper's timings;
delivery tags like [excited] are dropped.
"""
import difflib, glob, json, os, re, subprocess, sys, tempfile

def model():
    cands = [os.environ.get("REEL_WHISPER_MODEL", "")] + glob.glob(os.path.expanduser("~/.cache/**/ggml-*.bin"), recursive=True) + glob.glob("/opt/homebrew/share/**/ggml-*.bin", recursive=True)
    cands = [c for c in cands if c and os.path.isfile(c)]
    if not cands:
        sys.exit("no whisper model: download one, e.g.\n  curl -L -o ~/.cache/whisper/ggml-small.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin")
    cands.sort(key=lambda c: (".en" not in c, "small" not in c))   # prefer small.en: fast and good on clean voice
    return cands[0]

norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())

def main():
    clip, out = sys.argv[1], sys.argv[2]
    text = sys.argv[sys.argv.index("--text") + 1] if "--text" in sys.argv else None
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, "v.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", clip, "-ac", "1", "-ar", "16000", wav], check=True)
        subprocess.run(["whisper-cli", "-m", model(), "-f", wav, "-ml", "1", "-sow", "-oj", "-of", os.path.join(d, "w"), "-np"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        segs = json.load(open(os.path.join(d, "w.json")))["transcription"]
    heard = [{"w": s["text"].strip(), "a": s["offsets"]["from"] / 1000, "b": s["offsets"]["to"] / 1000} for s in segs if s["text"].strip()]
    if text:
        said = re.sub(r"\[[^\]]*\]", " ", text).split()
        sm = difflib.SequenceMatcher(a=[norm(w["w"]) for w in heard], b=[norm(w) for w in said], autojunk=False)
        timed = [None] * len(said)
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
                for k in range(j2 - j1): timed[j1 + k] = (heard[i1 + k]["a"], heard[i1 + k]["b"])
            elif tag == "replace":   # e.g. "credible AI" heard for "CredibleAI": spread the heard span over the written words
                a, b = heard[i1]["a"], heard[i2 - 1]["b"]
                for k in range(j2 - j1): timed[j1 + k] = (a + (b - a) * k / (j2 - j1), a + (b - a) * (k + 1) / (j2 - j1))
        for k, t in enumerate(timed):   # words Whisper missed: share the gap between their neighbours
            if t is None:
                prev = next((timed[j][1] for j in range(k - 1, -1, -1) if timed[j]), 0.0)
                nxt = next((timed[j][0] for j in range(k + 1, len(timed)) if timed[j]), prev + 0.3)
                timed[k] = (prev, max(prev + 0.08, nxt))
        heard = [{"w": w, "a": round(a, 3), "b": round(b, 3)} for w, (a, b) in zip(said, timed)]
    json.dump(heard, open(out, "w"), indent=1)
    print(out, len(heard), "words")

if __name__ == "__main__":
    main()
