// Speech in a video -> text, entirely in the browser (OpenAI Whisper via Transformers.js, ONNX weights).
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
env.allowLocalModels = false;
let asr = null;
self.onmessage = async ({ data }) => {
  try {
    if (!asr) {
      asr = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-base.en', {
        dtype: 'q8',
        progress_callback: (p) => { if (p.status === 'progress') self.postMessage({ type: 'load', file: p.file, pct: p.progress }); }
      });
    }
    self.postMessage({ type: 'status', text: 'Transcribing…' });
    const out = await asr(data.audio, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true });
    self.postMessage({ type: 'done', text: out.text.trim(), chunks: (out.chunks || []).map((c) => ({ text: c.text.trim(), t0: c.timestamp[0], t1: c.timestamp[1] })) });
  } catch (e) { self.postMessage({ type: 'error', text: e.message }); }
};
