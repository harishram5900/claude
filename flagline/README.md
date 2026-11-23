# Flagline

Heat-safe practice planning for every US public high school. Pick a school and Flagline turns the National Weather Service's official wet-bulb globe temperature (WBGT) forecast into hour-by-hour practice flags. It also gives you:

- a preseason acclimatization plan
- the heat log that state policies require
- a look back at the school's last three summers

No hardware is needed.

- **App:** `web/` (a static site; run locally with `cd web && python3 -m http.server`).
- **WBGT engine:** `web/js/wbgt.js`.
  - Globe temperature comes from an energy balance (ISO 7726 convection, Liljegren radiation terms).
  - Wet bulb uses Stull's 2011 formula.
  - Validation: `node tools/validate.mjs` checks it against the NWS official WBGT forecast (MAE 0.69°F over 1,464 hours in 8 cities).
- **National analysis:** `node tools/national.mjs` (NASA POWER hourly data, 30 cities, 2021–2025).
- **School list:** `python3 tools/schools.py` (NCES EDGE, 2024–25).

Not affiliated with the NWS, the NFHS or any state association.
