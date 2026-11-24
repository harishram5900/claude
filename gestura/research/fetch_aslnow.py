# ASLNow! fingerspelling landmarks (MIT): MediaPipe web hand landmarks from many participants, one JSON per sample.
import json, urllib.request, urllib.parse, os
from concurrent.futures import ThreadPoolExecutor
d = json.load(urllib.request.urlopen('https://huggingface.co/api/datasets/sid220/asl-now-fingerspelling'))
files = [s['rfilename'] for s in d['siblings'] if s['rfilename'].endswith('.json')]
print('files', len(files))
def get(f):
    out = 'raw/aslnow/' + f.replace('/', '_')
    if not os.path.exists(out): urllib.request.urlretrieve('https://huggingface.co/datasets/sid220/asl-now-fingerspelling/resolve/main/' + urllib.parse.quote(f), out)
with ThreadPoolExecutor(16) as ex: list(ex.map(get, files))
