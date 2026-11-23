// What each flag requires. Wording adapted from the Delaware DIAA heat policy (Fall 2025), which follows
// Korey Stringer Institute / NATA guidance. Schools must follow their own state association's policy.
export const FLAG_INFO = [
  { name: 'Green', risk: 'Very low', short: 'Normal activity',
    rules: ['Normal activities', 'At least 3 rest breaks each hour, 3+ minutes each', 'Cold-water tub or ice-towel tarp ready on site'] },
  { name: 'Yellow', risk: 'Low', short: 'Extra breaks',
    rules: ['Use discretion for intense or prolonged exercise; watch at-risk athletes', 'At least 3 rest and water breaks in the shade every hour, 4+ minutes each', 'Cold-water tub ready on site'] },
  { name: 'Orange', risk: 'Moderate', short: 'Max 2 h · reduced gear',
    rules: ['Football, lacrosse, field-hockey goalies: helmets and shoulder pads only; no pads for conditioning', 'Linemen, non-acclimatized and deconditioned athletes cut workload 50%', 'Maximum practice 2 hours', 'Water and rest break every 15 minutes, 4+ minutes, in the shade'] },
  { name: 'Red', risk: 'High', short: 'Max 1 h · no gear · AT present',
    rules: ['No protective equipment and no conditioning', '5 minutes of water and rest in the shade after every 10 minutes', 'Maximum practice 1 hour, only with an athletic trainer or other qualified health professional present'] },
  { name: 'Black', risk: 'Very high', short: 'No outdoor activity',
    rules: ['No outdoor activity. Delay until the WBGT drops below black', 'Competitions: postpone 30 minutes, then re-measure'] }
];
export const MAX_MIN = [Infinity, Infinity, 120, 60, 0];

// Preseason heat acclimatization (Casa et al. 2009, NATA, J Athl Train 44(3):332-333).
export function acclimDay(n) {
  if (n <= 2) return { gear: 'Helmet only', sessions: '1 practice, max 3 h', note: 'Optional 1-h walk-through, 3 h rest between' };
  if (n <= 5) return { gear: 'Helmet + shoulder pads', sessions: '1 practice, max 3 h', note: 'Optional 1-h walk-through, 3 h rest between' };
  return { gear: 'Full equipment', sessions: n % 2 === 0 ? 'Double session allowed' : 'Single practice', note: 'After a double-session day, next day is single practice or rest. Doubles: each ≤ 3 h, total ≤ 5 h, 3 h cool rest between' };
}
