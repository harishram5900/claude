import json, glob, numpy as np
from PIL import Image
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, confusion_matrix
exec(open('alphabet.py').read().split("if not os.path.exists('alpha_feats.npz')")[0])
d = np.load('alpha_feats.npz'); X, y = d['X'], d['y']
# J and Z are moving letters; static photos only capture their end shape, so they are handled separately in the app.
mk = lambda: make_pipeline(StandardScaler(), MLPClassifier(hidden_layer_sizes=(128, 64), alpha=1e-3, max_iter=600, early_stopping=True, random_state=0))
cvp = cross_val_predict(mk(), X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0))
print('5-fold CV accuracy (same dataset):', round(accuracy_score(y, cvp), 4))
m = mk().fit(X, y)
# external: different photos, different people
ex, ey = [], []
for f in sorted(glob.glob('raw/ext/*.jpg')):
    lab = f.rsplit('_', 1)[1][:-4]; fe = extract(Image.open(f))
    if fe is not None: ex.append(fe); ey.append(LET.index(lab))
pe = m.predict(np.array(ex)); acc = accuracy_score(ey, pe)
pr = m.predict_proba(np.array(ex)); top3 = np.mean([ey[i] in np.argsort(-pr[i])[:3] for i in range(len(ey))])
print(f'external accuracy: {acc:.3f} top-3 {top3:.3f} on {len(ey)} images with a detected hand (of {len(glob.glob("raw/ext/*.jpg"))})')
wrong = [(LET[a], LET[b]) for a, b in zip(ey, pe) if a != b]; print('confusions:', wrong)
# export: scaler + MLP weights, and the average hand shape of each letter (for teaching)
sc, mlp = m.named_steps['standardscaler'], m.named_steps['mlpclassifier']
mean_shape = {LET[c]: np.round(X[y == c][:, :63].mean(0), 4).tolist() for c in range(26)}
json.dump({'letters': LET, 'mean': np.round(sc.mean_, 6).tolist(), 'scale': np.round(sc.scale_, 6).tolist(),
           'layers': [{'W': np.round(W, 6).tolist(), 'b': np.round(b, 6).tolist()} for W, b in zip(mlp.coefs_, mlp.intercepts_)],
           'shapes': mean_shape,
           'eval': {'cv': round(float(accuracy_score(y, cvp)), 4), 'n': int(len(y)), 'external': round(float(acc), 4), 'externalTop3': round(float(top3), 4), 'externalN': len(ey)}},
          open('/home/user/gestura/web/models/alphabet.json', 'w'), separators=(',', ':'))
# a reference input/output pair so the browser implementation can be checked against Python
json.dump({'x': np.round(X[0], 6).tolist(), 'p': np.round(m.predict_proba(X[:1])[0], 6).tolist()}, open('alpha_check.json', 'w'))
