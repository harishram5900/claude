# Real videos of the ASL Citizen seed signer (not in the training data) for words in our vocabulary.
import json, re, urllib.request, urllib.parse, os
from vocab import VOCAB
g2w = {g: w for w, gs in VOCAB.items() for g in gs}
url = 'https://huggingface.co/api/datasets/SudheendraP/ASL-Citizen-SEED-Videos/tree/main/SEED_Videos'; files = []
while url:
    r = urllib.request.urlopen(url); files += [d['path'] for d in json.load(r)]
    m = re.search(r'<([^>]+)>;\s*rel="next"', r.headers.get('Link') or ''); url = m.group(1) if m else None
print('seed videos', len(files))
pick = {}
for f in files:
    g = re.sub(r'\s*\d+$', '', f.rsplit('-seed', 1)[-1][:-4]).strip().lower()
    if g in g2w and g2w[g] not in pick: pick[g2w[g]] = f
print('vocab words with a seed video', len(pick))
for w, f in pick.items():
    out = f'raw/seed/{w.replace(" ", "_")}.mp4'
    if not os.path.exists(out): urllib.request.urlretrieve('https://huggingface.co/datasets/SudheendraP/ASL-Citizen-SEED-Videos/resolve/main/' + urllib.parse.quote(f), out)
json.dump(pick, open('raw/seed/_index.json', 'w'), indent=0)
