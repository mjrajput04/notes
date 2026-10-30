// Neutral starter data. Fill in your own firm / client details in the editor.

export const EXCHANGES = ['NSE', 'BSE', 'MCX', 'NCDEX'];

export const FONTS = [
  { value: 'Arial, Helvetica, "Liberation Sans", sans-serif', label: 'Arial / Helvetica (matches the source note)' },
  { value: '"Segoe UI", Arial, sans-serif', label: 'Segoe UI' },
  { value: 'Inter, Arial, sans-serif', label: 'Inter (if installed)' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica Neue' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
];

export const SETTLEMENT_COLS = ['NSE-EQ', 'BSE-EQ', 'NSE-FNO', 'BSE-FNO'];

export const emptyTrade = () => ({
  id: Math.random().toString(36).slice(2, 10),
  orderNo: '',
  orderTime: '',
  tradeNo: '',
  tradeTime: '',
  description: '',
  exchange: 'NSE',
  side: 'B',
  qty: '',
  rate: '',
  brokeragePerUnit: '',
  closingRate: '',
  remarks: '',
});

export const defaultData = () => ({
  brand: {
    fontFamily: 'Arial, Helvetica, "Liberation Sans", sans-serif',
    logoText: 'ABC',
    logoImage: '',
    headerImage: '',   // one image for the whole header band; blank = built from the fields below
    headerFit: 'fill',
    accent: '#00b386',
    firmName: 'ABC Securities Private Limited',
    formerly: '',
    regOffice:
      'Registered office address: 00, Sample Road, Example Area, Your City - 000000 |',
    cinLine:
      'CIN: U00000XX0000XXX000000 | SEBI Registration No: INZ000000000 | DP ID: 00000000',
    contactLine:
      'Phone No: 0000000000, Email: support@example.com, Website: www.example.com | Investor Grievances: grievances@example.com | Compliance Officer : Name, Tel: 0000000000, Email: compliance@example.com',
    dealingOffice:
      'Dealing Office Address: 1st floor, Sample Tower, Example Main Road, Your City - 000000',
    docTitle: 'Contract Note',
    docSubtitle: 'ORIGINAL FOR RECEIPT - Tax Invoice under Section 31 of GST Act',
  },

  client: {
    ucc: '',
    gstin: '',
    pan: '',
    name: '',
    mobile: '',
    backofficeCode: '',
    address: '',
  },

  note: {
    contractNoteNo: '',
    tradeDate: '',
    settlements: [
      { label: 'NSE-EQ', date: '', no: '' },
      { label: 'BSE-EQ', date: '', no: '' },
      { label: 'NSE-FNO', date: '', no: '' },
      { label: 'BSE-FNO', date: '', no: '' },
    ],
    salutation:
      'Sir / Madam, I / We have this day done by your order and on your account the following transactions:',
    segmentTitle: 'FUTURE & OPTIONS',
  },

  trades: [
    {
      ...emptyTrade(),
      id: 'r1',
      orderNo: '1000000000000001',
      orderTime: '10:15:00',
      tradeNo: '10000001',
      tradeTime: '10:15:02',
      description: 'NIFTY 24000 CE 28 Nov 2024',
      exchange: 'NSE',
      side: 'B',
      qty: '100',
      rate: '50.00',
    },
    {
      ...emptyTrade(),
      id: 'r2',
      orderNo: '1000000000000002',
      orderTime: '14:20:00',
      tradeNo: '10000002',
      tradeTime: '14:20:05',
      description: 'NIFTY 24000 CE 28 Nov 2024',
      exchange: 'NSE',
      side: 'S',
      qty: '100',
      rate: '62.50',
    },
  ],

  charges: {
    brokerageMode: 'flat',   // 'flat' = Rs per executed order, 'pct' = % of turnover with a cap
    flatPerOrder: '20',
    pctRate: '0.03',
    pctCap: '20',
    exchTxnRate: '0.0325',   // BSE index options; NSE F&O options is 0.0495
    sebiRate: '0.0001',
    ipftRate: '0',
    sttRate: '0.1',          // on sell-side premium, rounded to the nearest rupee
    stampRate: '0.003',      // on buy-side turnover, rounded to the nearest rupee
    gstMode: 'igst',         // 'igst' = inter-state 18%, 'cgst_sgst' = 9% + 9%
    equitySettlementNo: '',
    overrides: {},
  },

  footer: {
    // A blank entry renders as a paragraph gap. {firm} is replaced by the firm name.
    notes: [
      '*CGST:- Central GST | *SGST- State GST | *IGST- Integrated GST | *UTT- Union Territory Tax.',
      '',
      'Details of trade-wise levies shall be provided on request.',
      'Remarks with ** are squaring up of positions/margin/outstanding debts.',
      '',
      "Transactions mentioned in this contract note cum bill shall be governed and construed by the Rules, Bye-laws and Regulations and Circulars of the respective Exchanges on which trades have been executed and Securities and Exchange Board of India from time to time. The Exchanges provide Complaint Resolution, Arbitration and Appellate arbitration facilities at the Regional Arbitration Centres (RAC). The client may approach its nearest centre, details of which are available on respective Exchange's website. Please visit www.nseindia.com for NSE, www.bseindia.com for BSE. Kindly note that purchase of REs only gives you the right to participate in the ongoing Rights Issue of the concerned company by making an application with requisite application money or renounce the REs before the issue closes. REs which are neither subscribed by making an application with requisite application money nor renounced, on or before the Issue closing date shall lapse and shall be extinguished after the Issue closing date.",
      '',
      '{firm} is collecting Securities Transaction Tax and Stamp Duty charges as a pure agent of the investor and hence the same is not considered in the taxable value of supply for charging GST.',
      '',
      'Tax is payable on reverse charge basis - No',
    ],
    date: '',
    place: '',
    panTM: '',
    gstinTM: '',
    serviceDesc: 'Brokerage and related securities and commodities services including commodity exchange services',
    sac: '997152',
    signLine1: 'Yours faithfully,',
    signLabel: 'Authorised Signatory',
    signatureImage: '',
    qrImage: '',
  },

  layout: {
    tradesOnNewPage: true,
    rowsPerPage: 16,
  },
});

export const STORAGE_KEY = 'contract-note-data-v1';
