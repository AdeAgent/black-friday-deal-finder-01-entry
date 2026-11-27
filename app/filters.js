// Bargain Beacon — deal math: discount, savings, verdict score, filtering.
// Pure functions only, so the same rules drive the list, the detail page
// and the "same product elsewhere" comparison. Nothing here touches the DOM.

export const SIGNAL_LABEL = {
  'new-low': 'New low',
  strong: 'Strong price',
  routine: 'Routine sale',
  inflated: 'Inflated',
};

const SIGNAL_POINTS = { 'new-low': 100, strong: 75, routine: 45, inflated: 20 };

// Discount percent, always computed from the two prices so the number on
// the card can never disagree with them. Rounded to a whole percent.
export function discountPct(deal) {
  if (!deal.usual || deal.usual <= 0) return 0;
  return Math.round((1 - deal.sale / deal.usual) * 100);
}

export function savings(deal) {
  return Math.round((deal.usual - deal.sale) * 100) / 100;
}

// Deal Score 0–100: how big the cut is (55%), how honest it is (35%),
// and how much cash it saves (10%, capped at $400 of savings).
export function dealScore(deal) {
  const pct = discountPct(deal);
  const cash = Math.min(savings(deal), 400) / 400;
  return Math.round(pct * 0.55 + SIGNAL_POINTS[deal.sig] * 0.35 + cash * 100 * 0.1);
}

export function money(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function moneyShort(n) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Same product at another store: match on the product name with the store
// stripped out is unreliable, so deals share a `name` exactly when they are
// the same product. Compare by identical name across stores.
export function sameProductElsewhere(deal, all) {
  return all
    .filter((d) => d.id !== deal.id && d.name === deal.name)
    .sort((a, b) => a.sale - b.sale);
}

export function bestPriceFor(name, all) {
  const matches = all.filter((d) => d.name === name);
  if (!matches.length) return null;
  return matches.reduce((best, d) => (d.sale < best.sale ? d : best), matches[0]);
}

export function applyFilters(all, state) {
  const q = state.q.trim().toLowerCase();
  let out = all.filter((d) => {
    if (state.cat !== 'all' && d.cat !== state.cat) return false;
    if (state.store !== 'all' && d.store !== state.store) return false;
    if (discountPct(d) < state.minPct) return false;
    if (state.sig !== 'all' && d.sig !== state.sig) return false;
    if (q && !(d.name + ' ' + d.store + ' ' + d.cat).toLowerCase().includes(q)) return false;
    return true;
  });
  const by = state.sort;
  const sorted = [...out];
  if (by === 'score') sorted.sort((a, b) => dealScore(b) - dealScore(a) || discountPct(b) - discountPct(a));
  else if (by === 'pct') sorted.sort((a, b) => discountPct(b) - discountPct(a) || dealScore(b) - dealScore(a));
  else if (by === 'price-asc') sorted.sort((a, b) => a.sale - b.sale);
  else if (by === 'price-desc') sorted.sort((a, b) => b.sale - a.sale);
  else if (by === 'save') sorted.sort((a, b) => savings(b) - savings(a));
  return sorted;
}

export function countsByStore(all) {
  const counts = {};
  for (const d of all) counts[d.store] = (counts[d.store] || 0) + 1;
  return counts;
}

export function countsByCategory(all) {
  const counts = {};
  for (const d of all) counts[d.cat] = (counts[d.cat] || 0) + 1;
  return counts;
}
