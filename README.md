# Contract Note Generator

An editable contract note for **your own firm**, with a print layout that matches the
standard broker format page-for-page: A2 landscape (1684 x 1190 pt), three pages,
same column widths, same table structure.

> Put your own firm's name, logo and registration numbers in the branding section.
> Do not put another broker's identity on a note you issue — that is forgery, not a template.

## Run it

Needs a local MongoDB on `mongodb://127.0.0.1:27017` (override with `MONGODB_URI`).

```bash
npm install
npm run dev          # http://localhost:3000
```

If MongoDB is not reachable the app still works - it falls back to browser
storage and says so in the toolbar.

For a production build:

```bash
npm run build
npm start
```

## Using it

The left panel is the editor, the right side is a live preview of the real printed pages.

| Section | What it controls |
| --- | --- |
| Your firm / branding | Logo (image or text), accent colour, firm name, registered office, CIN / SEBI / DP ID, contact + compliance line, dealing office |
| Client details | UCC, GSTIN, PAN, name, mobile, backoffice code, address |
| Note & settlement | Contract note no, trade date, and the four settlement columns |
| Trades | Add, reorder, copy and delete rows |
| Brokerage & levies | Rates for every charge, GST treatment, and a manual override per line |
| Footer & signature | Date, place, PAN/GSTIN of trading member, SAC, signature image, QR image, legal notes |
| Page layout | Whether the trade table starts on its own page, and rows per page |

Everything autosaves to MongoDB about a second after you stop typing, into
`contract_notes.notes`, and is mirrored to browser storage as a backup. Reopening
the app restores the note you edited last. **Saved notes** in the sidebar lists
every note - click one to load it, or delete it. **New** starts a blank note
without touching the saved ones. **Export** writes a `.json`; **Import** reads it back.

### API

| Method | Route | Does |
| --- | --- | --- |
| GET | `/api/notes` | list saved notes, newest first |
| POST | `/api/notes` | save; pass `id` to update in place, omit it to create |
| GET | `/api/notes/latest` | the note edited last, used to restore a session |
| GET | `/api/notes/:id` | load one note |
| DELETE | `/api/notes/:id` | delete one note |

A database failure returns `503` with `{ ok: false, error: "mongo_unavailable" }`,
which is what triggers the local-storage fallback.

## Downloading the PDF

Press **Download PDF**. The file is rendered by headless Chrome through
`/api/pdf`, not by the browser's print dialog.

That matters: the dialog's **Scale** and **Margins** settings silently rescale
the sheet, which turns the 0.5pt rules into something thicker and shifts every
measurement. Driving Chrome directly with `preferCSSPageSize` pins the page to
the 1684 x 1190 pt the CSS declares, whatever the printer defaults are.

It needs Chrome or Edge on the machine. The usual install paths are tried
automatically; set `CHROME_PATH` in `.env.local` if yours is elsewhere.

**Print view** opens the document on its own at `/print`, with no editor around
it. Saving from the browser there works too, but set Paper to **A2
(1684x1190pt)**, Margins to **None** and Scale to **100%** or the output will be
rescaled.

| Method | Route | Does |
| --- | --- | --- |
| GET | `/api/pdf?id=<noteId>` | render that note to PDF (omit `id` for the latest) |
| GET | `/print?id=<noteId>` | the bare document, for printing or screenshots |

## How the numbers work

Quantity is signed: buys positive, sells negative.

```
net rate   = gross rate +/- per-unit brokerage
net total  = -(signed qty x net rate)
```

So a buy is an outflow and a sell an inflow. Rows that share a contract description and sit
next to each other are grouped and get their own **Total** row.

Levies, all configurable in the editor:

| Charge | Default basis |
| --- | --- |
| Brokerage | Rs 20 per distinct executed order (or % of turnover with a cap) |
| Exchange transaction charges | 0.0325% of turnover (BSE index options; NSE F&O is 0.0495%) |
| SEBI turnover fees | 0.0001% of turnover |
| IPFT | 0% (NSE F&O uses 0.0005%) |
| STT | 0.1% of **sell-side** premium, rounded to the nearest rupee |
| Stamp duty | 0.003% of **buy-side** turnover, rounded to the nearest rupee |
| GST | IGST 18% inter-state, or CGST 9% + SGST 9% intra-state, on brokerage + exchange + SEBI + IPFT |

