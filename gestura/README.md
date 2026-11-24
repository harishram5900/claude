# Gestura

ASL fingerspelling and sign recognition, speech output, video transcription and sign lessons. Everything runs in the browser.

- `web/` is the static site (deployed as-is, no build step).
- `research/` holds the scripts that trained and tested the models (raw datasets are not committed).
- `tests/` checks that the browser letter model matches Python: `npm test`.

| Part | Model | Tested on | Result |
|---|---|---|---|
| Letters A–Z | MLP on MediaPipe hand points (trained here) | 110 photos from a different dataset | 72.7% top-1, 87.3% top-3 |
| 250 signs | Kaggle ISLR 1st place, int8 ONNX | 619 ASL Citizen clips, 207 words | 74.5% top-1, 89.5% top-5 |
| Speech | Whisper base.en (8-bit) | OpenAI LibriSpeech figure | ~4% WER |

Run locally: `cd web && python3 -m http.server 8000`.
