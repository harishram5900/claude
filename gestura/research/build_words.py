# Download ASL Citizen poses for the everyday vocabulary, trim to the signing span, augment, and embed with the
# Kaggle 1st-place ISLR ensemble (pooled features). Saves one small npz per clip so it can resume.
import json, os, re, sys, urllib.request, urllib.parse, numpy as np, csv
from multiprocessing import Pool
from vocab import VOCAB
OUT = 'raw/emb'; os.makedirs(OUT, exist_ok=True)
paths = json.load(open('raw/meta/all_paths.json'))
split = {r['sample_id']: r['split'] for r in csv.DictReader(open('raw/meta/samples.csv'))}
g2w = {g: w for w, gs in VOCAB.items() for g in gs}
gloss = lambda p: re.sub(r'\s*\d+$', '', p.rsplit('/', 1)[1].split('-', 1)[1][:-5]).strip().lower()
jobs = []
for p in paths:
    w = g2w.get(gloss(p)); sid = p.rsplit('/', 1)[1][:-5]
    if w and sid in split: jobs.append((p, w, split[sid]))
print('clips', len(jobs), 'words', len({j[1] for j in jobs}), flush=True)

def load(raw):
    from pose_format import Pose
    p = Pose.read(raw); d = p.body.data[:, 0]; m = np.ma.getmaskarray(d)
    a = np.array(d.filled(np.nan), dtype=np.float32); a[m] = np.nan
    W, H = p.header.dimensions.width, p.header.dimensions.height
    a[..., 0] /= W; a[..., 1] /= H; a[..., 2] = 0
    pose, face, lh, rh = a[:, 0:33], a[:, 33:501], a[:, 501:522], a[:, 522:543]
    for h in (lh, rh):
        z = np.all(np.abs(np.nan_to_num(h)) < 1e-6, axis=(1, 2)); h[z] = np.nan
    return np.concatenate([face, lh, pose, rh], axis=1), float(p.body.fps)

def active(x):
    # A hand counts as signing when it is visible and its wrist is above chest level (shoulder line + 1.1 x
    # shoulder width). Same rule as the live app (web/js/words.js), so training clips look like live clips.
    sh = x[:, 468 + 21 + 11, :2], x[:, 468 + 21 + 12, :2]
    sy = np.nanmean(np.stack([sh[0][:, 1], sh[1][:, 1]]), 0); sw = np.abs(sh[0][:, 0] - sh[1][:, 0])
    sy = np.where(np.isnan(sy), np.nanmedian(sy) if np.isfinite(np.nanmedian(sy)) else 0.6, sy)
    sw = np.where(np.isnan(sw), np.nanmedian(sw) if np.isfinite(np.nanmedian(sw)) else 0.25, sw)
    line = sy + 1.1 * sw; a = np.zeros(len(x), bool)
    for o in (468, 522):
        wy = x[:, o, 1]; a |= np.isfinite(wy) & (wy < line)
    return a

def trim(x, fps=30):
    # first signing span: from the first active frame until the hands have been down for 0.35 s
    a = active(x); idx = np.where(a)[0]
    if len(idx) < 4: return x
    gap = max(3, round(0.35 * fps)); s = idx[0]; e = s
    for i in idx[1:]:
        if i - e > gap: break
        e = i
    seg = x[s: e + 1]
    return seg if len(seg) >= 6 else x[idx[0]: idx[-1] + 1]

def augment(x, rng):
    T = len(x); rate = rng.uniform(0.35, 1.15)          # live camera runs at roughly 10-30 fps
    n = max(6, int(round(T * rate))); idx = np.clip(np.round(np.linspace(0, T - 1, n)).astype(int), 0, T - 1); x = x[idx].copy()
    s = rng.uniform(0.85, 1.15); ang = np.deg2rad(rng.uniform(-10, 10)); c, si = np.cos(ang), np.sin(ang)
    cx, cy = np.nanmean(x[..., 0]), np.nanmean(x[..., 1]); dx, dy = rng.uniform(-0.08, 0.08, 2)
    X, Y = x[..., 0] - cx, x[..., 1] - cy
    x[..., 0] = (c * X - si * Y) * s * rng.uniform(0.95, 1.05) + cx + dx; x[..., 1] = (si * X + c * Y) * s + cy + dy
    for a, b in ((468, 489), (522, 543)):                 # missed hand detections
        drop = rng.random(len(x)) < rng.uniform(0, 0.15); x[drop, a:b] = np.nan
    return x

sess = None
def work(job):
    global sess
    p, w, sp = job; out = f'{OUT}/{p.rsplit("/", 1)[1][:-5]}.npz'
    if os.path.exists(out): return 1
    import onnxruntime as ort
    if sess is None:
        o = ort.SessionOptions(); o.intra_op_num_threads = 1; sess = ort.InferenceSession('raw/islr_emb.onnx', o)
    try:
        raw = urllib.request.urlopen('https://huggingface.co/datasets/SorensenAI/asl-citizen-poses/resolve/main/' + urllib.parse.quote(p), timeout=60).read()
        x, fps = load(raw); x = trim(x, fps)
        rng = np.random.default_rng(abs(hash(p)) % 2**32)
        vers = [x] + [augment(x, rng) for _ in range(8 if sp == 'train' else 2)]
        E = np.stack([sess.run(['emb'], {'serving_default_inputs:0': v.astype(np.float32)})[0][0] for v in vers]).astype(np.float16)
        np.savez(out, emb=E, word=w, split=sp, T=len(x), fps=fps); return 1
    except Exception as e:
        print('ERR', p, e, flush=True); return 0

if __name__ == '__main__':
    lim = int(sys.argv[1]) if len(sys.argv) > 1 else None
    J = jobs[:lim] if lim else jobs
    done = 0
    with Pool(4) as pool:
        for r in pool.imap_unordered(work, J, chunksize=4):
            done += r
            if done % 250 == 0: print('done', done, '/', len(J), flush=True)
    print('finished', done, flush=True)
