/**
 * Every number here was measured off the source contract note (A2 landscape,
 * 1684 x 1190 pt) with PyMuPDF: table rects, text baselines, font sizes and
 * colours. Change one only if you have re-measured it.
 */

export const PAGE = { w: 1684, h: 1190 };

export const COLORS = {
  green: '#00d09c',        // table header text, Total labels, header cell borders
  greenTitle: '#03b487',   // the "Contract Note" wordmark
  fill: '#f0fbf7',         // header cell background
  grid: '#000000',         // body cell borders
  text: '#000000',
  subtitle: '#848693',     // "ORIGINAL FOR RECEIPT ..."
  firm: '#474a5e',         // firm name
  formerly: '#828491',
  firmLine: '#535668',     // address / contact lines
  label: '#494c5e',        // footer key-value block
  legal: '#5f6272',        // small print
};

/* ---- header band: y 36.2 -> 244.1 ----
   The source header is a raster block set in the broker's own narrow brand face,
   roughly 0.86x the width of Helvetica at the same nominal size. These sizes are
   width-matched to it, so an Arial rendering occupies the same footprint and
   wraps at the same words. (The footer small print measured ~1.0x, i.e. plain
   Helvetica, so it keeps its measured 8pt.) */
export const HEAD = {
  logo: { x: 72.5, top: 81.2, height: 34.7 },
  title: { x: 72.5, capTop: 155.5, size: 26.9 },
  subtitle: { x: 72.5, capTop: 201.0, size: 12.1 },
  right: {
    right: 74.5,          // 1684 - 1609.5
    width: 590,           // widest line in the source is 581.9pt; contact line wraps past this
    firmName: { capTop: 63.0, size: 17.8 },
    formerly: { capTop: 87.7, size: 11.2 },
    block1: { capTop: 111.6, size: 11.2, lh: 18.3 },   // registered office + CIN
    block2: { capTop: 166.3, size: 11.2, lh: 18.3 },   // phone / grievances / compliance
    block3: { capTop: 222.5, size: 11.2, lh: 18.3 },   // dealing office
  },
};

/* ---- page 1: client block (Helvetica 14pt, black) ---- */
export const CLIENT = {
  size: 14,
  colX: [43.0, 226.2, 409.4, 592.5],
  rowBaseline: [269.4, 297.4, 325.4, 353.4],
  addressLh: 14,
  addressWidth: 172,
  labelWidth: 180,
  valueWidth: 180,
};

/* ---- page 1: settlement table ---- */
export const SETTLE = {
  x: 915.3,
  top: 248.4,
  colW: [146.5, 146.6, 146.5, 146.5, 146.6],   // sums to 732.7, right edge lands on 1648.0
  rowH: 34,
  size: 14,
  greenRow: 2, // zero-based index of the NSE-EQ / BSE-EQ ... row
};

export const SALUTATION = { x: 38, baseline: 432.4, size: 12 };
export const SEGMENT = { x: 38, baseline: 478.4, size: 22 };

/* ---- trades table ---- */
export const TRADES = {
  x: 36,
  top: 244.4,
  colW: [152.3, 101.6, 114.2, 101.5, 228.5, 88.9, 76.1, 101.6, 139.6, 101.5, 88.9, 139.6, 101.5, 76.2],
  headH: 100,
  rowH: 48,
  totalH: 34,
  spacerH: 30,
  netH: 34,
  headSize: 16,
  bodySize: 14,
  headLh: 16,
};

/* ---- charges table ---- */
export const CHARGES = {
  x: 36,
  top: 244.4,
  colW: [637.5, 109.9, 109.9, 109.9],
  headH: 40,
  rowH: 34,
  headSize: 16,
  bodySize: 14,
};

/* ---- final page footer ---- */
export const FOOTER = {
  legal: { x: 70, capTop: 786.6, size: 8, lh: 11.8, width: 1540, gap: 11.6 },
  // DATE:/PLACE: labels are set a touch below their value's baseline
  date: { labelX: 70, valueX: 140, baseline: 958.1, labelBaseline: 959.5, labelSize: 10.2, valueSize: 14 },
  place: { baseline: 984.1, labelBaseline: 982.7 },
  // the key/value block is bold in the source; 10.6pt width-matches it
  kv: {
    labelX: 70,
    colonX: 270,
    valueX: 306,
    firstCapTop: 1015.2,
    size: 10.8,
    lh: 16,
    rowGap: 15,
    valueWidth: 330,
  },
  qr: { x: 650, y: 990, size: 150 },
  // "Yours faithfully," and "Authorised Signatory" are regular; the firm line is bold
  // and set a touch smaller, which is how the source renders them.
  sign: {
    x: 846.6,
    size: 11.7,
    boldSize: 10.8,
    line1Baseline: 958.8,
    line2Baseline: 976.5,
    signatoryBaseline: 1028.8,
  },
};

/* Arial/Liberation metrics, used to turn a baseline into a CSS `top`. */
const ASCENT = 0.905;
const CONTENT = 1.15; // ascent + descent + line gap

export function topForBaseline(baseline, size, lh) {
  if (!lh) return baseline - (ASCENT - (CONTENT - 1) / 2) * size;
  return baseline - ((lh - CONTENT * size) / 2 + ASCENT * size);
}

/** Cap-top is what the pixel measurements give, so convert it to a baseline first. */
export const CAP = 0.717;
export function topForCapTop(capTop, size, lh) {
  return topForBaseline(capTop + CAP * size, size, lh);
}
