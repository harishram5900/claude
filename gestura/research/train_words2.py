# Final word classifier. Same data and split as train_words.py (logistic regression won on validation signers),
# with signs that are identical in ASL merged into one class (English context picks the meaning).
import glob, json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
SAME = {'toilet': 'bathroom/toilet', 'bathroom': 'bathroom/toilet', 'nice': 'nice/clean', 'clean': 'nice/clean', 'street': 'street/road', 'road': 'street/road',
        'old': 'old/age', 'age': 'old/age', 'need': 'need/should', 'should': 'need/should', 'hurt': 'hurt/pain', 'pain': 'hurt/pain',
        'sing': 'sing/music', 'music': 'sing/music', 'play': 'play/party', 'party': 'play/party'}
D = {'train': [], 'val': [], 'test': []}
for f in glob.glob('raw/emb/*.npz'):
    z = np.load(f); w = str(z['word']); D[str(z['split'])].append((z['emb'].astype(np.float32), SAME.get(w, w)))
labels = sorted({w for s in D.values() for _, w in s}); L = {w: i for i, w in enumerate(labels)}
def stack(rows, v):
    return np.vstack([e[v] for e, _ in rows]), np.concatenate([[L[w]] * len(e[v]) for e, w in rows])
Xf, yf = stack(D['train'] + D['val'], slice(None)); Xte, yte = stack(D['test'], slice(0, 1)); Xta, yta = stack(D['test'], slice(1, 3))
sc = StandardScaler().fit(Xf); m = LogisticRegression(C=0.05, max_iter=300).fit(sc.transform(Xf), yf)
def ev(X, y):
    P = m.predict_proba(sc.transform(X)); r = np.argsort(-P, 1); return P, float(np.mean(r[:, 0] == y)), float(np.mean((r[:, :5] == y[:, None]).any(1)))
P, t1, t5 = ev(Xte, yte); _, a1, a5 = ev(Xta, yta)
print(f'words {len(labels)} | TEST unseen signers top1 {t1:.3f} top5 {t5:.3f} | low fps/jitter top1 {a1:.3f} top5 {a5:.3f} | clips {len(yte)}')
conf = P.max(1); ok = P.argmax(1) == yte
for th in (0.15, 0.2, 0.25, 0.3, 0.4, 0.5): k = conf >= th; print(f'  accept p>={th}: answers {k.mean():.3f} of signs, correct when it answers {ok[k].mean():.3f}')
per = {w: float(np.mean(P[yte == i].argmax(1) == i)) for i, w in enumerate(labels)}
W, B = m.coef_.T.astype(np.float32), m.intercept_.astype(np.float32)
open('../web/models/signs_head.bin', 'wb').write(np.ascontiguousarray(W).tobytes() + B.tobytes())
json.dump({'labels': labels, 'mean': np.round(sc.mean_, 6).tolist(), 'scale': np.round(sc.scale_, 6).tolist(), 'shapes': [[list(W.shape), [len(B)]]],
           'eval': {'top1': round(t1, 4), 'top5': round(t5, 4), 'lowFpsTop1': round(a1, 4), 'lowFpsTop5': round(a5, 4), 'clips': int(len(yte)), 'words': len(labels),
                    'englishWords': len({x for w in labels for x in w.split('/')}), 'trainClips': len(D['train']) + len(D['val']), 'signers': 'ASL Citizen official test split (signers never seen in training)',
                    'model': 'Kaggle ISLR 1st-place embedding + logistic regression'}, 'perWord': per},
          open('../web/models/signs_head.json', 'w'), separators=(',', ':'))
print('weakest', sorted(per.items(), key=lambda x: x[1])[:12])
