// Pure calculation helpers for the contract note.

export const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export const hasVal = (v) => v !== '' && v !== null && v !== undefined;

// Money / rate formatting: plain fixed-2, no thousand separators (matches the source layout).
export const fix2 = (n) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '');

export const fmt = (n) => (hasVal(n) ? fix2(n) : '');

// Signed quantity: Buy is positive, Sell is negative.
export const signedQty = (t) => num(t.qty) * (t.side === 'S' ? -1 : 1);

// An explicit segment on the row wins; otherwise an option or futures leg in
// the description means F&O, and anything else is cash equity.
const FO_LEG = /(^|[^A-Z])(CE|PE|FUT|FUTURES)([^A-Z]|$)/i;

export function tradeSegment(t) {
  if (t.segment === 'EQ' || t.segment === 'FO') return t.segment;
  return FO_LEG.test(String(t.description || '')) ? 'FO' : 'EQ';
}

/**
 * Levy rates for one segment. Equity rates live under `charges.eq`; the
 * top-level rates stay the F&O ones, so notes saved before the split keep
 * calculating exactly as they did.
 */
export function segRates(c, seg) {
  return seg === 'EQ' && c.eq ? { ...c, ...c.eq } : c;
}

export const LEVY_KEYS = ['brokerage', 'exchTxn', 'cgst', 'sgst', 'igst', 'utt', 'stt', 'sebi', 'stamp', 'ipft'];

/**
 * Per-row derived values.
 *   netRate  = gross rate adjusted by per-unit brokerage (buy pays more, sell receives less)
 *   netTotal = -(signedQty * netRate)   -> buys are an outflow, sells an inflow
 */
export function computeRow(t) {
  const q = signedQty(t);
  const gross = num(t.rate);
  const bpu = hasVal(t.brokeragePerUnit) ? num(t.brokeragePerUnit) : null;
  const netRate = bpu === null ? gross : gross + (t.side === 'S' ? -bpu : bpu);
  return { ...t, q, gross, bpu, netRate, netTotal: -(q * netRate), seg: tradeSegment(t) };
}

// Contiguous grouping by contract description, mirroring the source document.
export function groupRows(rows) {
  const groups = [];
  rows.forEach((r) => {
    const last = groups[groups.length - 1];
    if (last && last.description === r.description) last.rows.push(r);
    else groups.push({ description: r.description, rows: [r] });
  });
  return groups.map((g) => ({
    ...g,
    totalQty: g.rows.reduce((s, r) => s + r.q, 0),
    totalNet: g.rows.reduce((s, r) => s + r.netTotal, 0),
  }));
}

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Statutory levies. Rates are percentages of turnover.
 * STT and stamp duty are rounded to the nearest rupee, as the exchanges do.
 */
export function computeCharges(rows, c, seg) {
  const R = segRates(c, seg || 'FO');
  const buyTurnover = rows
    .filter((r) => r.side !== 'S')
    .reduce((s, r) => s + Math.abs(r.q) * r.gross, 0);
  const sellTurnover = rows
    .filter((r) => r.side === 'S')
    .reduce((s, r) => s + Math.abs(r.q) * r.gross, 0);
  const turnover = buyTurnover + sellTurnover;

  const orderCount = new Set(
    rows.map((r) => String(r.orderNo || '').trim()).filter(Boolean)
  ).size;

  let brokerage;
  if (c.brokerageMode === 'pct') {
    brokerage = rows.reduce((s, r) => {
      const t = Math.abs(r.q) * r.gross;
      return s + Math.min((t * num(c.pctRate)) / 100, num(c.pctCap) || Infinity);
    }, 0);
  } else {
    brokerage = orderCount * num(c.flatPerOrder);
  }
  // Per-unit brokerage entered on rows is already inside netRate, so add it here too.
  const perUnit = rows.reduce(
    (s, r) => s + (r.bpu === null ? 0 : Math.abs(r.q) * r.bpu),
    0
  );
  brokerage = r2(brokerage + perUnit);

  const exchTxn = r2((turnover * num(R.exchTxnRate)) / 100);
  const sebi = r2((turnover * num(R.sebiRate)) / 100);
  const ipft = r2((turnover * num(R.ipftRate)) / 100);
  // Equity delivery is taxed on both legs; options only on the sell leg.
  const sttBase = R.sttSide === 'both' ? turnover : sellTurnover;
  const stt = Math.round((sttBase * num(R.sttRate)) / 100);
  const stamp = Math.round((buyTurnover * num(R.stampRate)) / 100);

  const gstBase = brokerage + exchTxn + sebi + ipft;
  const inter = c.gstMode === 'igst';
  const cgst = inter ? 0 : r2(gstBase * 0.09);
  const sgst = inter ? 0 : r2(gstBase * 0.09);
  const igst = inter ? r2(gstBase * 0.18) : 0;
  const utt = 0;

  // Overrides are applied once on the combined totals in compute(), so a hand
  // correction is not counted again in each segment column.
  const out = { brokerage, exchTxn, cgst, sgst, igst, utt, stt, sebi, stamp, ipft };
  out.turnover = turnover;
  out.buyTurnover = buyTurnover;
  out.sellTurnover = sellTurnover;
  out.orderCount = orderCount;
  out.totalLevies = r2(LEVY_KEYS.reduce((sum, k) => sum + out[k], 0));
  return out;
}

