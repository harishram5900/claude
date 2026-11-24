# Same test as eval_words.py, but with the exact ONNX file the website loads (web/models/signs.onnx).
import glob, json, re, numpy as np, onnxruntime as ort
exec(open('eval_words.py').read().split('files = sorted')[0].replace("it = Interpreter('raw/islr.tflite'); run = it.get_signature_runner()", ''))
s = ort.InferenceSession('../web/models/signs.onnx'); name = s.get_inputs()[0].name
files = sorted(glob.glob('raw/citizen/*.pose'))
gold = lambda f: low[re.sub(r'\s*\d+$', '', f.rsplit('/', 1)[1].split('-', 1)[1][:-5]).strip().lower()]
top1 = top5 = 0
for f in files:
    rk = np.argsort(-s.run(None, {name: load(f, 0, False)})[0].ravel()); g = gold(f); top1 += rk[0] == g; top5 += g in rk[:5]
print(f'shipped model: top-1 {top1/len(files):.3f} top-5 {top5/len(files):.3f} n={len(files)}')
