# Train Gestura's fingerspelling classifier on real ASL alphabet photos (Hugging Face: Marxulia v03, 10,873 images).
# Hand landmarks come from Google MediaPipe Hand Landmarker, the same model the browser runs.
import io, json, glob, os, numpy as np, pyarrow.parquet as pq
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
LET = [chr(65 + i) for i in range(26)]
det = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path='raw/hand_landmarker.task'), num_hands=1, min_hand_detection_confidence=0.3))

def features(lm, handed):
    """21 landmarks -> 63 numbers: wrist-centred, mirrored to a right hand, scaled by hand size, plus 10 finger-joint distances."""
    p = np.array([[l.x, l.y, l.z] for l in lm], dtype=np.float32)
    p = p - p[0]
    if handed == 'Left': p[:, 0] *= -1
    s = np.linalg.norm(p[9]) or 1.0; p = p / s
    tips = [4, 8, 12, 16, 20]; extra = [np.linalg.norm(p[a] - p[b]) for i, a in enumerate(tips) for b in tips[i + 1:]]
    return np.concatenate([p.flatten(), extra])

def extract(img):
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(img.convert('RGB'))))
    if not r.hand_landmarks: return None
    return features(r.hand_landmarks[0], r.handedness[0][0].category_name)

if not os.path.exists('alpha_feats.npz'):
    t = pq.read_table('raw/asl_alpha.parquet').to_pylist(); X, y = [], []
    for i, row in enumerate(t):
        f = extract(Image.open(io.BytesIO(row['image']['bytes'])))
        if f is not None: X.append(f); y.append(row['label'])
        if i % 2000 == 0: print('processed', i, 'hands found', len(X), flush=True)
    np.savez('alpha_feats.npz', X=np.array(X), y=np.array(y))
d = np.load('alpha_feats.npz'); X, y = d['X'], d['y']
print('hands detected in', len(X), 'of 10873 images')
