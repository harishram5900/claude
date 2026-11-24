# Gestura

Reads American Sign Language from a laptop or phone camera: fingerspelling (A to Z) and 340 everyday words,
turns common sign sequences into English sentences, and speaks them aloud. It also teaches the alphabet and every word.
Everything runs in the browser; nothing is uploaded.

- `web/` is the static site (deployed as-is, no build step).
- `research/` holds the scripts that built and tested the models (raw datasets are not committed).
- `tests/` checks the browser models against Python (`npm test`); `tests/e2e/` drives the real app in Chromium.

## Measured accuracy (people the models never saw)

| Part | How it was tested | Result |
|---|---|---|
| Signs, 332 classes / 340 English words | ASL Citizen official test split, 4,891 recordings by signers not in training | 87.3% right first time, 97.2% in top five |
| Signs at low camera frame rate | same recordings, resampled to 35-115% speed with jitter | 86.6% right first time |
| Letters A to Z | 5-fold cross-validation over 720 photos, one person each | 90.5% right first time, 96.4% in top three |
| Letters, separate outside set | Keithsel/asl_signs, 110 photos | 76.2% |

Signs: MediaPipe Holistic landmarks -> Kaggle ISLR 1st-place ensemble (MIT) as a 1,152-number motion embedding ->
logistic regression trained on 6,908 ASL Citizen recordings (`research/build_words.py`, `research/train_words2.py`).
Signs that are identical in ASL (for example NICE and CLEAN) are one class; the phrase step picks the English.

Run locally: `cd web && python3 -m http.server 8000`.
