// Real data from people assessed for Parkinson's disease (see research/analyze.py for every number here).
let data = null;
export async function loadResearch() { if (!data) data = await (await fetch('data/research.json')).json(); return data; }
export const research = () => data;

const feat = (d, group, name) => d[group].features.find((f) => f.name === name);
// How a Kinora measure maps onto a research measure. `scale` converts Kinora's units to the dataset's.
export const REFS = {
  'tapR.rate': { group: 'tapping', name: 'Alternating finger tapping (afTap)', scale: 30, unit: 'taps per 30 s', device: 'measured on a keyboard in the clinic; your test used a touchscreen, so treat this as a rough guide' },
  'tapL.rate': { group: 'tapping', name: 'Alternating finger tapping (afTap)', scale: 30, unit: 'taps per 30 s', device: 'measured on a keyboard in the clinic; your test used a touchscreen, so treat this as a rough guide' },
  'spiral.tremorPct': { group: 'spiral', name: 'Spiral tremor (fast radial wobble)', scale: 1, unit: '% of spiral radius', device: 'drawn with a pen on a graphics tablet; your finger on glass will usually read higher' },
  'voice.jitter': { group: 'voice', name: 'Jitter (cycle-to-cycle pitch change)', scale: 1, unit: '%', device: 'recorded with a studio microphone; phone microphones and rooms add noise' },
  'voice.shimmer': { group: 'voice', name: 'Shimmer (cycle-to-cycle loudness change)', scale: 1, unit: '%', device: 'recorded with a studio microphone; phone microphones and rooms add noise' },
  'voice.hnr': { group: 'voice', name: 'Harmonics-to-noise ratio', scale: 1, unit: 'dB', device: 'recorded with a studio microphone; phone microphones and rooms add noise' },
  'typing.median': { group: 'typing', name: 'Median key hold time', scale: 1, unit: 'ms', device: 'typed on a laptop keyboard, as you did' },
  'typing.iqr': { group: 'typing', name: 'Hold-time spread (IQR)', scale: 1, unit: 'ms', device: 'typed on a laptop keyboard, as you did' },
  'typing.longShare': { group: 'typing', name: 'Slow presses (hold > 200 ms)', scale: 1, unit: '% of keys', device: 'typed on a laptop keyboard, as you did' }
};
export function refFor(key) { const r = REFS[key]; if (!r || !data) return null; const f = feat(data, r.group, r.name); return f ? { ...r, f } : null; }

const med = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const nice = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

