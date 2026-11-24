# Accuracy of the Kaggle 1st-place ISLR model on ASL Citizen signers (independent people, different cameras).
import glob, json, re, numpy as np, sys
from pose_format import Pose
from ai_edge_litert.interpreter import Interpreter
vocab = json.load(open('raw/islr_map.json')); inv = {v: k for k, v in vocab.items()}; low = {k.lower(): v for k, v in vocab.items()}
it = Interpreter('raw/islr.tflite'); run = it.get_signature_runner()
def load(f, zmode, swap):
    p = Pose.read(open(f, 'rb').read()); d = p.body.data[:, 0]; m = np.ma.getmaskarray(d)
    a = np.array(d.filled(np.nan), dtype=np.float32); a[m] = np.nan
    W, H = p.header.dimensions.width, p.header.dimensions.height
    a[..., 0] /= W; a[..., 1] /= H
    a[..., 2] = 0 if zmode == 0 else (a[..., 2] - 256) / W
    pose, face, lh, rh = a[:, 0:33], a[:, 33:501], a[:, 501:522], a[:, 522:543]
    if swap: lh, rh = rh, lh
    zero = np.all(np.abs(np.nan_to_num(lh)) < 1e-6, axis=(1, 2)); lh[zero] = np.nan
    zero = np.all(np.abs(np.nan_to_num(rh)) < 1e-6, axis=(1, 2)); rh[zero] = np.nan
    return np.concatenate([face, lh, pose, rh], axis=1)
files = sorted(glob.glob('raw/citizen/*.pose'))
gold = lambda f: low[re.sub(r'\s*\d+$', '', f.rsplit('/', 1)[1].split('-', 1)[1][:-5]).strip().lower()]
for zmode, swap in [(0, False), (1, False), (0, True)]:
    top1 = top5 = 0
    for f in files[: (len(files) if len(sys.argv) > 1 else 150)]:
        out = run(inputs=load(f, zmode, swap))['outputs']; rk = np.argsort(-out)
        g = gold(f); top1 += rk[0] == g; top5 += g in rk[:5]
    n = min(len(files), len(files) if len(sys.argv) > 1 else 150)
    print(f'z={zmode} swap={swap}: top-1 {top1/n:.3f}  top-5 {top5/n:.3f}  (n={n})')
