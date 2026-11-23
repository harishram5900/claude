"""Kinora research pipeline: real data from people assessed for Parkinson's disease.

Datasets (all public, research use):
  1. neuroQWERTY MIT-CS1PD + CS2PD (PhysioNet; Giancardo et al., Sci Rep 2016): 85 people, natural typing
     on a laptop, clinician UPDRS-III, alternating finger tapping (afTap), single-key tapping (sTap).
  2. UCI Parkinson Disease Spiral Drawings (Isenkul et al. 2014): 25 PD + 15 controls, raw tablet traces.
  3. UCI Parkinsons (Little et al. 2007/2009): 195 sustained-vowel recordings from 31 people (23 PD).
  4. UCI Parkinsons Telemonitoring (Tsanas et al. 2010): 5,875 recordings from 42 people with PD, motor UPDRS.

Every model is evaluated leaving one PERSON out at a time (no recording of a test person is ever seen in
training), and AUCs carry 2,000-sample bootstrap 95% confidence intervals.
"""
import csv, glob, json, os, re
import numpy as np
from scipy.stats import mannwhitneyu, spearmanr
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import roc_auc_score, roc_curve

RAW = 'raw/'; OUT = {}
rng = np.random.default_rng(0)

def auc_ci(y, s, n=2000):
    y, s = np.asarray(y), np.asarray(s); a = roc_auc_score(y, s); bs = []
    for _ in range(n):
        i = rng.integers(0, len(y), len(y))
        if len(set(y[i])) == 2: bs.append(roc_auc_score(y[i], s[i]))
    return round(a, 3), [round(float(np.percentile(bs, 2.5)), 3), round(float(np.percentile(bs, 97.5)), 3)]

def feature_report(name, y, x, unit, higher_in_pd=None):
    y, x = np.asarray(y), np.asarray(x, float); ok = ~np.isnan(x); y, x = y[ok], x[ok]
    a, ci = auc_ci(y, x)
    flip = a < 0.5
    if flip: a, ci = round(1 - a, 3), [round(1 - ci[1], 3), round(1 - ci[0], 3)]
    p = mannwhitneyu(x[y == 1], x[y == 0]).pvalue
    return {'name': name, 'unit': unit, 'auc': a, 'ci': ci, 'p': float(p), 'higherInPD': bool(not flip),
            'pd': np.round(np.sort(x[y == 1]), 5).tolist(), 'control': np.round(np.sort(x[y == 0]), 5).tolist(),
            'nPD': int((y == 1).sum()), 'nControl': int((y == 0).sum())}

def loo_model(X, y, groups=None):
    """Logistic regression; leave-one-person-out probabilities, then AUC + ROC."""
    X, y = np.asarray(X, float), np.asarray(y); groups = np.arange(len(y)) if groups is None else np.asarray(groups)
    p = np.zeros(len(y))
    for g in np.unique(groups):
        te = groups == g; m = make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=2000)); m.fit(X[~te], y[~te]); p[te] = m.predict_proba(X[te])[:, 1]
    # person-level score = mean of that person's recordings
    ug = np.unique(groups); yp = np.array([y[groups == g][0] for g in ug]); pp = np.array([p[groups == g].mean() for g in ug])
    a, ci = auc_ci(yp, pp); fpr, tpr, _ = roc_curve(yp, pp)
    # sensitivity at 80% specificity
    sens80 = float(max(t for f, t in zip(fpr, tpr) if f <= 0.2))
    return {'auc': a, 'ci': ci, 'n': int(len(ug)), 'nPD': int(yp.sum()), 'roc': [[round(float(f), 3), round(float(t), 3)] for f, t in zip(fpr, tpr)], 'sensAt80Spec': round(sens80, 3)}

