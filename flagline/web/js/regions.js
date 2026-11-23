// Default Korey Stringer Institute regional category by state (1 = cooler, 3 = hottest/most humid).
// A starting point only: schools should confirm the category their state association uses.
const C3 = 'AL AR FL GA HI LA MS OK SC TX AZ PR';
const C1 = 'AK WA OR ID MT WY ND SD MN WI MI ME NH VT CO UT';
export function defaultCategory(state) { return C3.includes(state) ? 3 : C1.includes(state) ? 1 : 2; }
