#!/usr/bin/env python3
"""Puts real product screens into a drawn phone with a pure green display.

Fingers over the display stay in front. Writes one PNG per screen, plus
geometry.json with the display's position in the 1080x1920 frame for tap markers.

  python3 scripts/hand_screen.py images/hand-phone.png screens/*.png --out images/hand-screens
  python3 scripts/hand_screen.py images/teller-phone-raw.png images/logo.png --fit center --bg "#FFFFFF" \
          --scale 1 --out images --name teller-phone.png
"""

import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

FRAME_W, FRAME_H = 1080, 1920


def key(rgba):
    """Green-screen matte, 1 on the display and 0 elsewhere, soft at the edge."""
    r, g, b, a = [rgba[..., i].astype(np.float32) for i in range(4)]
    lead = g - np.maximum(r, b)
    return np.clip((lead - 40) / 80, 0, 1) * (a > 128)


def display_box(matte):
    """Bounds of the display, ignoring stray green pixels in the art."""
    solid = matte > 0.9
    if solid.sum() < 1000:
        raise SystemExit("hand_screen: no green display found, the phone must show solid #00FF00")
    columns, rows = solid.sum(axis=0), solid.sum(axis=1)
    xs = np.where(columns > columns.max() * 0.05)[0]
    ys = np.where(rows > rows.max() * 0.05)[0]
    return int(xs[0]), int(ys[0]), int(xs[-1]) + 1, int(ys[-1]) + 1


