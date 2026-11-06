# Convert an OTF/TTF to three.js typeface JSON (outer contours made clockwise for FontLoader).
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.reverseContourPen import ReverseContourPen
src, dst = sys.argv[1], sys.argv[2]
chars = sys.argv[3] if len(sys.argv) > 3 else ''.join(chr(c) for c in range(32, 127)) + '—·…'
f = TTFont(src); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
cff = 'CFF ' in f
glyphs = {}
for ch in chars:
    gn = cmap.get(ord(ch))
    if not gn: continue
    rec = RecordingPen(); pen = ReverseContourPen(rec) if cff else rec
    gs[gn].draw(pen)
    o = []; xs = []
    for op, pts in rec.value:
        if op == 'moveTo': (x, y), = pts; o.append(f'm {x:.0f} {y:.0f}'); xs.append(x)
        elif op == 'lineTo': (x, y), = pts; o.append(f'l {x:.0f} {y:.0f}'); xs.append(x)
        elif op == 'curveTo':
            (a, b), (c, d), (x, y) = pts; o.append(f'b {x:.0f} {y:.0f} {a:.0f} {b:.0f} {c:.0f} {d:.0f}'); xs.append(x)
        elif op == 'qCurveTo':
            pts = list(pts); end = pts[-1]; offs = pts[:-1]
            for i, cp in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((cp[0] + offs[i + 1][0]) / 2, (cp[1] + offs[i + 1][1]) / 2)
                o.append(f'q {nxt[0]:.0f} {nxt[1]:.0f} {cp[0]:.0f} {cp[1]:.0f}'); xs.append(nxt[0])
    glyphs[ch] = {'ha': gs[gn].width, 'x_min': min(xs) if xs else 0, 'x_max': max(xs) if xs else 0, 'o': ' '.join(o) + (' ' if o else '')}
hh = f['hhea']
json.dump({'glyphs': glyphs, 'familyName': f['name'].getDebugName(1), 'ascender': hh.ascent, 'descender': hh.descent,
           'underlinePosition': f['post'].underlinePosition, 'underlineThickness': f['post'].underlineThickness,
           'boundingBox': {'xMin': f['head'].xMin, 'yMin': f['head'].yMin, 'xMax': f['head'].xMax, 'yMax': f['head'].yMax},
           'resolution': upm, 'original_font_information': {}}, open(dst, 'w'))
print('glyphs', len(glyphs), 'cff', cff)
