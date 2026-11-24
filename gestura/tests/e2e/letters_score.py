import json, sys
truth = ''.join(json.load(open(sys.argv[1]))); r = json.load(open(sys.argv[2])); got = r['got'].replace(' ', '')
# the camera loops; keep the first pass: align truth against the start of what was committed
n, m = len(truth), len(got); D = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(n + 1): D[i][0] = i
for j in range(m + 1): D[0][j] = 0          # free start (the camera may begin mid-sequence)
for i in range(1, n + 1):
    for j in range(1, m + 1): D[i][j] = min(D[i-1][j] + 1, D[i][j-1] + 1, D[i-1][j-1] + (truth[i-1] != got[j-1]))
j = min(range(m + 1), key=lambda j: D[n][j]); i = n; match = 0; pairs = []
while i > 0 and j > 0:
    if D[i][j] == D[i-1][j-1] + (truth[i-1] != got[j-1]): match += truth[i-1] == got[j-1]; pairs.append((truth[i-1], got[j-1])); i -= 1; j -= 1
    elif D[i][j] == D[i-1][j] + 1: pairs.append((truth[i-1], '-')); i -= 1
    else: j -= 1
print(f'live letter trials {n} | committed correctly {match} ({match/n:.3f}) | edit distance {D[n][min(range(m+1), key=lambda j: D[n][j])]}')
print('errors:', ' '.join(f'{a}->{b}' for a, b in reversed(pairs) if a != b))
