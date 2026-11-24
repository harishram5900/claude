# Final letters model (settings chosen by train_alpha4.py cross-validation): all sources + mirrored copies.
import json, numpy as np
exec(open('train_alpha4.py').read().split("base = {")[0])
cv = json.load(open('alpha4_cv.json'))["B +mirrored copies + other people's EitanG98 photos"]
okE, okF = ok(E), ok(EF)
X = np.vstack([X0[:, :63], XF, N, mirror(N), E[okE], EF[okF]]); Y = np.concatenate([y, yF, Ny, Ny, Ey[okE], Ey[okF]])
m = fit(X, Y); sc, mlp = m.named_steps['standardscaler'], m.named_steps['mlpclassifier']
json.dump({'letters': LET, 'features': 'v2', 'mean': np.round(sc.mean_, 6).tolist(), 'scale': np.round(sc.scale_, 6).tolist(),
           'layers': [{'W': np.round(W, 5).tolist(), 'b': np.round(b, 5).tolist()} for W, b in zip(mlp.coefs_, mlp.intercepts_)],
           'shapes': {LET[c]: np.round(X0[y == c][:, :63].mean(0), 4).tolist() for c in range(26)},
           'eval': {'unseenPeople': round(cv[0], 4), 'unseenPeopleTop3': round(cv[1], 4), 'unseenN': 720, 'keithsel': round(cv[6], 4), 'keithselN': int(len(Ky)),
                    'trainHands': int(len(X)), 'people': '5-fold cross-validation over EitanG98: 720 photos, one person each, never in the fold\'s training data'}},
          open('/home/user/gestura/web/models/alphabet.json', 'w'), separators=(',', ':'))
json.dump({'raw': np.round(X0[5][:63], 6).tolist(), 'p': np.round(m.predict_proba(feat2(X0[5][:63])[None])[0], 6).tolist()}, open('alpha_check.json', 'w'))
print('trained on', len(X), 'hands; Keithsel', acc(m, K, Ky))