def edge_colour(screen):
    """The screen's own background, so bars beside a contained screen don't show."""
    a = np.asarray(screen.convert("RGB"))
    row = a[a.shape[0] // 2]
    return tuple(int(v) for v in np.median(np.concatenate([row[:8], row[-8:]]), axis=0))


def strip_device_frame(shot, fill):
    """Removes a device frame baked into a marketing screenshot: rounded corners and the camera pill.

    The drawn phone has its own. Left in, they show as dark corners and a second pill. Only shapes connected
    to a corner or to the pill, and sized like them, are removed, so app text survives. --raw skips it.
    """
    a = np.asarray(shot.convert("RGBA")).copy()
    h, w = a.shape[:2]
    differs = np.abs(a[..., :3].astype(int) - np.array(fill)).max(axis=2) > 12
    # copy(): an image from fromarray is read-only, and floodfill's writes to it vanish without an error.
    mask = Image.fromarray((differs * 255).astype(np.uint8)).copy()

    def region(seed):
        if not differs[seed[1], seed[0]]:
            return None
        m = mask.copy()
        ImageDraw.floodfill(m, seed, 128)
        return np.asarray(m) == 128

    gone = np.zeros((h, w), dtype=bool)

    # Corners and bezel. Large means it is the app, such as a coloured header reaching the edge, so leave it.
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        found = region(seed)
        if found is not None and found.sum() < h * w * 0.03:
            gone |= found

    # The pill: a centred shape with a pill's proportions. A title or a dark bar fails this.
    y = 0
    while y < h * 0.06:
        if differs[y, w // 2] and not gone[y, w // 2]:
            found = region((w // 2, y))
            ys, xs = np.where(found)
            pw, ph = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
            centred = abs((xs.max() + xs.min()) / 2 - w / 2) < w * 0.05
            if centred and 0.15 * w < pw < 0.5 * w and 0.025 * h < ph < 0.07 * h:
                gone |= found
            y = ys.max()
        y += 1

    gone = np.asarray(Image.fromarray((gone * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    a[gone] = (*fill, 255)
    return Image.fromarray(a)


def composite(hand, shot, fit, bg, raw):
    if fit == "top" and not raw:
        colour = edge_colour(shot)
        shot = strip_device_frame(shot, colour)
    data = np.asarray(hand)
    matte = key(data)
    x0, y0, x1, y1 = display_box(matte)
    box_w, box_h = x1 - x0, y1 - y0

    scale = min(box_w / shot.width, box_h / shot.height)
    if fit == "center":
        scale *= 0.42
    w, h = max(1, round(shot.width * scale)), max(1, round(shot.height * scale))
    fitted = shot.convert("RGBA").resize((w, h), Image.LANCZOS)

    fill = bg or edge_colour(shot)
    layer = Image.new("RGBA", hand.size, (0, 0, 0, 0))
    layer.paste(Image.new("RGBA", (box_w, box_h), fill), (x0, y0))
    top = y0 if fit == "top" else y0 + (box_h - h) // 2
    layer.alpha_composite(fitted, (x0 + (box_w - w) // 2, top))

    # Show the screen only through the display, grown a little to reach under the bezel's soft edge.
    grown = Image.fromarray((matte * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    shown = np.asarray(layer).copy()
    shown[..., 3] = (shown[..., 3] / 255 * np.asarray(grown)).astype(np.uint8)

    # Cut the green out of the drawing, and remove its spill from the edge pixels.
    art = data.copy()
    art[..., 3] = (art[..., 3] * (1 - matte)).astype(np.uint8)
    spill = matte > 0
    art[..., 1][spill] = np.minimum(art[..., 1], np.maximum(art[..., 0], art[..., 2]))[spill]

    out = Image.fromarray(shown)
    out.alpha_composite(Image.fromarray(art))
    return out, (x0, y0, x1, y1), (w, h, top)


def slug(path):
    return re.sub(r"[^a-z0-9]+", "-", Path(path).stem.lower()).strip("-")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("hand", help="drawing with a solid #00FF00 display")
    p.add_argument("screens", nargs="+", help="real product screens, in demo order")
    p.add_argument("--out", required=True)
    p.add_argument("--name", help="output filename, for a single screen")
    p.add_argument("--fit", choices=["top", "center"], default="top", help="top: whole screen, status bar visible. center: a logo")
    p.add_argument("--bg", help="colour around the screen, by default taken from its edges")
    p.add_argument("--raw", action="store_true", help="keep the screen as it is, don't strip a baked-in device frame")
    p.add_argument("--scale", type=float, default=1.221, help="enlarge the drawing first, so screen text stays sharp")
    p.add_argument("--x", type=float, default=0.46, help="timeline x of the picture")
    p.add_argument("--y", type=float, default=0.5644, help="timeline y (centre) of the picture")
    p.add_argument("--w", type=float, default=1.06389, help="timeline w of the picture")
    a = p.parse_args()

    hand = Image.open(a.hand).convert("RGBA")
    if a.scale != 1:
        hand = hand.resize((round(hand.width * a.scale), round(hand.height * a.scale)), Image.LANCZOS)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    written, display = [], None
    for i, path in enumerate(a.screens, 1):
        shot = Image.open(path)
        image, display, placed = composite(hand, shot, a.fit, a.bg, a.raw)
        name = a.name or f"hand-{i}-{slug(path)}.png"
        image.save(out / name)
        written.append({"file": name, "source": str(path), "fitted": {"w": placed[0], "h": placed[1], "top": placed[2]}})
        print(f"wrote {out / name}")

    if a.name:
        return

    # Picture pixels to frame fractions, the same way the engine places a pic.
    k = a.w * FRAME_W / hand.width
    fx = lambda px: a.x + (px / hand.width - 0.5) * a.w
    fy = lambda py: a.y + (py / hand.height - 0.5) * hand.height * k / FRAME_H
    x0, y0, x1, y1 = display
    f = written[-1]["fitted"]
    left = x0 + ((x1 - x0) - f["w"]) / 2
    geometry = {
        "placement": {"x": a.x, "y": a.y, "w": a.w},
        "image": {"w": hand.width, "h": hand.height},
        "screen": {"x0": round(fx(left), 4), "y0": round(fy(f["top"]), 4),
                   "x1": round(fx(left + f["w"]), 4), "y1": round(fy(f["top"] + f["h"]), 4)},
        "screens": written,
    }
    (out / "geometry.json").write_text(json.dumps(geometry, indent=2) + "\n")
    print(f"wrote {out / 'geometry.json'}: screen {geometry['screen']}")


if __name__ == "__main__":
    main()
