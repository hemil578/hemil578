# Magnetic Jointed Frog: Katana "Kinetic Graphic Photo Edit"

**Final:** `buyr-frog-katana-kinetic.mp4`: 15 s, 1080×1920, 30 fps, H.264 + AAC, −13.2 LUFS. Passes the ffmpeg-skill Reels check (13 checks, 0 failed).

**How it was made (Higgsfield Katana preset `/katana/kinetic-graphic-photo-edit`)**
- The preset's reference (15 s, 24 fps, 34 cuts) was read frame by frame in the Higgsfield sandbox. It's a magazine-style photo edit: slamming type, polaroid disc, vinyl record, 01/02/03 chapter cards, phone UI, end card.
- Our remix keeps that visual language with the frog: TOO CUTE. → meet the FROG → DESK BUDDY polaroid disc → CLICKY JOINTS record → drop → 01 MAGNETIC / 02 POSEABLE / 03 3 COLOURS → RED-GOLD / GREEN / BLUE-GREEN → FREE US SHIPPING on every order → $19.99 · ALL 3 · $29.99 · buyrshop.com.
- Images: 6 new frog stills from GPT Image 2.6, built from the store photos at 0.25 credits each, so **1.5 credits total** (balance 18.29 → 16.79). Still #5, the group shot, was not used because its red frog didn't match the real red-gold one; the real three-frog frame from our frog ad was used instead.
- Motion graphics: HTML + GSAP rendered frame by frame with Playwright in the Higgsfield sandbox (free).
- Music: the owner's Buyr track (`remotion-starter/public/buyr/track.mp3`), 9.6–24.6 s, so its drop lands on the "01" card. It is not the preset's song, which isn't licensed for our ads. CC0 whooshes and hits come from Katana's SFX library.
- One shot per beat on the track's 0.6 s grid (beat = 0.075 + 0.6k s).
- Facts are all from the buyrshop.com product page: magnetic, jointed and clicky legs, 3 colours, $19.99, 3-Colour Bundle $29.99, free US shipping, desk buddy.

**Source:** `project/comp/index.html` (the whole edit), `project/comp/snap.js` (frame renderer), `project/comp/img/` (stills), `project/gen/mix.wav` (music + SFX mix).
