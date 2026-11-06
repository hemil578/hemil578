# "Every screen says yes" (you-want-it promo, v8)

**Final:** `../buyr-ad-you-want-it-screens.mp4`. 24.6 s, 1080×1920, 30 fps, H.264 + AAC, −14.1 LUFS. It passes the ffmpeg-skill Reels check: 13 checks, 0 failed, 1 warning (no subtitle track).

Every section is a different kind of screen, cut on the beat grid (0.075 + 0.6k s, drop 14.475):
1. System warning dialog
2. Shop search grid
3. Checkout scanner and printing receipt
4. Group chat
5. Split-screen mosaic
6. Countdown timer
7. Shipping label with stamps (the drop)
8. Swinging price tag
9. Tracking map
10. Browser end card

## Skills used (loaded with the Skill tool)
- `creative-director`: concept and insight ("Every screen says yes").
- `motion-graphics`: Director agent, which produced `shot-plan.json`; builder contract.
- `video`: Editor mode beat sheet, in `BEAT-SHEET.md`.
- `hyperframes`: render used for the audio mix (music + SFX). Its video render can't show clips nested inside screens (clips must sit directly under the root), so the picture is rendered frame by frame by `snap.cjs`. That is Playwright plus the same GSAP timeline; clip frames are pre-extracted JPEGs.
- `ffmpeg-skill`: `sequence.py`, `audio.py --replace`, `loudness.py`, `export.py --preset reels`, `check.py`.

All 739 frames were checked on contact sheets before sending.

## Rebuild
`python3 build.py`. Then extract the clip frames to `assets/frames/<clip>/%03d.jpg` (30 fps, 720×1280). Then run `node snap.cjs range x OUT 0 739`, and encode with ffmpeg-skill.

## Facts
All from buyrshop.com: free US shipping, tracked delivery, from $9.99, and the product prices. No delivery-speed claim.

## Footage
The clips are other creators' product-page footage, so this is a style test and can't run as an ad. For a real ad, swap in our own footage (AI-generated or filmed).
