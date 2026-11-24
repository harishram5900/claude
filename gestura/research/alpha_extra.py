# Hand landmarks for the extra alphabet sources: EitanG98 photos (outside test) and ASLNow! landmark JSONs (training).
import json, glob, os, numpy as np
from PIL import Image
exec(open('alphabet.py').read().split("if not os.path.exists('alpha_feats.npz')")[0])
ann = {}
for f in glob.glob('raw/eitan/*.json'): ann.update(json.load(open(f)))
E, Ey, Eu = [], [], []
for f in sorted(glob.glob('raw/eitan/img/*.jpg')):
    name = f.rsplit('/', 1)[1].split('_', 1)[1]; a = ann.get(name); L = f.rsplit('/', 1)[1][0]
    fe = extract(Image.open(f))
    if fe is not None: E.append(fe[:63]); Ey.append(LET.index(L)); Eu.append(a['user_id'] if a else name)
print('eitan hands', len(E), 'of', len(glob.glob('raw/eitan/img/*.jpg')), 'people', len(set(Eu)))
N, Ny = [], []
for f in sorted(glob.glob('raw/aslnow/*.json')):
    lm = json.load(open(f))
    if isinstance(lm, list) and len(lm) == 21:
        class P: pass
        pts = []
        for d in lm: p = P(); p.x, p.y, p.z = d['x'], d['y'], d['z']; pts.append(p)
        N.append(features(pts, 'Right')[:63]); Ny.append(LET.index(f.rsplit('/', 1)[1][0]))
print('aslnow samples', len(N))
np.savez('alpha_extra.npz', E=np.array(E), Ey=np.array(Ey), Eu=np.array(Eu), N=np.array(N), Ny=np.array(Ny))
