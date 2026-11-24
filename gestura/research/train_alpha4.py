# Letters v4. Training: Marxulia photos (+ mirrored re-tracked copies), ASLNow! web landmarks (+ mirrored),
# and EitanG98 photos (+ mirrored) from people outside the test fold. Scores are 5-fold cross-validation over the
# 720 EitanG98 photos (one person each), so every tested hand belongs to someone the model never saw.
import json, glob, numpy as np
from PIL import Image
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import StratifiedKFold
exec(open('train_alpha2.py').read().split('ex, ey = [], []')[0])
ex, ey = [], []
for f in sorted(glob.glob('raw/ext/*.jpg')):
    fe = extract(Image.open(f))
    if fe is not None: ex.append(fe[:63]); ey.append(LET.index(f.rsplit('_', 1)[1][:-4]))
K, Ky = np.array(ex), np.array(ey)
E = []
for f in sorted(glob.glob('raw/eitan/img/*.jpg')):
    fe = extract(Image.open(f)); E.append(fe[:63] if fe is not None else np.full(63, np.nan))
E = np.array(E); fl = np.load('alpha_flip.npz'); EF, Ey = fl['E'], fl['Ey']; XF, yF = fl['X'], fl['y']
ex2 = np.load('alpha_extra.npz'); N, Ny = ex2['N'], ex2['Ny']
def mirror(X): X = X.reshape(-1, 21, 3).copy(); X[..., 0] *= -1; return X.reshape(-1, 63)
ok = lambda A: np.isfinite(A[:, 0])
def fit(X, Y):
    Xa, ya = augment(X, Y, 3)
    return make_pipeline(StandardScaler(), MLPClassifier(hidden_layer_sizes=(256, 128), alpha=3e-3, max_iter=800, early_stopping=True, random_state=0)).fit(np.array([feat2(x) for x in Xa]), ya)
def acc(m, X, Y):
    k = ok(X); pr = m.predict_proba(np.array([feat2(x) for x in X[k]])); Y = Y[k]
    return np.mean(pr.argmax(1) == Y), np.mean([Y[i] in np.argsort(-pr[i])[:3] for i in range(len(Y))]), int(k.sum())
base = {'A marx+now': (np.vstack([X0[:, :63], N]), np.concatenate([y, Ny])),
        'B +mirrored copies': (np.vstack([X0[:, :63], XF, N, mirror(N)]), np.concatenate([y, yF, Ny, Ny]))}
skf = StratifiedKFold(5, shuffle=True, random_state=0); out = {}
for name, use_e in [('A marx+now', 0), ('B +mirrored copies', 0), ('B +mirrored copies', 1)]:
    X, Y = base[name]; r = []
    for tr, te in skf.split(E, Ey):
        Xt, Yt = X, Y
        if use_e:
            tr_o = tr[ok(E[tr])]; tr_f = tr[ok(EF[tr])]
            Xt = np.vstack([X, E[tr_o], EF[tr_f]]); Yt = np.concatenate([Y, Ey[tr_o], Ey[tr_f]])
        m = fit(Xt, Yt); r.append(acc(m, E[te], Ey[te]) + acc(m, EF[te], Ey[te]) + acc(m, K, Ky))
    r = np.array(r); label = name + (' + other people\'s EitanG98 photos' if use_e else '')
    print(f'{label:62s} unseen people: {r[:,0].mean():.3f} (top-3 {r[:,1].mean():.3f}) | same photos flipped {r[:,3].mean():.3f} | Keithsel {r[:,6].mean():.3f}', flush=True)
    out[label] = r.mean(0).tolist()
json.dump(out, open('alpha4_cv.json', 'w'), indent=1)
