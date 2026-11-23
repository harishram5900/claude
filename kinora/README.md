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
