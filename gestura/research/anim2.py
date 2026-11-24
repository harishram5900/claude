# Teaching animations for every word in the vocabulary: one real ASL Citizen signer (training split) per word,
# trimmed to the signing span (same rule as training), upper body + both hands at ~15 fps.
import json, os, re, sys, urllib.request, urllib.parse, csv, numpy as np
from concurrent.futures import ThreadPoolExecutor
sys.argv = ['x']; exec(open('build_words.py').read().split("if __name__")[0])
out = '/home/user/gestura/web/models/signs'
for f in os.listdir(out): os.remove(f'{out}/{f}')
by = {}
for p, w, sp in jobs:
    if sp == 'train': by.setdefault(w, []).append(p)
UP = list(range(0, 25))
def make(w):
    best = None
    for p in by[w][:4]:
        from pose_format import Pose
        raw = urllib.request.urlopen('https://huggingface.co/datasets/SorensenAI/asl-citizen-poses/resolve/main/' + urllib.parse.quote(p), timeout=60).read()
        P = Pose.read(raw); d = P.body.data[:, 0]; m = np.ma.getmaskarray(d); a = np.array(d.filled(np.nan), dtype=np.float32); a[m] = np.nan
        Wd, Ht = P.header.dimensions.width, P.header.dimensions.height
        x, fps = load(raw)
        act = np.where(active(x))[0]
        if len(act) < 4: continue
        s0, s1 = max(0, act[0] - 4), min(len(a), act[-1] + 6)
        score = (~m[s0:s1, 522:543, 0]).all(1).mean() + (~m[s0:s1, 501:522, 0]).all(1).mean() * 0.3
        if best is None or score > best[0]: best = (score, a[s0:s1], Wd, Ht, fps)
    if not best: return None
    _, a, Wd, Ht, fps = best; a = a[::2]
    sel = np.concatenate([a[:, UP], a[:, 501:522], a[:, 522:543]], axis=1)[..., :2] / [Wd, Ht]
    q = np.where(np.isnan(sel), -1, np.round(sel * 1000)).astype(int)
    json.dump({'w': w, 'fps': round(fps / 2, 1), 'f': q.reshape(len(q), -1).tolist()}, open(f'{out}/{w}.json', 'w'), separators=(',', ':'))
    return w
with ThreadPoolExecutor(12) as ex: made = [w for w in ex.map(make, sorted(by)) if w]
json.dump(sorted(made), open(f'{out}/_index.json', 'w'))
print('animations', len(made), 'KB', sum(os.path.getsize(f'{out}/{w}.json') for w in made) // 1024)
