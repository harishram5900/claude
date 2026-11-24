# EitanG98/asl_letters (Unlicense): 720 photos, nearly one person per photo. Used only as an outside test set.
import json, urllib.request, urllib.parse, os
from concurrent.futures import ThreadPoolExecutor
d = json.load(urllib.request.urlopen('https://huggingface.co/api/datasets/EitanG98/asl_letters'))
files = [s['rfilename'] for s in d['siblings'] if s['rfilename'].startswith(('train_val/', 'ann_train_val/'))]
os.makedirs('raw/eitan/img', exist_ok=True)
def get(f):
    out = 'raw/eitan/' + ('img/' + f.split('/', 1)[1].replace('/', '_') if f.startswith('train_val') else f.rsplit('/', 1)[1])
    if not os.path.exists(out): urllib.request.urlretrieve('https://huggingface.co/datasets/EitanG98/asl_letters/resolve/main/' + urllib.parse.quote(f), out)
with ThreadPoolExecutor(16) as ex: list(ex.map(get, files))
print(len(os.listdir('raw/eitan/img')))
