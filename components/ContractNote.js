'use client';

import { fmt, fix2, hasVal } from '@/lib/calc';
import Grid, { SettleGrid } from '@/components/Grid';
import {
  COLORS, HEAD, CLIENT, SETTLE, SALUTATION, SEGMENT, TRADES, CHARGES, FOOTER,
  topForBaseline, topForCapTop,
} from '@/lib/geometry';

const pt = (n) => `${n}pt`;

/** Absolutely positioned text, anchored on the glyph baseline like the source. */
function T({ x, right, baseline, capTop, size, lh, bold, color, width, align, children, style }) {
  const top = capTop !== undefined
    ? topForCapTop(capTop, size, lh)
    : topForBaseline(baseline, size, lh);
  return (
    <div
      style={{
        position: 'absolute',
        left: x !== undefined ? pt(x) : undefined,
        right: right !== undefined ? pt(right) : undefined,
        top: pt(top),
        fontSize: pt(size),
        lineHeight: lh ? pt(lh) : 1,
        fontWeight: bold ? 700 : 400,
        color: color || COLORS.text,
        width: width ? pt(width) : undefined,
        textAlign: align,
        whiteSpace: width ? 'pre-wrap' : 'nowrap',
        overflowWrap: width ? 'break-word' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const ph = (v) => (hasVal(v) ? v : '');

const NB = ' ';
const HEADERS = [
  `Order
${NB}no.`,
  `Order
${NB}time`,
  `Trade
${NB}no.`,
  `Trade
${NB}time`,
  `Security/Contract
description`,
  'Exchange',
  `Buy(B)/
${NB}Sell(S)`,
  'Quantity',
  `Gross Rate/
${NB}Trade Price
${NB}Per unit (Rs)`,
  `Brokerage
${NB}per Unit
${NB}(Rs)`,
  `Net Rate
per Unit
${NB}(Rs)`,
  `Closing Rate
${NB}per Unit (only for
Derivatives)
${NB}(Rs)`,
  `Net Total
${NB}(Before
${NB}Levies)
${NB}(Rs)`,
  'Remarks',
];

const multiline = (s) =>
  s.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 ? <br /> : null}
    </span>
  ));

function DocHeader({ brand }) {
  const R = HEAD.right;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: pt(HEAD.logo.x),
          top: pt(HEAD.logo.top),
          height: pt(HEAD.logo.height),
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {brand.logoImage ? (
          <img
            src={brand.logoImage}
            alt=""
            style={{ height: pt(HEAD.logo.height), maxWidth: pt(300), objectFit: 'contain' }}
          />
        ) : (
          <span
            style={{
              fontSize: pt(HEAD.logo.height * 0.82),
              fontWeight: 700,
              letterSpacing: '-0.5pt',
              color: brand.accent,
              lineHeight: 1,
            }}
          >
            {brand.logoText}
          </span>
        )}
      </div>

      <T x={HEAD.title.x} capTop={HEAD.title.capTop} size={HEAD.title.size} bold color={brand.accent}>
        {brand.docTitle}
      </T>
      <T x={HEAD.subtitle.x} capTop={HEAD.subtitle.capTop} size={HEAD.subtitle.size} color={COLORS.subtitle}>
        {brand.docSubtitle}
      </T>

      <T right={R.right} capTop={R.firmName.capTop} size={R.firmName.size} bold color={COLORS.firm} align="right" width={R.width}>
        {brand.firmName}
      </T>
      {brand.formerly ? (
        <T right={R.right} capTop={R.formerly.capTop} size={R.formerly.size} color={COLORS.formerly} align="right" width={R.width}>
          {brand.formerly}
        </T>
      ) : null}

      <T
        right={R.right}
        capTop={R.block1.capTop}
        size={R.block1.size}
        lh={R.block1.lh}
        color={COLORS.firmLine}
        align="right"
        width={R.width}
      >
        {brand.regOffice}
        {brand.regOffice && brand.cinLine ? '\n' : ''}
        {brand.cinLine}
      </T>
      <T
        right={R.right}
        capTop={R.block2.capTop}
        size={R.block2.size}
        lh={R.block2.lh}
        color={COLORS.firmLine}
        align="right"
        width={R.width}
      >
        {brand.contactLine}
      </T>
      <T
        right={R.right}
        capTop={R.block3.capTop}
        size={R.block3.size}
        lh={R.block3.lh}
        color={COLORS.firmLine}
        align="right"
        width={R.width}
      >
        {brand.dealingOffice}
      </T>
    </>
  );
}

