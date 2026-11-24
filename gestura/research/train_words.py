# Train the everyday-word classifier on top of the ISLR embedding, using ASL Citizen's official signer split:
# train signers -> fit, validation signers -> choose settings, test signers (never seen) -> the reported numbers.
import glob, json, sys, numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
D = {'train': [], 'val': [], 'test': []}
for f in glob.glob('raw/emb/*.npz'):
    z = np.load(f); D[str(z['split'])].append((z['emb'].astype(np.float32), str(z['word'])))
labels = sorted({w for s in D.values() for _, w in s}); L = {w: i for i, w in enumerate(labels)}
print({k: len(v) for k, v in D.items()}, 'words', len(labels), flush=True)
def stack(rows, versions):
    X = np.vstack([e[versions] for e, _ in rows]); y = np.concatenate([[L[w]] * len(e[versions]) for e, w in rows]); return X, y
Xtr, ytr = stack(D['train'], slice(None)); Xtr0, ytr0 = stack(D['train'], slice(0, 1))
Xva, yva = stack(D['val'], slice(0, 1)); Xva_slow, yva_slow = stack(D['val'], slice(1, 3))
Xte, yte = stack(D['test'], slice(0, 1)); Xte_aug, yte_aug = stack(D['test'], slice(1, 3))
def ev(m, sc, X, y):
    P = m.predict_proba(sc.transform(X)); r = np.argsort(-P, 1)
    return float(np.mean(r[:, 0] == y)), float(np.mean((r[:, :5] == y[:, None]).any(1)))
res = []
for name, aug, mk in [
    ('logreg C=0.05', False, lambda: LogisticRegression(C=0.05, max_iter=300)),
    ('mlp512 a=1e-2 aug', True, lambda: MLPClassifier((512,), alpha=1e-2, early_stopping=True, max_iter=200, random_state=0)),
    ('mlp512 a=1e-1 aug', True, lambda: MLPClassifier((512,), alpha=1e-1, early_stopping=True, max_iter=200, random_state=0)),
    ('mlp768 a=3e-1 aug', True, lambda: MLPClassifier((768,), alpha=3e-1, early_stopping=True, max_iter=200, random_state=0)),
]:
    X, y = (Xtr, ytr) if aug else (Xtr0, ytr0)
    sc = StandardScaler().fit(X); m = mk().fit(sc.transform(X), y)
    va, vs = ev(m, sc, Xva, yva), ev(m, sc, Xva_slow, yva_slow); res.append((va[0], name, m, sc))
    print(f'{name:22s} val top1 {va[0]:.3f} top5 {va[1]:.3f} | val at low fps/jitter top1 {vs[0]:.3f}', flush=True)
best = max(res, key=lambda r: r[0]); _, name, m, sc = best
# final: refit the chosen settings on train + validation signers, report on the untouched test signers
Xf = np.vstack([Xtr, stack(D['val'], slice(None))[0]]); yf = np.concatenate([ytr, stack(D['val'], slice(None))[1]])
sc = StandardScaler().fit(Xf); m = type(m)(**m.get_params()).fit(sc.transform(Xf), yf)
t, ta = ev(m, sc, Xte, yte), ev(m, sc, Xte_aug, yte_aug)
P = m.predict_proba(sc.transform(Xte)); per = {w: float(np.mean(P[yte == i].argmax(1) == i)) for i, w in enumerate(labels)}
print(f'CHOSEN {name}: TEST (unseen signers) top1 {t[0]:.3f} top5 {t[1]:.3f} | low fps/jitter top1 {ta[0]:.3f} top5 {ta[1]:.3f} | clips {len(yte)}')
W = [c.astype(np.float32) for c in m.coefs_] if hasattr(m, 'coefs_') else [m.coef_.T.astype(np.float32)]
B = [b.astype(np.float32) for b in m.intercepts_] if hasattr(m, 'intercepts_') else [m.intercept_.astype(np.float32)]
blob = b''.join(np.ascontiguousarray(a).tobytes() for pair in zip(W, B) for a in pair)
open('../web/models/signs_head.bin', 'wb').write(blob)
json.dump({'labels': labels, 'mean': np.round(sc.mean_, 6).tolist(), 'scale': np.round(sc.scale_, 6).tolist(),
           'shapes': [[list(w.shape), [len(b)]] for w, b in zip(W, B)], 'bin': 'signs_head.bin',
           'eval': {'top1': round(t[0], 4), 'top5': round(t[1], 4), 'lowFpsTop1': round(ta[0], 4), 'lowFpsTop5': round(ta[1], 4), 'clips': int(len(yte)),
                    'words': len(labels), 'trainClips': int(len(D['train']) + len(D['val'])), 'model': name,
                    'source': 'ASL Citizen official test split: signers never seen in training'}, 'perWord': per},
          open('../web/models/signs_head.json', 'w'), separators=(',', ':'))
print('worst words', sorted(per.items(), key=lambda x: x[1])[:15])
