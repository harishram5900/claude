# One real signer per word from ASL Citizen -> compact upper-body + hands skeleton animation for teaching.
import glob, json, re, os, numpy as np
from pose_format import Pose
vocab = json.load(open('raw/islr_map.json')); low = {k.lower(): k for k in vocab}
UP = list(range(0, 25))            # pose: face points, shoulders, elbows, wrists, hips
out = '/home/user/gestura/web/models/signs'; os.makedirs(out, exist_ok=True); index = {}
by = {}
for f in sorted(glob.glob('raw/citizen/*.pose')):
    g = low[re.sub(r'\s*\d+$', '', f.rsplit('/', 1)[1].split('-', 1)[1][:-5]).strip().lower()]; by.setdefault(g, []).append(f)
for g, fs in by.items():
    best = None
    for f in fs:   # pick the clip with the most frames where the dominant (right) hand is tracked
        p = Pose.read(open(f, 'rb').read()); d = p.body.data[:, 0]; m = np.ma.getmaskarray(d)
        rh_ok = (~m[:, 522:543, 0]).all(1).mean()
        if best is None or rh_ok > best[0]: best = (rh_ok, p, f)
    _, p, f = best; d = p.body.data[:, 0]; m = np.ma.getmaskarray(d); a = np.array(d.filled(np.nan)); a[m] = np.nan
    W, H = p.header.dimensions.width, p.header.dimensions.height
    a = a[::2]   # ~15 fps
    sel = np.concatenate([a[:, UP], a[:, 501:522], a[:, 522:543]], axis=1)[..., :2] / [W, H]
    q = np.where(np.isnan(sel), -1, np.round(sel * 1000)).astype(int)
    json.dump({'w': g, 'fps': round(p.body.fps / 2, 1), 'f': q.reshape(len(q), -1).tolist()}, open(f'{out}/{g}.json', 'w'), separators=(',', ':'))
    index[g] = len(q)
json.dump(sorted(index), open(f'{out}/_index.json', 'w'))
print('animations', len(index), 'total KB', sum(os.path.getsize(f'{out}/{g}.json') for g in index) // 1024)
