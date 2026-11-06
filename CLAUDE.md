# Rules for every video in this repo (from the owner)

1. **Use the skills for every video.** Load them with the Skill tool before working; don't just run their scripts or write from memory.
   - Script and hook: `ads-hooks` → `shortform-hook-generator` → `ads-video` (and `hyperframes-ad-director` for ads).
   - Motion and timing: `motion-design`; building: `hyperframes` / `remotion-*` / `manim-skill`.
   - Voice: `elevenlabs` (human-sounding voice). Never ship robotic TTS.
   - Edit, captions, loudness, export, checks: `ffmpeg-skill`.
   - Say honestly which skills were used. Never claim a skill was used when it wasn't.
2. **Check every frame** (all frames, not samples) before sending. Also listen to or transcribe the audio.
3. **Cut on the measured beat grid**: one shot per beat, and a countdown goes one number per beat.
4. **Text must be readable**: about 0.5 s + 0.3 s per word on screen.
5. **Only use facts from buyrshop.com.** Delivery takes 7–14 business days (it ships within 1–2), free US shipping, no returns. No fake testimonials ("I bought it").
6. **Never reuse other people's footage.** The product-page demo videos are other creators' TikToks, so make new footage (AI or filmed).
7. **Don't waste credits:** check the price with get_cost, use one take, and prepare everything before generating.
8. Confirm a render is new (check file timestamps) before reviewing or sending it.
