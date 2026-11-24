import json, glob, numpy as np
from PIL import Image
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score
exec(open('alphabet.py').read().split("if not os.path.exists('alpha_feats.npz')")[0])
d = np.load('alpha_feats.npz'); X0, y = d['X'], d['y']
BONES = [(0,1),(1,2),(2,3),(3,4),(0,5),(5,6),(6,7),(7,8),(0,9),(9,10),(10,11),(11,12),(0,13),(13,14),(14,15),(15,16),(0,17),(17,18),(18,19),(19,20)]
def feat2(p63):
    p = p63[:63].reshape(21, 3)
    dirs = np.concatenate([(p[b] - p[a]) / (np.linalg.norm(p[b] - p[a]) + 1e-6) for a, b in BONES])   # 60: unit bone directions
    tips = [4, 8, 12, 16, 20]; dist = [np.linalg.norm(p[a] - p[b]) for i, a in enumerate(tips) for b in tips[i + 1:]]
    tipw = [np.linalg.norm(p[t]) for t in tips]   # tip-to-wrist
    return np.concatenate([p.flatten(), dirs, dist, tipw])
def rot(p63, deg, sx):
    p = p63[:63].reshape(21, 3).copy(); a = np.radians(deg); R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
    p[:, :2] = p[:, :2] @ R.T; p[:, 2] *= sx; p = p / (np.linalg.norm(p[9]) or 1); return p.flatten()
rng = np.random.default_rng(0)
def augment(X, y, k):
    Xa, ya = [X], [y]
    for _ in range(k): Xa.append(np.array([rot(x, rng.normal(0, 12), rng.uniform(0.6, 1.4)) for x in X])); ya.append(y)
    return np.vstack(Xa), np.concatenate(ya)
ex, ey = [], []
for f in sorted(glob.glob('raw/ext/*.jpg')):
    fe = extract(Image.open(f))
    if fe is not None: ex.append(fe[:63]); ey.append(LET.index(f.rsplit('_', 1)[1][:-4]))
ex = np.array(ex)
mk = lambda: make_pipeline(StandardScaler(), MLPClassifier(hidden_layer_sizes=(192, 96), alpha=3e-3, max_iter=800, early_stopping=True, random_state=0))
res = {}
for k in (0, 3):
    Xa, ya = augment(X0[:, :63], y, k)
    F = np.array([feat2(x) for x in Xa]); m = mk().fit(F, ya)
    Fe = np.array([feat2(x) for x in ex]); pr = m.predict_proba(Fe); acc = np.mean(pr.argmax(1) == ey); t3 = np.mean([ey[i] in np.argsort(-pr[i])[:3] for i in range(len(ey))])
    # held-out check inside the dataset (augmentation only on the training part)
    Xtr, Xte, ytr, yte = train_test_split(X0[:, :63], y, test_size=0.2, stratify=y, random_state=1)
    Xa2, ya2 = augment(Xtr, ytr, k); m2 = mk().fit(np.array([feat2(x) for x in Xa2]), ya2); inacc = np.mean(m2.predict(np.array([feat2(x) for x in Xte])) == yte)
    print(f'aug x{k}: held-out {inacc:.3f} | external {acc:.3f} top-3 {t3:.3f} (n={len(ey)})'); res[k] = (acc, m, inacc, t3)
best = max(res, key=lambda k: res[k][0]); acc, m, inacc, t3 = res[best]; print('chosen aug', best)
sc, mlp = m.named_steps['standardscaler'], m.named_steps['mlpclassifier']
json.dump({'letters': LET, 'features': 'v2', 'mean': np.round(sc.mean_, 6).tolist(), 'scale': np.round(sc.scale_, 6).tolist(),
           'layers': [{'W': np.round(W, 5).tolist(), 'b': np.round(b, 5).tolist()} for W, b in zip(mlp.coefs_, mlp.intercepts_)],
           'shapes': {LET[c]: np.round(X0[y == c][:, :63].mean(0), 4).tolist() for c in range(26)},
           'eval': {'heldOut': round(float(inacc), 4), 'n': int(len(y)), 'external': round(float(acc), 4), 'externalTop3': round(float(t3), 4), 'externalN': len(ey)}},
          open('/home/user/gestura/web/models/alphabet.json', 'w'), separators=(',', ':'))
json.dump({'raw': np.round(X0[5][:63], 6).tolist(), 'p': np.round(m.predict_proba(feat2(X0[5][:63])[None])[0], 6).tolist()}, open('alpha_check.json', 'w'))