# ------------------------------------------------------------------ 1. neuroQWERTY typing + tapping
NQ = glob.glob(RAW + 'neuroqwerty*/*/')[0]
def hold_times(path):
    ht = []; last_press = -1
    for row in csv.reader(open(path)):
        if len(row) < 4: continue
        key = row[0].strip('"'); h, rel, prs = (float(v) for v in row[1:4])
        if not (0 < h < 5) or prs <= 0 or rel <= 0 or prs < last_press: continue
        last_press = prs
        k = key.lower()
        if k.startswith('mouse') or k in ('backspace', 'shift_l', 'shift_r', 'control_l', 'control_r', 'alt_l', 'alt_r', 'caps_lock', 'super_l', 'tab', 'escape'): continue
        ht.append(h)
    return np.array(ht)
def typing_features(ht):
    ht = ht[(ht > 0.01) & (ht < 1.5)]
    q = np.percentile(ht, [10, 25, 50, 75, 90])
    return {'median': q[2] * 1000, 'iqr': (q[3] - q[1]) * 1000, 'p90': q[4] * 1000, 'cv': ht.std() / ht.mean(), 'longShare': float((ht > 0.2).mean()), 'keys': int(len(ht))}
people = []
for ds in ('MIT-CS1PD', 'MIT-CS2PD'):
    for r in csv.DictReader(open(f'{NQ}{ds}/GT_DataPD_{ds}.csv')):
        files = [r[k] for k in ('file_1', 'file_2') if r.get(k)]
        fts = [typing_features(hold_times(f'{NQ}{ds}/data_{ds}/{f}')) for f in files]
        f = {k: float(np.mean([x[k] for x in fts])) for k in fts[0]}
        num = lambda v: float(v) if v not in ('', None) else np.nan
        people.append({'ds': ds, 'pd': r['gt'] == 'True', 'updrs': num(r['updrs108']), 'afTap': num(r['afTap']), 'sTap': num(r['sTap']), 'nq': num(r['nqScore']), **f})
y = np.array([p['pd'] for p in people]).astype(int)
typing = {'n': len(people), 'nPD': int(y.sum()), 'features': [
    feature_report('Median key hold time', y, [p['median'] for p in people], 'ms'),
    feature_report('Hold-time spread (IQR)', y, [p['iqr'] for p in people], 'ms'),
    feature_report('Slow presses (hold > 200 ms)', y, [p['longShare'] * 100 for p in people], '% of keys'),
    feature_report('Hold-time variability (CV)', y, [p['cv'] for p in people], '')]}
Xt = [[p['median'], p['iqr'], p['longShare'], p['cv']] for p in people]
typing['model'] = loo_model(Xt, y)
typing['model']['features'] = 'median hold, IQR, share > 200 ms, CV'
typing['nqScorePublished'] = feature_report('neuroQWERTY score (published algorithm)', y, [p['nq'] for p in people], '')
typing['keysPerPerson'] = int(np.median([p['keys'] for p in people]))
rho, pv = spearmanr([p['iqr'] for p in people if p['pd'] and not np.isnan(p['updrs'])], [p['updrs'] for p in people if p['pd'] and not np.isnan(p['updrs'])])
typing['iqrVsUpdrsInPD'] = {'rho': round(float(rho), 3), 'p': float(pv)}
OUT['typing'] = typing
# finger tapping measured in the clinic for the same people
tap_people = [p for p in people if not np.isnan(p['afTap'])]
OUT['tapping'] = {'source': 'neuroQWERTY clinical tapping tests (same 85 people where recorded)', 'features': [
    feature_report('Alternating finger tapping (afTap)', [p['pd'] for p in tap_people], [p['afTap'] for p in tap_people], 'taps / 30 s'),
    feature_report('Single-key tapping (sTap)', [p['pd'] for p in people if not np.isnan(p['sTap'])], [p['sTap'] for p in people if not np.isnan(p['sTap'])], 'taps / 60 s')]}
both = [p for p in people if p['pd'] and not np.isnan(p['afTap']) and not np.isnan(p['updrs'])]
r1, p1 = spearmanr([p['afTap'] for p in both], [p['updrs'] for p in both]); OUT['tapping']['afTapVsUpdrsInPD'] = {'rho': round(float(r1), 3), 'p': float(p1), 'n': len(both)}

