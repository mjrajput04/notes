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
  return { ...t, q, gross, bpu, netRate, netTotal: -(q * netRate) };
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
export function computeCharges(rows, c) {
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

  const exchTxn = r2((turnover * num(c.exchTxnRate)) / 100);
  const sebi = r2((turnover * num(c.sebiRate)) / 100);
  const ipft = r2((turnover * num(c.ipftRate)) / 100);
  const stt = Math.round((sellTurnover * num(c.sttRate)) / 100);
  const stamp = Math.round((buyTurnover * num(c.stampRate)) / 100);

  const gstBase = brokerage + exchTxn + sebi + ipft;
  const inter = c.gstMode === 'igst';
  const cgst = inter ? 0 : r2(gstBase * 0.09);
  const sgst = inter ? 0 : r2(gstBase * 0.09);
  const igst = inter ? r2(gstBase * 0.18) : 0;
  const utt = 0;

  const auto = { brokerage, exchTxn, cgst, sgst, igst, utt, stt, sebi, stamp, ipft };

  // Any row may be overridden by hand.
  const o = c.overrides || {};
  const out = {};
  Object.keys(auto).forEach((k) => {
    out[k] = hasVal(o[k]) ? num(o[k]) : auto[k];
  });

  out.turnover = turnover;
  out.buyTurnover = buyTurnover;
  out.sellTurnover = sellTurnover;
  out.orderCount = orderCount;
  out.totalLevies = r2(
    out.brokerage + out.exchTxn + out.cgst + out.sgst + out.igst +
    out.utt + out.stt + out.sebi + out.stamp + out.ipft
  );
  return out;
}

export function compute(data) {
  const rows = (data.trades || []).map(computeRow);
  const groups = groupRows(rows);
  const netTotal = r2(rows.reduce((s, r) => s + r.netTotal, 0));
  const charges = computeCharges(rows, data.charges || {});
  const netAmount = r2(netTotal - charges.totalLevies);
  return { rows, groups, netTotal, charges, netAmount };
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
