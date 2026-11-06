#!/usr/bin/env python3
"""Image helpers for Codex output.

  img.py trim    <in.png> <out.png>                   crop a cutout to its own alpha box (plus a small margin)
  img.py mouth   <closed.png> <open.png> <out.png>    paste ONLY the changed mouth area of open.png onto closed.png,
                                                      so nothing else on the character moves when the mouth flaps
  img.py remouth <closed.png> <open.png> <out.png> [l,t,r,b]
                                                      rebuild an open frame that shows seams or a ghost of the old
                                                      mouth: fill the closed mouth with the surrounding colour, then
                                                      paste only the dark open mouth (box found from the changes if omitted)
  img.py check   <in.png>                              size, alpha coverage, whether the background is transparent
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def trim(src, dst, margin=12):
    im = Image.open(src).convert("RGBA")
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box: sys.exit(f"{src}: fully transparent")
    l, t, r, b = box
    im.crop((max(0, l - margin), max(0, t - margin), min(im.width, r + margin), min(im.height, b + margin))).save(dst)
    print(dst, im.crop(box).size)

def load_pair(closed, opened):
    a = Image.open(closed).convert("RGBA"); b = Image.open(opened).convert("RGBA").resize(a.size, Image.LANCZOS)
    return a, b

def mouth_box(a, b):
    A, B = np.asarray(a).astype(np.int16), np.asarray(b).astype(np.int16)
    diff = np.abs(A[..., :3] - B[..., :3]).max(axis=2)
    ys, xs = np.nonzero(diff > 48)
    if len(xs) < 20: sys.exit("the two images are the same: no mouth change found")
    # the mouth is the densest changed blob; Codex also drifts a little elsewhere, so take the core of the changes
    cx, cy = np.median(xs), np.median(ys)
    keep = (np.abs(xs - cx) < a.width * 0.12) & (np.abs(ys - cy) < a.height * 0.08)
    xs, ys = xs[keep], ys[keep]
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())

def mouth(closed, opened, dst):
    a, b = load_pair(closed, opened)
    l, t, r, btm = mouth_box(a, b)
    pad = max(10, int((r - l) * 0.25))
    mask = Image.new("L", a.size, 0)
    ImageDraw.Draw(mask).ellipse((l - pad, t - pad, r + pad, btm + pad), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(pad / 2))
    Image.composite(b, a, mask).save(dst)
    print(dst, "mouth box", (l, t, r, btm))

def blob(mask, seed=None, cell=4):
    """The connected parts of a mask that touch `seed`, or else its largest part. Works on a coarse grid, so
    slivers of drift elsewhere drop out."""
    h, w = mask.shape; gh, gw = -(-h // cell), -(-w // cell)
    def coarse(m):
        g = np.zeros((gh * cell, gw * cell), bool); g[:h, :w] = m
        return g.reshape(gh, cell, gw, cell).sum((1, 3)) >= cell  # a cell counts when a quarter of it is set
    g, sg = coarse(mask), coarse(seed) if seed is not None else None
    seen, parts = np.zeros_like(g), []
    for y0, x0 in zip(*np.nonzero(g)):
        if seen[y0, x0]: continue
        stack, part = [(y0, x0)], []; seen[y0, x0] = True
        while stack:
            y, x = stack.pop(); part.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < gh and 0 <= nx < gw and g[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; stack.append((ny, nx))
        parts.append(part)
    keep = np.zeros_like(g)
    chosen = [q for q in parts if any(sg[y, x] for y, x in q)] if sg is not None else [max(parts, key=len, default=[])]
    for q in chosen:
        for y, x in q: keep[y, x] = True
    return mask & np.repeat(np.repeat(keep, cell, 0), cell, 1)[:h, :w]

def fill_holes(mask):
    m = Image.fromarray(np.pad(mask, 1).astype("uint8") * 255).copy()  # a writable copy: floodfill skips array-backed images
    ImageDraw.floodfill(m, (0, 0), 128)
    return (np.asarray(m) != 128)[1:-1, 1:-1]

def remouth(closed, opened, dst, box=None):
    a, b = load_pair(closed, opened)
    l, t, r, btm = [int(v) for v in box.split(",")] if box else mouth_box(a, b)
    A, B = np.asarray(a).astype(float), np.asarray(b).astype(float)
    inbox = np.zeros(A.shape[:2], bool); inbox[t:btm + 1, l:r + 1] = True
    darkA, darkB = A[..., :3].mean(2) < 100, B[..., :3].mean(2) < 110
    # the open mouth: the dark shape in the open frame that grew where the closed frame was not dark
    # (eyes are dark in both, so they drop out), with what it encloses (tongue, teeth)
    seed = blob(darkB & ~darkA & inbox)
    if seed.sum() < 20: sys.exit("no open mouth found in the box: pass l,t,r,b")
    new = fill_holes(blob(darkB & inbox, seed))
    ys, xs = np.nonzero(new); ml, mr, mt, mb = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    pad = max(8, int((mr - ml) * 0.12))
    near = np.zeros_like(new); near[max(0, mt - 2 * pad):mb + 2 * pad, max(0, ml - 2 * pad):mr + 2 * pad] = True
    # the old mouth: dark only in the closed frame, near the new mouth; grown so its anti-aliased edge goes too
    old = Image.fromarray((darkA & ~darkB & near).astype("uint8") * 255).filter(ImageFilter.MaxFilter(15))
    oldm = np.asarray(old) > 0
    # fill it with a blur of the face around it (outlines, highlights and transparent pixels left out)
    lum = A[..., :3].mean(2)
    w = (~oldm & (lum >= 100) & (lum < 230) & (A[..., 3] > 200)).astype(float)
    k = np.exp(-np.arange(-40, 41) ** 2 / (2 * 14 ** 2)); k /= k.sum()
    blur = lambda x: np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 1, np.apply_along_axis(lambda v: np.convolve(v, k, "same"), 0, x))
    win = (slice(max(0, mt - 4 * pad), mb + 4 * pad), slice(max(0, ml - 4 * pad), mr + 4 * pad))
    C = A.copy(); ww = blur(w[win])
    fill = np.stack([blur(A[win][..., c] * w[win]) / np.maximum(ww, 1e-3) for c in range(3)], 2)
    soft = np.asarray(old.filter(ImageFilter.GaussianBlur(3))).astype(float)[win][..., None] / 255
    C[win][..., :3] = A[win][..., :3] * (1 - soft) + fill * soft
    # then only that open-mouth shape from the open frame, so its seams and ghosts stay behind
    nm = np.asarray(Image.fromarray(new.astype("uint8") * 255).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))).astype(float)[..., None] / 255
    C[..., :3] = C[..., :3] * (1 - nm) + B[..., :3] * nm
    Image.fromarray(np.clip(C, 0, 255).astype("uint8"), "RGBA").save(dst)
    print(dst, "mouth", (ml, mt, mr, mb))

def check(src):
    im = Image.open(src); al = np.asarray(im.convert("RGBA"))[..., 3]
    print(src, im.size, im.mode, "transparent bg" if (al == 0).mean() > 0.2 else "OPAQUE bg", f"alpha 0: {100 * (al == 0).mean():.0f}%")

if __name__ == "__main__":
    cmd = sys.argv[1]
    {"trim": trim, "mouth": mouth, "remouth": remouth, "check": check}[cmd](*sys.argv[2:])
