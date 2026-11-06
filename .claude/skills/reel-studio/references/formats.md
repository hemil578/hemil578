# Formats: platforms, lengths, styles

Every reel is 9:16, 1080×1920, 30 fps. Length is the user's choice: 10 s to 2 min.

## Platform and length (suggest; the user decides)

Always ask for the length. The table gives what tends to work; a user may want longer (a product demo, an
explainer, a story). Past ~30 s, plan a beat every 3–6 s and a re-hook every 15–20 s (a new question, a twist,
a "but here's the thing") so viewers keep watching.

| Platform | Ideal length | Notes |
| --- | --- | --- |
| Instagram Reels ad | 9–15 s | Hook in 1–2 s. Sound often on. Bottom 20% and right 14% hold the UI. |
| Instagram Reels organic | 15–30 s | Loops well when the last frame leads back to the first. |
| TikTok ad (In-Feed) | 15–21 s | Native, lo-fi feel beats polish. Captions matter: many watch muted. |
| TikTok organic | 15–30 s | Trend audio and fast cuts (every 1–2 s). |
| YouTube Shorts | 20–30 s | Viewers stay longer; a story arc works. |
| Facebook Reels / feed | 10–15 s | Older audience; clear product and CTA, captions on. |
| Product demo, explainer, story | 30 s–2 min | Hook in 2 s still; chapters with on-screen titles; CTA at the end and once mid-way. |

Safe zones at 9:16: top 7% (status bar, account name), bottom 20% (caption, CTA button), right 14%
(like/comment/share). Feed sizes (1:1, 4:5, `--size`) have no button column: keep 4% top, 6% bottom and 5% on
each side clear. `render.mjs --safe` draws the zones for the size it renders.

## Style menu (ask first; recommend two that fit the product)

1. **Slideshow** — bold text over images, one idea per slide, beat-synced cuts.
2. **UGC / talking head** — a character talks straight to camera, phone-shot feel.
3. **Cinematic** — slow camera moves, music-led, few words, big end card.
4. **Humor skit** — a short scene with a setup, a turn and a punchline; characters talk to each other.
5. **Problem → solution** — show the pain, then the product fixing it.
6. **Before / after** — two states side by side or as a hard cut.
7. **POV** — "POV: you're a roofer and…", the viewer is the character.
8. **Listicle** — "3 reasons…", numbered beats.
9. **Explainer** — how it works in 3 steps.
10. **Product demo** — real screens or a screen recording, cards and taps over it.
11. **Testimonial** — a customer's words. Only real quotes from real customers, with permission. Otherwise
    label it as a dramatization.
12. **Storytime** — one character tells a short story with a twist.
13. **Founder story** — why the product exists, told by the maker.
14. **Trend / meme** — a known format with the product dropped in.
15. **Kinetic type** — words alone, animated to the voice or the beat.
16. **Green screen / reaction** — a character reacts in front of a screenshot, post or headline.
17. **Day in the life** — the product inside a user's normal day.
18. **Retro anime suspense** — a late-1970s TV anime meme builds fake tension, then hard-cuts into a real
    hand-held product demo. About 31 s or 42 s. A ready-made type: `references/retro-anime.md`.
