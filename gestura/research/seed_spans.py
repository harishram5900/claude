# For demo clips: find each seed video's signing span (first run of frames with a hand visible) so the
# "reach to stop recording" at the end can be cut off.
import json, subprocess, sys, numpy as np, io
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
det = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path='raw/hand_landmarker.task'), num_hands=2, min_hand_detection_confidence=0.4))
out = {}
for w in sys.argv[1:]:
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f'raw/seed/{w}.mp4', '-vf', 'fps=15', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 640, 3); vis = []
    for f in fr: vis.append(len(det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(f))).hand_landmarks) > 0)
    idx = [i for i, v in enumerate(vis) if v]; s = idx[0]; e = s
    for i in idx[1:]:
        if i - e > 5: break
        e = i
    out[w] = [round(s / 15, 2), round(e / 15, 2), round(len(fr) / 15, 2)]; print(w, out[w], ''.join('#' if v else '.' for v in vis), flush=True)
json.dump(out, open('raw/seed/_spans.json', 'w'))