function ClientBlock({ client, note }) {
  const C = CLIENT;
  const [x0, x1, x2, x3] = C.colX;
  const [y0, y1, y2, y3] = C.rowBaseline;
  const cell = (x, y, text, width) => (
    <T x={x} baseline={y} size={C.size} width={width}>
      {text}
    </T>
  );
  const s = note.settlements;

  return (
    <>
      {cell(x0, y0, 'Unique Client Code')}
      {cell(x1, y0, ph(client.ucc))}
      {cell(x2, y0, 'Name')}
      {cell(x3, y0, ph(client.name), C.valueWidth)}

      {cell(x0, y1, 'Client GSTIN')}
      {cell(x1, y1, ph(client.gstin))}
      {cell(x2, y1, 'Mobile Number')}
      {cell(x3, y1, ph(client.mobile), C.valueWidth)}

      {cell(x0, y2, 'PAN')}
      {cell(x1, y2, ph(client.pan))}
      {cell(x2, y2, 'Trading/Backoffice Code')}
      {cell(x3, y2, ph(client.backofficeCode), C.valueWidth)}

      {cell(x2, y3, 'Address')}
      <T x={x3} baseline={y3} size={C.size} lh={C.addressLh} width={C.addressWidth}>
        {ph(client.address)}
      </T>

      <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${SETTLE.x}pt, ${SETTLE.top}pt)` }}>
      <SettleGrid
        colW={SETTLE.colW}
        rowH={SETTLE.rowH}
        rows={[[1, 4], [1, 4], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1]]}
        greenRow={SETTLE.greenRow}
      />
      <table
        style={{
          position: 'relative',
          zIndex: 1,
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          fontSize: pt(SETTLE.size),
        }}
      >
        <colgroup>
          {SETTLE.colW.map((w, i) => <col key={i} style={{ width: pt(w) }} />)}
        </colgroup>
        <tbody>
          <tr>
            <td className="sc">Contract Note no</td>
            <td className="sc" colSpan={4}>{ph(note.contractNoteNo)}</td>
          </tr>
          <tr>
            <td className="sc">Trade Date</td>
            <td className="sc" colSpan={4}>{ph(note.tradeDate)}</td>
          </tr>
          <tr>
            <td className="sc hd" />
            {s.map((c) => <td className="sc hd" key={c.label}>{c.label}</td>)}
          </tr>
          <tr>
            <td className="sc">Settlement date</td>
            {s.map((c) => <td className="sc" key={c.label}>{c.date}</td>)}
          </tr>
          <tr>
            <td className="sc">Settlement No</td>
            {s.map((c) => <td className="sc" key={c.label}>{c.no}</td>)}
          </tr>
        </tbody>
      </table>
      </div>
    </>
  );
}

function TradesTable({ items }) {
  const Tb = TRADES;
  const rowH = items.map((it) =>
    it.kind === 'spacer' ? Tb.spacerH : it.kind === 'trade' ? Tb.rowH : Tb.totalH
  );
  // Column spans used by the source for its summary rows.
  const TOTAL_SPANS = [4, 1, 2, 1, 4, 1, 1];
  const NET_SPANS = [12, 1, 1];
  const SPACER_SPANS = [14];
  const rowSpans = items.map((it) =>
    it.kind === 'spacer' ? SPACER_SPANS : it.kind === 'total' ? TOTAL_SPANS : it.kind === 'net' ? NET_SPANS : null
  );
  return (
    <div style={{ position: 'absolute', left: pt(Tb.x), top: pt(Tb.top) }}>
    <Grid colW={Tb.colW} headH={Tb.headH} rowH={rowH} rowSpans={rowSpans} />
    <table
      className="doc"
      style={{
        position: 'relative',
        zIndex: 1,
        width: pt(Tb.colW.reduce((a, b) => a + b, 0)),
      }}
    >
      <colgroup>
        {Tb.colW.map((w, i) => <col key={i} style={{ width: pt(w) }} />)}
      </colgroup>
      <thead>
        <tr style={{ height: pt(Tb.headH) }}>
          {HEADERS.map((h, i) => (
            <th key={i} style={{ fontSize: pt(Tb.headSize), lineHeight: pt(Tb.headLh) }}>
              {multiline(h)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody style={{ fontSize: pt(Tb.bodySize) }}>
        {items.map((it, i) => {
          if (it.kind === 'spacer') {
            return (
              <tr className="spacer" key={i} style={{ height: pt(Tb.spacerH) }}>
                <td colSpan={14} />
              </tr>
            );
          }
          if (it.kind === 'total') {
            return (
              <tr className="total" key={i} style={{ height: pt(Tb.totalH) }}>
                <td className="lbl" colSpan={4}>Total</td>
                <td className="l plain">{it.description}</td>
                <td colSpan={2} />
                <td>{it.qty}</td>
                <td colSpan={4} />
                <td>{fix2(it.net)}</td>
                <td />
              </tr>
            );
          }
          if (it.kind === 'net') {
            return (
              <tr className="total" key={i} style={{ height: pt(Tb.netH) }}>
                <td className="lbl" colSpan={12}>Net Total</td>
                <td>{fix2(it.net)}</td>
                <td />
              </tr>
            );
          }
          const r = it.row;
          return (
            <tr key={i} style={{ height: pt(Tb.rowH) }}>
              <td>{r.orderNo}</td>
              <td>{r.orderTime}</td>
              <td>{r.tradeNo}</td>
              <td>{r.tradeTime}</td>
              <td className="l">{r.description}</td>
              <td>{r.exchange}</td>
              <td>{r.side}</td>
              <td>{r.q}</td>
              <td>{fmt(r.gross)}</td>
              <td>{r.bpu === null ? '' : fix2(r.bpu)}</td>
              <td>{fix2(r.netRate)}</td>
              <td>{fmt(r.closingRate)}</td>
              <td>{fix2(r.netTotal)}</td>
              <td>{r.remarks}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}

function ChargesTable({ data, computed }) {
  const c = computed.charges;
  const C = CHARGES;
  const eqSettle = data.charges.equitySettlementNo;

  const rows = [
    ['Settlement Number', eqSettle, '', '', true],
    ['Pay In / Pay Out Obligation', '', computed.netTotal, computed.netTotal],
    ['Taxable Value of Supply (Brokerage)', '', -c.brokerage, -c.brokerage],
    ['Exchange Transaction Charges', '', -c.exchTxn, -c.exchTxn],
    ['CGST (9% on Brokerage, Exchange transaction charges, SEBI turnover fees and IPFT charges)', '', -c.cgst, -c.cgst],
    ['SGST (9% on Brokerage, Exchange transaction charges, SEBI turnover fees and IPFT charges)', '', -c.sgst, -c.sgst],
    ['IGST (18% on Brokerage, Exchange transaction charges, SEBI turnover fees and IPFT charges)', '', -c.igst, -c.igst],
    ['UTT', '', -c.utt, -c.utt],
    ['Securities Transaction Tax', '', -c.stt, -c.stt],
    ['SEBI Turnover Fees', '', -c.sebi, -c.sebi],
    ['Stamp Duty', '', -c.stamp, -c.stamp],
    ['IPFT Charges', '', -c.ipft, -c.ipft],
    ['Net Amount Receivable / Payable By Client', '', computed.netAmount, computed.netAmount],
  ];

  return (
    <div style={{ position: 'absolute', left: pt(C.x), top: pt(C.top) }}>
    <Grid colW={C.colW} headH={C.headH} rowH={rows.map(() => C.rowH)} />
    <table
      className="doc charges"
      style={{
        position: 'relative',
        zIndex: 1,
        width: pt(C.colW.reduce((a, b) => a + b, 0)),
      }}
    >
      <colgroup>
        {C.colW.map((w, i) => <col key={i} style={{ width: pt(w) }} />)}
      </colgroup>
      <thead>
        <tr style={{ height: pt(C.headH) }}>
          <th style={{ fontSize: pt(C.headSize) }}>Description</th>
          <th style={{ fontSize: pt(C.headSize) }}>Equity</th>
          <th style={{ fontSize: pt(C.headSize), lineHeight: pt(C.headSize) }}>
            Future &amp;<br />Options
          </th>
          <th style={{ fontSize: pt(C.headSize) }}>Net Total</th>
        </tr>
      </thead>
      <tbody style={{ fontSize: pt(C.bodySize) }}>
        {rows.map(([label, eq, fo, net, raw], i) => (
          <tr key={i} style={{ height: pt(C.rowH) }}>
            <td className="l">{label}</td>
            <td>{raw ? eq : eq === '' ? '' : fix2(eq)}</td>
            <td>{raw ? fo : fix2(fo)}</td>
            <td>{raw ? net : fix2(net)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function FooterBlock({ data }) {
  const f = data.footer;
  const L = FOOTER.legal;
  const K = FOOTER.kv;
  const S = FOOTER.sign;

  // A blank line in the notes means a paragraph gap, as in the source.
  const legalTop = topForCapTop(L.capTop, L.size, L.lh);
  const notes = f.notes.map((n) => n.replace(/\{firm\}/g, data.brand.firmName));

  const kvRows = [
    ['PAN of Trading Member', ph(f.panTM)],
    ['GSTIN of Trading Member', ph(f.gstinTM)],
    ['Description of Service', f.serviceDesc],
    ['Service Account Code (SAC)', f.sac],
  ];

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: pt(L.x),
          top: pt(legalTop),
          width: pt(L.width),
          fontSize: pt(L.size),
          lineHeight: pt(L.lh),
          color: COLORS.legal,
        }}
      >
        {notes.map((n, i) =>
          n.trim() === '' ? (
            <div key={i} style={{ height: pt(L.gap) }} />
          ) : (
            <div key={i}>{n}</div>
          )
        )}
      </div>

      <T x={FOOTER.date.labelX} baseline={FOOTER.date.labelBaseline} size={FOOTER.date.labelSize} bold color={COLORS.label}>
        DATE:
      </T>
      <T x={FOOTER.date.valueX} baseline={FOOTER.date.baseline} size={FOOTER.date.valueSize}>
        {ph(f.date)}
      </T>
      <T x={FOOTER.date.labelX} baseline={FOOTER.place.labelBaseline} size={FOOTER.date.labelSize} bold color={COLORS.label}>
        PLACE:
      </T>
      <T x={FOOTER.date.valueX} baseline={FOOTER.place.baseline} size={FOOTER.date.valueSize}>
        {ph(f.place)}
      </T>

      <div
        style={{
          position: 'absolute',
          left: pt(K.labelX),
          top: pt(topForCapTop(K.firstCapTop, K.size, K.lh)),
          fontSize: pt(K.size),
          lineHeight: pt(K.lh),
          fontWeight: 700,
          color: COLORS.label,
        }}
      >
        {kvRows.map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', marginBottom: pt(K.rowGap) }}>
            <div style={{ width: pt(K.colonX - K.labelX) }}>{k}</div>
            <div style={{ width: pt(K.valueX - K.colonX) }}>:</div>
            <div style={{ width: pt(K.valueWidth) }}>{v}</div>
          </div>
        ))}
      </div>

      {f.qrImage ? (
        <img
          src={f.qrImage}
          alt=""
          style={{
            position: 'absolute',
            left: pt(FOOTER.qr.x),
            top: pt(FOOTER.qr.y),
            width: pt(FOOTER.qr.size),
            height: pt(FOOTER.qr.size),
            objectFit: 'contain',
          }}
        />
      ) : null}

      <T x={S.x} baseline={S.line1Baseline} size={S.size} color={COLORS.label}>
        {f.signLine1}
      </T>
      <T x={S.x} baseline={S.line2Baseline} size={S.boldSize} bold color={COLORS.label}>
        For {data.brand.firmName}
      </T>

      {f.signatureImage ? (
        <img
          src={f.signatureImage}
          alt=""
          style={{
            position: 'absolute',
            left: pt(S.x),
            top: pt(S.line2Baseline + 8),
            maxHeight: pt(44),
            maxWidth: pt(240),
            objectFit: 'contain',
          }}
        />
      ) : null}

      <T x={S.x} baseline={S.signatoryBaseline} size={S.size} color={COLORS.label}>
        {f.signLabel}
      </T>
    </>
  );
}

export default function ContractNote({ data, computed, pages }) {
  const tradePages = data.layout.tradesOnNewPage ? pages : pages.slice(1);
  const firstPageItems = data.layout.tradesOnNewPage ? null : pages[0];

  return (
    <>
      {/* Page 1 - client details */}
      <section className="page" style={{ fontFamily: data.brand.fontFamily }}>
        <DocHeader brand={data.brand} />
        <ClientBlock client={data.client} note={data.note} />
        <T x={SALUTATION.x} baseline={SALUTATION.baseline} size={SALUTATION.size}>
          {data.note.salutation}
        </T>
        <T x={SEGMENT.x} baseline={SEGMENT.baseline} size={SEGMENT.size} bold>
          {data.note.segmentTitle}
        </T>
        {firstPageItems && firstPageItems.length ? <TradesTable items={firstPageItems} /> : null}
      </section>

      {/* Trade pages */}
      {tradePages.map((items, i) =>
        items.length ? (
          <section className="page" key={`t${i}`} style={{ fontFamily: data.brand.fontFamily }}>
            <DocHeader brand={data.brand} />
            <TradesTable items={items} />
          </section>
        ) : null
      )}

      {/* Final page - charges, small print, signature */}
      <section className="page" style={{ fontFamily: data.brand.fontFamily }}>
        <DocHeader brand={data.brand} />
        <ChargesTable data={data} computed={computed} />
        <FooterBlock data={data} />
      </section>
    </>
  );
}
