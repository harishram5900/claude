# Kinora

A 90-second Parkinson's motor check that runs on any phone, with no app and no watch. It has four tests:

- finger tapping (adapted from MDS-UPDRS 3.4)
- an Archimedean spiral drawing
- a rest-tremor reading from the phone's accelerometer
- a sustained-vowel voice test

Every check is tagged with time since the last dose, compared with the patient's own baseline, and summarised in a printable report for their neurologist.

- **App:** `web/`, a static site with no build step. Run it locally with `cd web && python3 -m http.server`.
- **Signal processing:** `web/js/dsp.js` and `web/js/tests/*.js`.
- **Tests:** `npm test` runs 12 checks on known synthetic signals.
- **Privacy:** results are stored only on the device (localStorage). Audio is analysed in the browser and never saved or sent.

Kinora is a tracking tool, not a diagnostic device, and has not been reviewed by the FDA.

## Research
`research/analyze.py` checks every Kinora measure against four public datasets: 199 people and 6,226 recordings.

| Dataset | Source | People |
|---|---|---|
| neuroQWERTY typing and tapping | PhysioNet; Giancardo et al. 2016 | 85 |
| Spiral drawings | UCI; Isenkul et al. 2014 | 40 |
| Parkinson's voice | UCI; Little et al. 2009 | 32 |
| Telemonitoring | UCI; Tsanas et al. 2010 | 42 |

Models are evaluated leave-one-person-out, with 2,000-sample bootstrap 95% confidence intervals. The script writes `web/data/research.json`, which feeds the Research page and the in-app comparisons.

| Measure | AUC (95% CI) |
|---|---|
| Alternating finger tapping | 0.83 (0.73–0.92) |
| Typing model | 0.80 (0.69–0.89) |
| Voice shimmer | 0.83 (0.66–0.95) |
| Spiral tremor | 0.61 (not significant) |
| Spiral with stylus pressure | 0.79 (0.60–0.92) |

To rerun it, download the four datasets into `research/raw/`, install numpy, scipy and scikit-learn, then run `python3 research/analyze.py`.
