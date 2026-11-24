# Re-run MediaPipe on horizontally flipped copies of the training and test photos (view-independence).
import io, glob, numpy as np, pyarrow.parquet as pq
from PIL import Image, ImageOps
exec(open('alphabet.py').read().split("if not os.path.exists('alpha_feats.npz')")[0])
t = pq.read_table('raw/asl_alpha.parquet').to_pylist(); X, y = [], []
for row in t:
    f = extract(ImageOps.mirror(Image.open(io.BytesIO(row['image']['bytes']))))
    if f is not None: X.append(f[:63]); y.append(row['label'])
E, Ey = [], []
for f in sorted(glob.glob('raw/eitan/img/*.jpg')):
    fe = extract(ImageOps.mirror(Image.open(f)))
    E.append(fe[:63] if fe is not None else np.full(63, np.nan)); Ey.append(LET.index(f.rsplit('/', 1)[1][0]))
np.savez('alpha_flip.npz', X=np.array(X), y=np.array(y), E=np.array(E), Ey=np.array(Ey))
print('flipped marx', len(X), 'flipped eitan found', int(np.isfinite(np.array(E)[:, 0]).sum()))
