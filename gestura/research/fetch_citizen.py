# List ASL Citizen pose files whose sign is in the 250-word Kaggle vocabulary, then download a sample.
import json, urllib.request, urllib.parse, re, os, random, sys
vocab = {k.lower(): k for k in json.load(open('islr_map.json'))}
base = 'https://huggingface.co/api/datasets/SorensenAI/asl-citizen-poses/tree/main/poses_anonymized_batches'
files, batches = [], []
req = urllib.request.urlopen(base); batches = [d['path'] for d in json.load(req) if d['type'] == 'directory']
print('batches', len(batches))
for b in batches[:6]:
    url = 'https://huggingface.co/api/datasets/SorensenAI/asl-citizen-poses/tree/main/' + urllib.parse.quote(b)
    while url:
        r = urllib.request.urlopen(url); items = json.load(r)
        files += [it['path'] for it in items if it['path'].endswith('.pose')]
        link = r.headers.get('Link') or ''; m = re.search(r'<([^>]+)>;\s*rel="next"', link); url = m.group(1) if m else None
print('listed', len(files))
by = {}
for f in files:
    g = re.sub(r'\s*\d+$', '', f.rsplit('/', 1)[1].split('-', 1)[1][:-5]).strip().lower()
    if g in vocab: by.setdefault(g, []).append(f)
print('vocab words found', len(by))
random.seed(0); pick = [f for g in sorted(by) for f in random.sample(by[g], min(3, len(by[g])))]
os.makedirs('citizen', exist_ok=True); n = 0
for f in pick:
    out = 'citizen/' + f.rsplit('/', 1)[1]
    if not os.path.exists(out):
        urllib.request.urlretrieve('https://huggingface.co/datasets/SorensenAI/asl-citizen-poses/resolve/main/' + urllib.parse.quote(f), out)
    n += 1
print('downloaded', n)
