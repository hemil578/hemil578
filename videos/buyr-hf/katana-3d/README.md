# buyr-ad-you-want-it: 3D text + motion tracking

Final: `../buyr-ad-you-want-it-3d-tracked.mp4` (24.64 s, 9:16). Built on the 20-preset mix.
- **3D text:** every headline is real extruded, lit 3D type (three.js TextGeometry), with letters spinning in on the beat and swaying in 3D. 3·2·1 spin a full turn.
- **Motion tracking:** `track.py` (OpenCV Lucas-Kanade optical flow, seeded per clip in `seeds.json`) gives a per-frame product position (`tracks.json`). The "THIS" tag, price tags and lime target brackets follow the product.
- Render: `node snap.js all x frames 0 739`, then ffmpeg with the soundtrack.
Clips are other creators' product-page demos: style test only (CLAUDE.md rule 6).
