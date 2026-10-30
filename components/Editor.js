'use client';

import { EXCHANGES, FONTS, emptyTrade } from '@/lib/defaults';
import { fix2 } from '@/lib/calc';

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="f">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Area({ label, value, onChange, rows = 3 }) {
  return (
    <label className="f">
      <span>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="f">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </label>
  );
}

const SEGMENTS = [
  { value: '', label: 'Auto (from description)' },
  { value: 'EQ', label: 'Equity' },
  { value: 'FO', label: 'Future & Options' },
];

const HEADER_FITS = [
  { value: 'fill', label: 'Stretch to the band (exact cover)' },
  { value: 'contain', label: 'Fit inside (keeps proportions)' },
  { value: 'cover', label: 'Cover the band and crop' },
];

function ImagePicker({ label, value, onChange }) {
  return (
    <label className="f">
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="file"
          accept="image/*"
          style={{ fontSize: 11 }}
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
        {value ? (
          <button type="button" className="tiny danger" onClick={() => onChange('')}>Clear</button>
        ) : null}
      </div>
    </label>
  );
}

export default function Editor({ data, set, computed }) {
  const setIn = (path, value) => set(path, value);

  const updateTrade = (idx, key, value) => {
    const next = data.trades.map((t, i) => (i === idx ? { ...t, [key]: value } : t));
    setIn('trades', next);
  };

  const addTrade = () => {
    const last = data.trades[data.trades.length - 1];
    const seed = emptyTrade();
    if (last) {
      seed.description = last.description;
      seed.exchange = last.exchange;
    }
    setIn('trades', [...data.trades, seed]);
  };

  const removeTrade = (idx) => setIn('trades', data.trades.filter((_, i) => i !== idx));

  const moveTrade = (idx, dir) => {
    const next = [...data.trades];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setIn('trades', next);
  };

  const dupTrade = (idx) => {
    const next = [...data.trades];
    next.splice(idx + 1, 0, { ...data.trades[idx], id: Math.random().toString(36).slice(2, 10) });
    setIn('trades', next);
  };

  const setOverride = (key, value) => {
    setIn('charges.overrides', { ...data.charges.overrides, [key]: value });
  };

  const c = computed.charges;
  const overrideRows = [
    ['brokerage', 'Brokerage'],
    ['exchTxn', 'Exchange Transaction Charges'],
    ['cgst', 'CGST'],
    ['sgst', 'SGST'],
    ['igst', 'IGST'],
    ['stt', 'Securities Transaction Tax'],
    ['sebi', 'SEBI Turnover Fees'],
    ['stamp', 'Stamp Duty'],
    ['ipft', 'IPFT Charges'],
  ];

  return (
    <div>
      <details className="sec" open>
        <summary>Your firm / branding</summary>
        <div className="body">
          <p className="hint">
            This is your own letterhead. Put your firm&apos;s real details here &mdash; never another
            broker&apos;s name, logo or registration numbers.
          </p>
          <Select
            label="Font family (applies to every page)"
            value={data.brand.fontFamily}
            onChange={(v) => setIn('brand.fontFamily', v)}
            options={FONTS}
          />
          <p className="hint">
            The source note&apos;s text layer is Helvetica, so the first option reproduces it exactly.
          </p>
          <ImagePicker
            label="Header image (replaces the whole header band)"
            value={data.brand.headerImage}
            onChange={(v) => setIn('brand.headerImage', v)}
          />
          {data.brand.headerImage ? (
            <>
              <Select
                label="Header image fit"
                value={data.brand.headerFit}
                onChange={(v) => setIn('brand.headerFit', v)}
                options={HEADER_FITS}
              />
              <p className="hint">
                The image fills the header band exactly: 1611.6 &times; 207.9pt, about 7.75:1.
                Export it at 1946 &times; 251px or larger so it stays sharp. While an image is
                set, the logo and firm-detail fields below are not drawn.
              </p>
            </>
          ) : null}
          <ImagePicker label="Logo image" value={data.brand.logoImage} onChange={(v) => setIn('brand.logoImage', v)} />
          <div className="grid2">
            <Field label="Logo text (if no image)" value={data.brand.logoText} onChange={(v) => setIn('brand.logoText', v)} />
            <Field label="Accent colour" type="color" value={data.brand.accent} onChange={(v) => setIn('brand.accent', v)} />
          </div>
          <Field label="Firm name" value={data.brand.firmName} onChange={(v) => setIn('brand.firmName', v)} />
          <Field label="Formerly known as (optional)" value={data.brand.formerly} onChange={(v) => setIn('brand.formerly', v)} />
          <Area label="Registered office line" value={data.brand.regOffice} onChange={(v) => setIn('brand.regOffice', v)} rows={2} />
          <Area label="CIN / SEBI / DP ID line" value={data.brand.cinLine} onChange={(v) => setIn('brand.cinLine', v)} rows={2} />
          <Area label="Contact / grievance / compliance line" value={data.brand.contactLine} onChange={(v) => setIn('brand.contactLine', v)} rows={3} />
          <Area label="Dealing office line" value={data.brand.dealingOffice} onChange={(v) => setIn('brand.dealingOffice', v)} rows={2} />
          <div className="grid2">
            <Field label="Document title" value={data.brand.docTitle} onChange={(v) => setIn('brand.docTitle', v)} />
            <Field label="Document subtitle" value={data.brand.docSubtitle} onChange={(v) => setIn('brand.docSubtitle', v)} />
          </div>
        </div>
      </details>

      <details className="sec" open>
        <summary>Client details</summary>
        <div className="body">
          <div className="grid2">
            <Field label="Unique Client Code" value={data.client.ucc} onChange={(v) => setIn('client.ucc', v)} />
            <Field label="Trading/Backoffice Code" value={data.client.backofficeCode} onChange={(v) => setIn('client.backofficeCode', v)} />
            <Field label="Client GSTIN" value={data.client.gstin} onChange={(v) => setIn('client.gstin', v)} />
            <Field label="PAN" value={data.client.pan} onChange={(v) => setIn('client.pan', v)} />
            <Field label="Name" value={data.client.name} onChange={(v) => setIn('client.name', v)} />
            <Field label="Mobile Number" value={data.client.mobile} onChange={(v) => setIn('client.mobile', v)} />
          </div>
          <Area label="Address" value={data.client.address} onChange={(v) => setIn('client.address', v)} rows={3} />
        </div>
      </details>

      <details className="sec" open>
        <summary>Note &amp; settlement</summary>
        <div className="body">
          <div className="grid2">
            <Field label="Contract Note no" value={data.note.contractNoteNo} onChange={(v) => setIn('note.contractNoteNo', v)} />
            <Field label="Trade Date" value={data.note.tradeDate} onChange={(v) => setIn('note.tradeDate', v)} placeholder="08-11-2024" />
          </div>
          {data.note.settlements.map((s, i) => (
            <div className="grid3" key={s.label}>
              <Field label="Segment" value={s.label} onChange={(v) => {
                const next = data.note.settlements.map((x, j) => (j === i ? { ...x, label: v } : x));
                setIn('note.settlements', next);
              }} />
              <Field label="Settlement date" value={s.date} onChange={(v) => {
                const next = data.note.settlements.map((x, j) => (j === i ? { ...x, date: v } : x));
                setIn('note.settlements', next);
              }} />
              <Field label="Settlement no" value={s.no} onChange={(v) => {
                const next = data.note.settlements.map((x, j) => (j === i ? { ...x, no: v } : x));
                setIn('note.settlements', next);
              }} />
            </div>
          ))}
          <Area label="Salutation line" value={data.note.salutation} onChange={(v) => setIn('note.salutation', v)} rows={2} />
          <Field label="Segment heading" value={data.note.segmentTitle} onChange={(v) => setIn('note.segmentTitle', v)} placeholder="auto" />
          <p className="hint">
            Left blank it reads EQUITY, FUTURE &amp; OPTIONS or both, depending on what the
            trades below are.
          </p>
        </div>
      </details>

      <details className="sec" open>
        <summary>Trades ({data.trades.length})</summary>
        <div className="body">
          <p className="hint">
            Rows with the same contract description that sit next to each other are grouped and get
            their own <b>Total</b> row, exactly like the source layout.
          </p>
          {data.trades.map((t, i) => (
            <div className="trade-card" key={t.id || i}>
              <div className="head">
                <b>#{i + 1}</b>
                <button className="tiny" onClick={() => moveTrade(i, -1)} disabled={i === 0}>&uarr;</button>
                <button className="tiny" onClick={() => moveTrade(i, 1)} disabled={i === data.trades.length - 1}>&darr;</button>
                <button className="tiny" onClick={() => dupTrade(i)}>Copy</button>
                <button className="tiny danger" onClick={() => removeTrade(i)}>Delete</button>
              </div>
              <Field label="Security / Contract description" value={t.description} onChange={(v) => updateTrade(i, 'description', v)} placeholder="NIFTY 24000 CE 28 Nov 2024" />
              <div className="grid2">
                <Field label="Order no." value={t.orderNo} onChange={(v) => updateTrade(i, 'orderNo', v)} />
                <Field label="Order time" value={t.orderTime} onChange={(v) => updateTrade(i, 'orderTime', v)} placeholder="11:56:24" />
                <Field label="Trade no." value={t.tradeNo} onChange={(v) => updateTrade(i, 'tradeNo', v)} />
                <Field label="Trade time" value={t.tradeTime} onChange={(v) => updateTrade(i, 'tradeTime', v)} placeholder="11:56:31" />
              </div>
              <div className="grid3">
                <Select label="Exchange" value={t.exchange} onChange={(v) => updateTrade(i, 'exchange', v)} options={EXCHANGES} />
                <Select label="Buy / Sell" value={t.side} onChange={(v) => updateTrade(i, 'side', v)} options={[{ value: 'B', label: 'B - Buy' }, { value: 'S', label: 'S - Sell' }]} />
                <Field label="Quantity" value={t.qty} onChange={(v) => updateTrade(i, 'qty', v)} placeholder="440" />
              </div>
              <div className="grid3">
                <Select label="Segment" value={t.segment || ''} onChange={(v) => updateTrade(i, 'segment', v)} options={SEGMENTS} />
              </div>
              <div className="grid3">
                <Field label="Gross rate" value={t.rate} onChange={(v) => updateTrade(i, 'rate', v)} placeholder="13.00" />
                <Field label="Brokerage/unit" value={t.brokeragePerUnit} onChange={(v) => updateTrade(i, 'brokeragePerUnit', v)} placeholder="blank" />
                <Field label="Closing rate" value={t.closingRate} onChange={(v) => updateTrade(i, 'closingRate', v)} placeholder="blank" />
              </div>
              <Field label="Remarks" value={t.remarks} onChange={(v) => updateTrade(i, 'remarks', v)} />
            </div>
          ))}
          <button className="primary" onClick={addTrade}>+ Add trade row</button>
        </div>
      </details>

      <details className="sec">
        <summary>Brokerage &amp; levies</summary>
        <div className="body">
          <Select
            label="Brokerage basis"
            value={data.charges.brokerageMode}
            onChange={(v) => setIn('charges.brokerageMode', v)}
            options={[
              { value: 'flat', label: 'Flat Rs per executed order' },
              { value: 'pct', label: '% of turnover, capped per trade' },
            ]}
          />
          {data.charges.brokerageMode === 'flat' ? (
            <Field label="Rs per order" value={data.charges.flatPerOrder} onChange={(v) => setIn('charges.flatPerOrder', v)} />
          ) : (
            <div className="grid2">
              <Field label="Rate %" value={data.charges.pctRate} onChange={(v) => setIn('charges.pctRate', v)} />
              <Field label="Cap per trade (Rs)" value={data.charges.pctCap} onChange={(v) => setIn('charges.pctCap', v)} />
            </div>
          )}
          <p className="hint">
            Distinct order numbers found: <b>{c.orderCount}</b> &middot; turnover:
            <b> {fix2(c.turnover)}</b> (buy {fix2(c.buyTurnover)} / sell {fix2(c.sellTurnover)})
          </p>

          <div className="grid2">
            <Field label="Exchange txn charges %" value={data.charges.exchTxnRate} onChange={(v) => setIn('charges.exchTxnRate', v)} />
            <Field label="SEBI turnover fees %" value={data.charges.sebiRate} onChange={(v) => setIn('charges.sebiRate', v)} />
            <Field label="IPFT %" value={data.charges.ipftRate} onChange={(v) => setIn('charges.ipftRate', v)} />
            <Field label="STT % (sell side)" value={data.charges.sttRate} onChange={(v) => setIn('charges.sttRate', v)} />
            <Field label="Stamp duty % (buy side)" value={data.charges.stampRate} onChange={(v) => setIn('charges.stampRate', v)} />
            <Field label="Equity settlement no" value={data.charges.equitySettlementNo} onChange={(v) => setIn('charges.equitySettlementNo', v)} />
          </div>
          <p className="hint">
            The rates above apply to the <b>Future &amp; Options</b> column. Cash equity is
            charged differently, so it has its own set below. A trade lands in whichever
            column its Segment says; left on Auto, anything with a CE, PE or FUT leg counts
            as F&amp;O.
          </p>
          <div className="grid2">
            <Field label="Equity: exchange txn %" value={data.charges.eq.exchTxnRate} onChange={(v) => setIn('charges.eq.exchTxnRate', v)} />
            <Field label="Equity: SEBI fees %" value={data.charges.eq.sebiRate} onChange={(v) => setIn('charges.eq.sebiRate', v)} />
            <Field label="Equity: IPFT %" value={data.charges.eq.ipftRate} onChange={(v) => setIn('charges.eq.ipftRate', v)} />
            <Field label="Equity: STT %" value={data.charges.eq.sttRate} onChange={(v) => setIn('charges.eq.sttRate', v)} />
            <Field label="Equity: stamp duty % (buy)" value={data.charges.eq.stampRate} onChange={(v) => setIn('charges.eq.stampRate', v)} />
            <Select
              label="Equity: STT charged on"
              value={data.charges.eq.sttSide}
              onChange={(v) => setIn('charges.eq.sttSide', v)}
              options={[{ value: 'both', label: 'Both legs (delivery)' }, { value: 'sell', label: 'Sell leg only (intraday)' }]}
            />
          </div>
          <p className="hint">
            Defaults are NSE delivery. For intraday use STT 0.025 on the sell leg only and
            stamp duty 0.003; on BSE the exchange txn rate is 0.00375.
          </p>
          <Select
            label="GST"
            value={data.charges.gstMode}
            onChange={(v) => setIn('charges.gstMode', v)}
            options={[
              { value: 'igst', label: 'Inter-state - IGST 18%' },
              { value: 'cgst_sgst', label: 'Intra-state - CGST 9% + SGST 9%' },
            ]}
          />
          <p className="hint">STT and stamp duty are rounded to the nearest rupee, the way the exchanges levy them.</p>

          <div style={{ marginTop: 14, fontWeight: 600, fontSize: 12 }}>Manual overrides</div>
          <p className="hint">Leave blank to keep the calculated figure.</p>
          {overrideRows.map(([key, label]) => (
            <div className="ovr" key={key}>
              <div>
                {label}
                <div className="auto">auto: {fix2(c[key])}</div>
              </div>
              <input
                value={data.charges.overrides[key] ?? ''}
                placeholder="auto"
                onChange={(e) => setOverride(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </details>

      <details className="sec">
        <summary>Footer &amp; signature</summary>
        <div className="body">
          <div className="grid2">
            <Field label="Date" value={data.footer.date} onChange={(v) => setIn('footer.date', v)} placeholder="08-11-2024" />
            <Field label="Place" value={data.footer.place} onChange={(v) => setIn('footer.place', v)} />
            <Field label="PAN of Trading Member" value={data.footer.panTM} onChange={(v) => setIn('footer.panTM', v)} />
            <Field label="GSTIN of Trading Member" value={data.footer.gstinTM} onChange={(v) => setIn('footer.gstinTM', v)} />
          </div>
          <Area label="Description of Service" value={data.footer.serviceDesc} onChange={(v) => setIn('footer.serviceDesc', v)} rows={2} />
          <Field label="Service Account Code (SAC)" value={data.footer.sac} onChange={(v) => setIn('footer.sac', v)} />
          <div className="grid2">
            <Field label="Sign-off line" value={data.footer.signLine1} onChange={(v) => setIn('footer.signLine1', v)} />
            <Field label="Signature label" value={data.footer.signLabel} onChange={(v) => setIn('footer.signLabel', v)} />
          </div>
          <ImagePicker label="Signature image" value={data.footer.signatureImage} onChange={(v) => setIn('footer.signatureImage', v)} />
          <ImagePicker label="QR image" value={data.footer.qrImage} onChange={(v) => setIn('footer.qrImage', v)} />
          <Area
            label="Legal notes (one per line, blank line = gap, {firm} = firm name)"
            rows={10}
            value={data.footer.notes.join('\n')}
            onChange={(v) => setIn('footer.notes', v.split('\n'))}
          />
        </div>
      </details>

      <details className="sec">
        <summary>Page layout</summary>
        <div className="body">
          <label className="f">
            <span>Start the trade table on its own page</span>
            <select
              value={data.layout.tradesOnNewPage ? 'yes' : 'no'}
              onChange={(e) => setIn('layout.tradesOnNewPage', e.target.value === 'yes')}
            >
              <option value="yes">Yes &mdash; matches the source note</option>
              <option value="no">No &mdash; start on page 1</option>
            </select>
          </label>
          <Field label="Trade rows per page" value={data.layout.rowsPerPage} onChange={(v) => setIn('layout.rowsPerPage', v)} />
        </div>
      </details>
    </div>
  );
}