// Two rows of dots (people without and with Parkinson's) on a shared axis, with an optional "you" marker.
export function dotPlot(f, { you = null, w = 560, h = 132, label = '' } = {}) {
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const all = [...f.pd, ...f.control, ...(you != null ? [you] : [])];
  const lo0 = Math.min(...all), hi0 = Math.max(...all), pad = (hi0 - lo0) * 0.06 || 1, lo = lo0 >= 0 ? Math.max(0, lo0 - pad) : lo0 - pad, hi = hi0 + pad;
  const L = 128, R = 14, X = (v) => L + (v - lo) / (hi - lo) * (w - L - R);
  const row = (vals, y, cls) => vals.map((v) => `<circle class="${cls}" cx="${X(v).toFixed(1)}" cy="${(y + (rnd() - 0.5) * 18).toFixed(1)}" r="3.6"/>`).join('');
  let g = `<line class="gridl" x1="${L}" x2="${w - R}" y1="${h - 26}" y2="${h - 26}"/>`;
  const raw = (hi - lo) / 4, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9) + (step / mag === 2.5 ? 1 : 0));
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) g += `<line class="gridl" x1="${X(v)}" x2="${X(v)}" y1="${h - 30}" y2="${h - 26}"/><text class="axis" x="${X(v)}" y="${h - 10}" text-anchor="middle">${v.toFixed(dec)}</text>`;
  g += `<text class="rowlab" x="0" y="36">No Parkinson's</text><text class="rowlab sub" x="0" y="50">n = ${f.nControl}</text>`;
  g += `<text class="rowlab" x="0" y="80">Parkinson's</text><text class="rowlab sub" x="0" y="94">n = ${f.nPD}</text>`;
  g += row(f.control, 38, 'pc') + row(f.pd, 82, 'pp');
  for (const [vals, y] of [[f.control, 38], [f.pd, 82]]) { const m = med(vals); g += `<line class="medl" x1="${X(m)}" x2="${X(m)}" y1="${y - 15}" y2="${y + 15}"/>`; }
  if (you != null) g += `<line class="you" x1="${X(you)}" x2="${X(you)}" y1="14" y2="${h - 26}"/><text class="youlab" x="${X(you)}" y="10" text-anchor="middle">you</text>`;
  return `<svg class="dotplot" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || f.name}: people with and without Parkinson's${you != null ? ', with your result marked' : ''}">${g}</svg>`;
}
export function rocPlot(models, { w = 320, h = 320 } = {}) {
  const P = 34, S = w - P - 10, X = (v) => P + v * S, Y = (v) => 10 + (1 - v) * S;
  let g = `<rect x="${P}" y="10" width="${S}" height="${S}" class="rocbox"/><line class="chance" x1="${X(0)}" y1="${Y(0)}" x2="${X(1)}" y2="${Y(1)}"/>`;
  for (const k of [0, 0.5, 1]) g += `<text class="axis" x="${X(k)}" y="${h - 8}" text-anchor="middle">${k}</text><text class="axis" x="${P - 6}" y="${Y(k) + 4}" text-anchor="end">${k}</text>`;
  models.forEach((m, i) => { g += `<path class="roc r${i}" d="${m.roc.map(([f, t], j) => `${j ? 'L' : 'M'}${X(f).toFixed(1)} ${Y(t).toFixed(1)}`).join(' ')}"/>`; });
  g += `<text class="axis" x="${P + S / 2}" y="${h + 6}" text-anchor="middle">false-positive rate</text>`;
  return `<svg class="rocsvg" viewBox="0 0 ${w} ${h + 10}" role="img" aria-label="ROC curves">${g}</svg>`;
}
const ci = (f) => `${f.auc.toFixed(2)} <small>(95% CI ${f.ci[0].toFixed(2)}–${f.ci[1].toFixed(2)})</small>`;
const pfmt = (p) => (p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(p < 0.01 ? 3 : 2)}`);

export function researchPage(d) {
  const tA = feat(d, 'tapping', 'Alternating finger tapping (afTap)'), tS = feat(d, 'tapping', 'Single-key tapping (sTap)');
  const ty = d.typing, sp = d.spiral, vo = d.voice;
  const block = (num, title, lede, figs, verdict) => `<section class="rblock"><div class="rhead"><span class="mono rnum">${num}</span><div><h2>${title}</h2><p>${lede}</p></div></div>${figs}<div class="verdict"><b>What this changed in Kinora.</b> ${verdict}</div></section>`;
  const fig = (f, note) => `<figure class="rfig"><figcaption><b>${f.name}</b><span class="auc">AUC ${ci(f)} · ${pfmt(f.p)}</span></figcaption>${dotPlot(f)}<p class="fine">${note || `Median ${nice(med(f.control))} vs ${nice(med(f.pd))} ${f.unit} (without vs with Parkinson's). Each dot is one person.`}</p></figure>`;
  return `
  <header class="rhero"><p class="eyebrow">Research</p><h1>The data behind Kinora.</h1>
    <p class="lede">Before asking anyone to trust a phone test, we checked each measure against real recordings from people who were assessed for Parkinson's disease in clinics and research studies.</p>
    <div class="rstats"><div><b>${d.meta.peopleTotal}</b><span>people</span></div><div><b>${d.meta.recordingsTotal.toLocaleString()}</b><span>recordings</span></div><div><b>4</b><span>public datasets</span></div><div><b>0</b><span>test participants seen during training</span></div></div></header>
  <section class="rdatasets">
    <article><h3>neuroQWERTY</h3><p>${ty.n} people (${ty.nPD} with Parkinson's) recruited at movement-disorder units in Madrid. Natural typing on a laptop (about ${ty.keysPerPerson.toLocaleString()} keystrokes each), plus clinician UPDRS-III and finger-tapping tests.</p><cite>Giancardo et al., Scientific Reports 2016 · PhysioNet</cite></article>
    <article><h3>Spiral drawings</h3><p>${sp.n} people (${sp.nPD} with Parkinson's) tracing a spiral on a graphics tablet that recorded pen position, pressure and time.</p><cite>Isenkul et al. 2014 · UCI Machine Learning Repository</cite></article>
    <article><h3>Parkinson's voice</h3><p>${vo.recordings} sustained-vowel recordings from ${vo.n} people (${vo.nPD} with Parkinson's), analysed cycle by cycle.</p><cite>Little et al., IEEE Trans Biomed Eng 2009 · UCI</cite></article>
    <article><h3>Telemonitoring</h3><p>${d.telemonitoring.recordings.toLocaleString()} home voice recordings from ${d.telemonitoring.n} people with early Parkinson's, each linked to a clinician's motor UPDRS score (${d.telemonitoring.motorUpdrsRange[0]}–${d.telemonitoring.motorUpdrsRange[1]}).</p><cite>Tsanas et al., IEEE Trans Biomed Eng 2010 · UCI</cite></article>
  </section>
  ${block('01', 'Finger tapping', `Clinicians timed ${tA.nPD + tA.nControl} of the neuroQWERTY participants on two tapping tests. Alternating between two targets separated the groups far better than tapping one key.`,
    `<div class="rgrid">${fig(tA)}${fig(tS)}</div><p class="rnote">Among people with Parkinson's, fewer alternating taps went with a higher (worse) UPDRS-III motor score: Spearman ρ = ${d.tapping.afTapVsUpdrsInPD.rho.toFixed(2)}, ${pfmt(d.tapping.afTapVsUpdrsInPD.p)}, n = ${d.tapping.afTapVsUpdrsInPD.n}.</p>`,
    'Kinora uses alternating two-target tapping, not single-target tapping, and treats it as the core measure.')}
  ${block('02', 'Typing', `Everyday typing turned out to carry one of the strongest signals. People with Parkinson's held keys down longer and less consistently.`,
    `<div class="rgrid">${fig(feat(d, 'typing', 'Slow presses (hold > 200 ms)'))}${fig(feat(d, 'typing', 'Hold-time spread (IQR)'))}</div>
     <div class="rmodel"><div><span class="mono">Kinora typing model</span><b>AUC ${ci(ty.model)}</b><p>Four hold-time measures, logistic regression, leave-one-person-out. At 80% specificity it found ${Math.round(ty.model.sensAt80Spec * 100)}% of people with Parkinson's.</p></div><div><span class="mono">Published neuroQWERTY score</span><b>AUC ${ci(ty.nqScorePublished)}</b><p>The original authors' algorithm on the same people, for comparison.</p></div></div>`,
    'We added a 60-second typing test for laptops. Our simpler four-measure model performs on par with the published algorithm.')}
  ${block('03', 'Voice', `Cycle-to-cycle pitch and loudness changes (jitter and shimmer) and voice clarity all differed between groups. But in ${d.telemonitoring.n} people tracked at home, voice measures barely followed changes in motor severity between people (|ρ| ≈ ${Math.abs(d.telemonitoring.correlations.Shimmer.betweenPeople).toFixed(2)}, not significant).`,
    `<div class="rgrid three">${fig(feat(d, 'voice', 'Shimmer (cycle-to-cycle loudness change)'))}${fig(feat(d, 'voice', 'Jitter (cycle-to-cycle pitch change)'))}${fig(feat(d, 'voice', 'Harmonics-to-noise ratio'))}</div>`,
    'Kinora now measures jitter and shimmer the same cycle-by-cycle way, and shows voice as a supporting signal next to tapping, not as a severity score.')}
  ${block('04', 'Spiral drawing', `The shape of the spiral barely separated groups in this early-stage sample. How steadily people pressed the pen did.`,
    `<div class="rgrid">${fig(feat(d, 'spiral', 'Spiral tremor (fast radial wobble)'))}${fig(feat(d, 'spiral', 'Pen pressure variability (stylus only)'))}</div>`,
    'The spiral is for tracking tremor over time in people who have it, not for spotting Parkinson\'s. When someone draws with a stylus (for example an iPad pencil), Kinora also records pen pressure.')}
  <section class="rblock"><div class="rhead"><span class="mono rnum">05</span><div><h2>Models, side by side</h2><p>Each curve is a model tested on people it never saw during training. The diagonal is a coin flip.</p></div></div>
    <div class="rocwrap">${rocPlot([ty.model, vo.model, sp.model])}
      <ul class="roclegend"><li><i class="r0"></i>Typing · AUC ${ci(ty.model)} · n = ${ty.model.n}</li><li><i class="r1"></i>Voice · AUC ${ci(vo.model)} · n = ${vo.model.n}</li><li><i class="r2"></i>Spiral, finger-only measures · AUC ${ci(sp.model)} · n = ${sp.model.n}</li>
      <li class="fine">With stylus pressure added, the spiral model reaches AUC ${ci(sp.modelStylus)}.</li></ul></div></section>
  <section class="rblock limits"><h2>What this does and doesn't show</h2><ul>
    <li><b>Small samples.</b> The widest confidence interval runs from ${vo.model.ci[0].toFixed(2)} to ${vo.model.ci[1].toFixed(2)}. These are early signals, not proof.</li>
    <li><b>Different hardware.</b> The research used keyboards, tablets and studio microphones. Kinora uses phones. Comparisons in the app are a rough guide, which is why Kinora mainly compares you with your own baseline.</li>
    <li><b>Separate people for each test.</b> No public dataset has all four tests from the same people, so we can't yet say how much they add up. Kinora's own study will.</li>
    <li><b>Not a diagnosis.</b> An AUC of 0.80 still misses people and flags people who are fine. Kinora tracks change; diagnosis belongs to a clinician.</li></ul>
    <p class="fine">Method: features computed per person; logistic regression with standardised inputs; leave-one-person-out cross-validation (recordings from the same person never appear in both training and testing); 2,000-sample bootstrap for 95% confidence intervals. Code: <a href="https://github.com/harishram5900/claude/tree/ccr-ee711a08-s81gbs/kinora/research" target="_blank" rel="noopener">research/analyze.py</a>.</p></section>`;
}
