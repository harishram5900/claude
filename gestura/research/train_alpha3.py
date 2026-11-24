# Fingerspelling model v3: Marxulia photos + ASLNow! web landmarks, mirror + rotation augmentation.
# Model choice uses the small Keithsel set; the reported score is EitanG98 (672 photos, 672 different people), never trained on.
import json, glob, sys, numpy as np
from PIL import Image
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
exec(open('train_alpha2.py').read().split('ex, ey = [], []')[0])
d = np.load('alpha_extra.npz'); E, Ey, N, Ny = d['E'], d['Ey'], d['N'], d['Ny']
ex, ey = [], []
for f in sorted(glob.glob('raw/ext/*.jpg')):
    fe = extract(Image.open(f))
    if fe is not None: ex.append(fe[:63]); ey.append(LET.index(f.rsplit('_', 1)[1][:-4]))
K, Ky = np.array(ex), np.array(ey)
def mirror(X): X = X.reshape(-1, 21, 3).copy(); X[..., 0] *= -1; return X.reshape(-1, 63)
def score(m, X, Y):
    pr = m.predict_proba(np.array([feat2(x) for x in X])); return np.mean(pr.argmax(1) == Y), np.mean([Y[i] in np.argsort(-pr[i])[:3] for i in range(len(Y))])
old = json.load(open('/home/user/gestura/web/models/alphabet.json'))
def old_prob(x):
    h = (feat2(x) - np.array(old['mean'])) / np.array(old['scale'])
    for i, L in enumerate(old['layers']): h = h @ np.array(L['W']) + np.array(L['b']); h = np.maximum(h, 0) if i < len(old['layers']) - 1 else h
    return h
print('current model on Eitan:', np.mean([old_prob(x).argmax() == y for x, y in zip(E, Ey)]), 'Keithsel:', np.mean([old_prob(x).argmax() == y for x, y in zip(K, Ky)]))
configs = {
  'marx': (X0[:, :63], y, False), 'marx+now': (np.vstack([X0[:, :63], N]), np.concatenate([y, Ny]), False),
  'marx+now+mirrorNow': (np.vstack([X0[:, :63], N, mirror(N)]), np.concatenate([y, Ny, Ny]), False),
  'marx+now+mirrorAll': (np.vstack([X0[:, :63], N]), np.concatenate([y, Ny]), True)}
res = {}
for name, (X, Y, mall) in configs.items():
    if mall: X, Y = np.vstack([X, mirror(X)]), np.concatenate([Y, Y])
    Xa, ya = augment(X, Y, 3)
    for hid in [(192, 96), (384, 192)]:
        m = make_pipeline(StandardScaler(), MLPClassifier(hidden_layer_sizes=hid, alpha=3e-3, max_iter=800, early_stopping=True, random_state=0)).fit(np.array([feat2(x) for x in Xa]), ya)
        k1, k3 = score(m, K, Ky); e1, e3 = score(m, E, Ey); res[(name, hid)] = (k1, e1, e3, m)
        print(f'{name:22s} {hid}: Keithsel {k1:.3f} | Eitan {e1:.3f} top3 {e3:.3f}', flush=True)
import pickle; pickle.dump({k: v for k, v in res.items()}, open('raw/alpha3_models.pkl', 'wb'))