STT and stamp duty round to the nearest rupee because that is how the exchanges levy them.
Any line can be overridden by hand; leave an override blank to keep the calculated figure.

## Layout

```
lib/geometry.js         every measured coordinate, font size and colour
lib/mongo.js            pooled MongoDB connection
app/api/notes/          REST routes for saving and loading
lib/calc.js             pure calculation + pagination, no React
lib/defaults.js         starter data and the storage key
components/Editor.js    the form
components/ContractNote.js  the printed document
app/globals.css         app chrome + shared document rules
app/page.js             state, autosave, zoom, print
```

## How the format was matched

`lib/geometry.js` is not guesswork. Every number in it was extracted from the
source PDF with PyMuPDF - table rectangles, text baselines, font sizes and
colours - and the output was then diffed back against the source:

- page size 1684 x 1190 pt (A2 landscape), 3 pages
- trade table column widths, in points:
  `152.3, 101.6, 114.2, 101.5, 228.5, 88.9, 76.1, 101.6, 139.6, 101.5, 88.9, 139.6, 101.5, 76.2`
- row heights: header 100, trade 48, per-contract total 34, spacer 30, net total 34
- charges table: 637.5 / 109.9 / 109.9 / 109.9, header 40, rows 34
- fonts: 16pt table headers, 14pt body, 22pt bold segment title, 12pt salutation,
  8pt small print
- colours: `#00d09c` header text and header borders, `#f0fbf7` header fill,
  black body grid, `#5f6272` small print, `#494c5e` footer labels
- every body baseline sits 24pt below its row top, whatever the row height, and
  header baselines centre 8pt below the cell centre - the padding values in
  `globals.css` exist to reproduce exactly that

### The grid is drawn as SVG, not CSS borders

The source strokes every table cell as its own rectangle at **0.5pt**. A CSS
border cannot reproduce that: Chrome rounds border widths up to a whole device
pixel, so `0.5pt` prints as 0.75pt, and `border-collapse` still emits a separate
fill per edge (507 of them on the trades page where the source has 187).

So `components/Grid.js` paints the grid as SVG rectangles with
`stroke-width="0.5"`, one per cell, and the table keeps transparent borders
purely for layout. The summary rows merge columns exactly as the source does -
`Total` is `[4,1,2,1,4,1,1]`, the spacer is one full-width cell, `Net Total` is
`[12,1,1]`.

### The header band is a different typeface

The source header is a raster block set in the broker's own brand face, which
runs about **0.86x the width of Helvetica** at the same nominal size. Sizing
those lines by their apparent height made them render too long and wrap in the
wrong places, so the header sizes are *width*-matched instead: title 26.9pt,
firm name 17.8pt, address and contact lines 11.2pt inside a 590pt right-aligned
box.

The footer is mixed: the small print measured ~1.0x (ordinary Helvetica, kept at
8pt), while the DATE/PLACE labels and the key/value block are in the brand face
and are width-matched too - 10.2pt and 10.8pt bold respectively.

Pick the document font under **Your firm / branding -> Font family**. The default
Arial/Helvetica stack is what the source's text layer actually uses.

### Verification

Rendering this app with the source note's own data and diffing against the
original PDF:

| Check | Result |
| --- | --- |
| Page size / count | 1684 x 1190 pt, 3 pages - identical |
| Grid rectangles | **exact match on all three pages** (19 / 187 / 56, zero differences) |
| Stroke width | 0.5pt in both |
| Text spans | **251 paired, 0 failures**; max dx 1.41pt, max dy 0.89pt |
| Pixel diff, body + footer | **0.04% / 0.16% / 0.68%** at 1px tolerance |
| Pixel diff, header band | 2.69% - see below |

The header band is the one thing that cannot be matched exactly: in the source
it is a raster image in a proprietary brand typeface. Positions, sizes and line
breaks match; the glyph outlines are Arial's. Everything below the header - the
tables, the grid, the body text, the small print and the signature block - is
matched to the measurements above.

Re-measuring is the only reason to change `geometry.js`.
