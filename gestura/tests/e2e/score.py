import json, glob, sys
R = [r for f in sys.argv[1:] for r in json.load(open(f))]
first = sum(1 for r in R if r['preds'] and r['preds'][0][0][0] == r['w']); top5 = sum(1 for r in R if r['preds'] and r['w'] in [x[0] for x in r['preds'][0]])
best = sum(1 for r in R if r['preds'] and max(r['preds'], key=lambda p: p[0][1])[0][0] == r['w'])
none = sum(1 for r in R if not r['preds'])
print(f'videos {len(R)} | first sign correct {first/len(R):.3f} | in top-5 {top5/len(R):.3f} | most-confident segment correct {best/len(R):.3f} | no sign found {none}')
print('missed:', ', '.join(f"{r['w']}->{r['preds'][0][0][0] if r['preds'] else '-'}" for r in R if not r['preds'] or r['preds'][0][0][0] != r['w']))