# ------------------------------------------------------------------ 2. spiral drawings
SP = glob.glob(RAW + 'parkinson+disease+spiral*/hw_dataset/')[0]
def mavg(y, w):
    c = np.concatenate([[0], np.cumsum(y)]); h = w // 2; i = np.arange(len(y)); a = np.maximum(0, i - h); b = np.minimum(len(y), i + h + 1); return (c[b] - c[a]) / (b - a)
def spiral_features(path, test):
    d = np.array([[float(v) for v in l.strip().split(';')] for l in open(path) if l.strip()])
    d = d[d[:, 6] == test]
    if len(d) < 200: return None
    t = (d[:, 5] - d[0, 5]); keep = np.concatenate([[True], np.diff(t) > 0]); d, t = d[keep], t[keep]
    x, yy = d[:, 0], d[:, 1]; cx, cy = (x.max() + x.min()) / 2, (yy.max() + yy.min()) / 2
    r = np.hypot(x - cx, yy - cy); R = np.percentile(r, 98)
    tu = np.arange(0, t[-1], 1000 / 60); ru = np.interp(tu, t, r)   # 60 Hz, as in the app
    hp = ru - mavg(ru, 24); tremor = np.sqrt(np.mean(hp ** 2)) / R * 100
    seg = np.hypot(np.diff(x), np.diff(yy)); dt = np.diff(t) / 1000
    v = np.interp(tu[:-1], t[:-1], seg / np.maximum(dt, 1e-3)) / R
    spec = np.abs(np.fft.rfft(hp * np.hanning(len(hp)))) ** 2; f = np.fft.rfftfreq(len(hp), 1 / 60)
    band = spec[(f >= 3.5) & (f <= 8)].sum() / max(spec[(f >= 1) & (f <= 20)].sum(), 1e-12)
    pr = d[:, 3]; return {'tremorPct': tremor, 'speed': float(np.median(v)), 'speedCV': float(np.std(v) / np.mean(v)), 'bandShare': float(band), 'seconds': float(t[-1] / 1000), 'pressureCV': float(pr.std() / pr.mean())}
sp_people = []
for grp, lab in (('control', 0), ('parkinson', 1)):
    for f in sorted(glob.glob(SP + grp + '/*.txt')):
        s = spiral_features(f, 0)
        if s: sp_people.append({'pd': lab, **s})
ys = [p['pd'] for p in sp_people]
OUT['spiral'] = {'n': len(sp_people), 'nPD': int(sum(ys)), 'test': 'static spiral (trace over a printed spiral)', 'features': [
    feature_report('Spiral tremor (fast radial wobble)', ys, [p['tremorPct'] for p in sp_people], '% of spiral radius'),
    feature_report('Drawing speed', ys, [p['speed'] for p in sp_people], 'radii / s'),
    feature_report('Speed variability (CV)', ys, [p['speedCV'] for p in sp_people], ''),
    feature_report('Share of wobble in 3.5–8 Hz band', ys, [p['bandShare'] * 100 for p in sp_people], '%'),
    feature_report('Pen pressure variability (stylus only)', ys, [p['pressureCV'] for p in sp_people], 'CV')]}
OUT['spiral']['model'] = loo_model([[p['tremorPct'], p['speed'], p['speedCV'], p['bandShare']] for p in sp_people], ys)
OUT['spiral']['model']['features'] = 'tremor, speed, speed variability, tremor-band share (finger-only measures)'
OUT['spiral']['modelStylus'] = loo_model([[p['tremorPct'], p['speed'], p['speedCV'], p['bandShare'], p['pressureCV']] for p in sp_people], ys)

