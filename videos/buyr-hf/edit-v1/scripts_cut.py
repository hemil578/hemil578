# Per-frame product cutouts (rembg isnet-general-use) for the text-behind-product shots.
import os, json
from rembg import remove, new_session
from PIL import Image
s = new_session('isnet-general-use'); out = {}
for c in ['c06', 'c06b', 'c07', 'c07b', 'c08', 'c08b']:
    d = f'assets/cuts/{c}'; os.makedirs(d, exist_ok=True); fs = sorted(os.listdir(f'assets/frames/{c}'))
    for f in fs:
        o = f'{d}/{f[:-4]}.png'
        if not os.path.exists(o): remove(Image.open(f'assets/frames/{c}/{f}').convert('RGB'), session=s).save(o)
    a = Image.open(f'{d}/{fs[len(fs)//2][:-4]}.png').getchannel('A').point(lambda v: 255 if v > 128 else 0); out[c] = a.getbbox()
    print(c, out[c], flush=True)
json.dump(out, open('assets/cut_bbox.json', 'w'))