/** The heading above the trade table when the note does not set one. */
export function segmentHeading(eqPresent, foPresent) {
  if (eqPresent && foPresent) return 'EQUITY AND FUTURE & OPTIONS';
  if (eqPresent) return 'EQUITY';
  return 'FUTURE & OPTIONS';
}

export function compute(data) {
  const rows = (data.trades || []).map(computeRow);
  const groups = groupRows(rows);
  const netTotal = r2(rows.reduce((s, r) => s + r.netTotal, 0));

  const c = data.charges || {};
  const eqRows = rows.filter((r) => r.seg === 'EQ');
  const foRows = rows.filter((r) => r.seg === 'FO');

  const eq = computeCharges(eqRows, c, 'EQ');
  const fo = computeCharges(foRows, c, 'FO');
  eq.present = eqRows.length > 0;
  fo.present = foRows.length > 0;
  eq.netTotal = r2(eqRows.reduce((s, r) => s + r.netTotal, 0));
  fo.netTotal = r2(foRows.reduce((s, r) => s + r.netTotal, 0));
  eq.netAmount = r2(eq.netTotal - eq.totalLevies);
  fo.netAmount = r2(fo.netTotal - fo.totalLevies);

  const o = c.overrides || {};
  const charges = {};
  LEVY_KEYS.forEach((k) => {
    charges[k] = hasVal(o[k]) ? num(o[k]) : r2(eq[k] + fo[k]);
  });
  charges.turnover = eq.turnover + fo.turnover;
  charges.buyTurnover = eq.buyTurnover + fo.buyTurnover;
  charges.sellTurnover = eq.sellTurnover + fo.sellTurnover;
  charges.orderCount = eq.orderCount + fo.orderCount;
  charges.totalLevies = r2(LEVY_KEYS.reduce((sum, k) => sum + charges[k], 0));

  const netAmount = r2(netTotal - charges.totalLevies);
  return { rows, groups, netTotal, charges, netAmount, eq, fo };
}

/**
 * Flatten groups into printable table rows (trades, per-contract totals,
 * spacers and the closing net total) so they can be paginated evenly.
 */
export function buildTableRows(groups, netTotal) {
  const out = [];
  groups.forEach((g, gi) => {
    g.rows.forEach((r) => out.push({ kind: 'trade', row: r }));
    out.push({ kind: 'total', description: g.description, qty: g.totalQty, net: g.totalNet });
    if (gi < groups.length - 1) out.push({ kind: 'spacer' });
  });
  if (out.length) {
    out.push({ kind: 'spacer' });
    out.push({ kind: 'net', net: netTotal });
  }
  return out;
}

export function paginate(items, perPage) {
  const size = Math.max(1, parseInt(perPage, 10) || 14);
  const pages = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages.length ? pages : [[]];
}