# ------------------------------------------------------------------ 3. voice (UCI Parkinsons)
rows = list(csv.DictReader(open(RAW + 'parkinsons/parkinsons.data')))
subj = [re.match(r'phon_R01_S(\d+)_', r['name']).group(1) for r in rows]
yv = np.array([int(r['status']) for r in rows])
J, Sh, H = (np.array([float(r[k]) for r in rows]) for k in ('MDVP:Jitter(%)', 'MDVP:Shimmer', 'HNR'))
def per_person(v):
    us = sorted(set(subj)); return [int(yv[[s == u for s in subj]][0]) for u in us], [float(np.mean(v[[s == u for s in subj]])) for u in us]
OUT['voice'] = {'n': len(set(subj)), 'nPD': int(sum(per_person(J)[0])), 'recordings': len(rows), 'features': [
    feature_report('Jitter (cycle-to-cycle pitch change)', *per_person(J * 100), '%'),
    feature_report('Shimmer (cycle-to-cycle loudness change)', *per_person(Sh * 100), '%'),
    feature_report('Harmonics-to-noise ratio', *per_person(H), 'dB')]}
OUT['voice']['model'] = loo_model(np.c_[np.log(J), np.log(Sh), H], yv, subj)
OUT['voice']['model']['features'] = 'jitter, shimmer, HNR (the three Kinora measures)'

# ------------------------------------------------------------------ 4. telemonitoring: voice vs motor UPDRS
tm = list(csv.DictReader(open(RAW + 'parkinsons+telemonitoring/parkinsons_updrs.data')))
ts = np.array([int(r['subject#']) for r in tm]); mu = np.array([float(r['motor_UPDRS']) for r in tm])
cor = {}
for k, lab in (('Jitter(%)', 'Jitter'), ('Shimmer', 'Shimmer'), ('HNR', 'HNR')):
    v = np.array([float(r[k]) for r in tm]); us = np.unique(ts)
    rb, pb = spearmanr([v[ts == u].mean() for u in us], [mu[ts == u].mean() for u in us])
    cor[lab] = {'betweenPeople': round(float(rb), 3), 'p': float(pb)}
OUT['telemonitoring'] = {'n': int(len(np.unique(ts))), 'recordings': len(tm), 'motorUpdrsRange': [round(float(mu.min()), 1), round(float(mu.max()), 1)], 'correlations': cor}

OUT['meta'] = {'peopleTotal': len(people) + len(sp_people) + OUT['voice']['n'] + OUT['telemonitoring']['n'], 'recordingsTotal': len(rows) + len(tm) + len(sp_people) + sum(1 + bool(p['ds'] == 'MIT-CS1PD') for p in people)}
os.makedirs('../web/data', exist_ok=True)
json.dump(OUT, open('../web/data/research.json', 'w'), separators=(',', ':'))
# readable summary
for k in ('typing', 'spiral', 'voice'):
    o = OUT[k]; print(f"\n== {k}: n={o['n']} (PD {o['nPD']})  model AUC {o['model']['auc']} {o['model']['ci']}  sens@80%spec {o['model']['sensAt80Spec']}")
    for f in o['features']: print(f"   {f['name']:<45} AUC {f['auc']:.3f} {f['ci']}  p={f['p']:.3g}  PD median {np.median(f['pd']):.4g} vs control {np.median(f['control']):.4g} {f['unit']}")
print('\n== tapping'); [print(f"   {f['name']:<45} AUC {f['auc']:.3f} {f['ci']} p={f['p']:.3g} PD median {np.median(f['pd']):.4g} vs control {np.median(f['control']):.4g} (n {f['nPD']}/{f['nControl']})") for f in OUT['tapping']['features']]
print('   afTap vs UPDRS in PD', OUT['tapping']['afTapVsUpdrsInPD'])
print('   published nqScore', OUT['typing']['nqScorePublished']['auc'], OUT['typing']['nqScorePublished']['ci'], '| IQR vs UPDRS', OUT['typing']['iqrVsUpdrsInPD'], '| keys/person', OUT['typing']['keysPerPerson'])
print('== telemonitoring', OUT['telemonitoring']['n'], OUT['telemonitoring']['recordings'], OUT['telemonitoring']['correlations'])
print('== meta', OUT['meta'])
