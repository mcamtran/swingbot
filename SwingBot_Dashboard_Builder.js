// SwingBot Dashboard Builder
// Run this ONCE from Apps Script to build the DASHBOARD tab
// It will clear the tab and rebuild it completely

function buildDashboard() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  let dash     = ss.getSheetByName("DASHBOARD");

  // Create tab if it doesn't exist
  if (!dash) {
    dash = ss.insertSheet("DASHBOARD");
  }

  // Clear everything
  dash.clear();
  dash.clearFormats();

  // Set column widths
  dash.setColumnWidth(1, 30);   // A — spacer
  dash.setColumnWidth(2, 160);  // B — label
  dash.setColumnWidth(3, 130);  // C — value 1
  dash.setColumnWidth(4, 130);  // D — value 2
  dash.setColumnWidth(5, 130);  // E — value 3
  dash.setColumnWidth(6, 30);   // F — spacer

  // Set row heights
  for (let r = 1; r <= 80; r++) dash.setRowHeight(r, 28);
  dash.setRowHeight(1, 50);   // title row
  dash.setRowHeight(2, 12);   // spacer
  dash.setRowHeight(12, 12);  // spacer
  dash.setRowHeight(24, 12);  // spacer
  dash.setRowHeight(36, 12);  // spacer
  dash.setRowHeight(48, 12);  // spacer
  dash.setRowHeight(60, 12);  // spacer

  // ── COLORS ──────────────────────────────────────────────────
  const C = {
    bg:        "#0d0d1a",
    panel:     "#13132a",
    panel2:    "#1a1a35",
    accent:    "#00ffb3",
    accent2:   "#7b61ff",
    red:       "#ff4d6d",
    gold:      "#ffd23f",
    cyan:      "#00d4ff",
    text:      "#e8e8f5",
    muted:     "#6a6a8a",
    border:    "#2a2a4a",
    green:     "#00ffb3",
    white:     "#ffffff",
    darkbg:    "#080810",
  };

  // ── HELPERS ──────────────────────────────────────────────────
  function cell(r, c) { return dash.getRange(r, c); }
  function range(r, c, rows, cols) { return dash.getRange(r, c, rows, cols); }

  function setCell(r, c, value, opts = {}) {
    const cel = cell(r, c);
    if (value !== null) cel.setValue(value);
    if (opts.bg)          cel.setBackground(opts.bg);
    if (opts.color)       cel.setFontColor(opts.color);
    if (opts.bold)        cel.setFontWeight('bold');
    if (opts.size)        cel.setFontSize(opts.size);
    if (opts.align)       cel.setHorizontalAlignment(opts.align);
    if (opts.valign)      cel.setVerticalAlignment(opts.valign);
    if (opts.wrap)        cel.setWrap(opts.wrap);
    if (opts.font)        cel.setFontFamily(opts.font);
    if (opts.italic)      cel.setFontStyle('italic');
    return cel;
  }

  function mergeSet(r, c, cols, value, opts = {}) {
    const rng = range(r, c, 1, cols);
    rng.merge();
    if (value !== null) rng.setValue(value);
    if (opts.bg)     rng.setBackground(opts.bg);
    if (opts.color)  rng.setFontColor(opts.color);
    if (opts.bold)   rng.setFontWeight('bold');
    if (opts.size)   rng.setFontSize(opts.size);
    if (opts.align)  rng.setHorizontalAlignment(opts.align);
    if (opts.valign) rng.setVerticalAlignment(opts.valign);
    if (opts.font)   rng.setFontFamily(opts.font);
    return rng;
  }

  function sectionHeader(row, title, color) {
    range(row, 1, 1, 6).setBackground(C.bg);
    mergeSet(row, 2, 4, "  " + title, {
      bg: C.panel2, color: color || C.accent,
      bold: true, size: 9, font: 'Courier New',
      align: 'left', valign: 'middle'
    });
    range(row, 2, 1, 4).setBorder(
      false, false, true, false, false, false,
      color || C.accent, SpreadsheetApp.BorderStyle.SOLID
    );
  }

  function metricRow(row, label, formula, color, note) {
    range(row, 1, 1, 6).setBackground(C.panel);
    setCell(row, 2, label, {
      bg: C.panel, color: C.muted, size: 9,
      font: 'Courier New', align: 'left', valign: 'middle'
    });
    const valCell = setCell(row, 3, null, {
      bg: C.panel, color: color || C.text,
      bold: true, size: 13, font: 'Courier New',
      align: 'left', valign: 'middle'
    });
    valCell.setFormula(formula);
    if (note) {
      setCell(row, 4, note, {
        bg: C.panel, color: C.muted, size: 8,
        font: 'Courier New', align: 'left', valign: 'middle', italic: true
      });
    }
  }

  function breakdownHeader(row, col1, col2, col3, col4) {
    [
      [col1, C.muted], [col2, C.muted],
      [col3, C.muted], [col4, C.muted]
    ].forEach(([label, color], i) => {
      setCell(row, 3 + i, label, {
        bg: C.panel2, color: color, size: 8,
        font: 'Courier New', bold: true,
        align: i === 0 ? 'left' : 'center', valign: 'middle'
      });
    });
    range(row, 2, 1, 4).setBackground(C.panel2);
    setCell(row, 2, "", { bg: C.panel2 });
  }

  // ── FULL BACKGROUND ──────────────────────────────────────────
  range(1, 1, 80, 6).setBackground(C.bg);

  // ══════════════════════════════════════════════════════════════
  // ROW 1 — TITLE
  // ══════════════════════════════════════════════════════════════
  range(1, 1, 1, 6).setBackground(C.darkbg);
  mergeSet(1, 2, 2, "⚡ SWINGBOT", {
    bg: C.darkbg, color: C.accent,
    bold: true, size: 18, font: 'Courier New',
    align: 'left', valign: 'middle'
  });
  mergeSet(1, 4, 2, "TRADING DASHBOARD", {
    bg: C.darkbg, color: C.muted,
    bold: true, size: 9, font: 'Courier New',
    align: 'right', valign: 'middle'
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 1 — PERFORMANCE SUMMARY (rows 3-11)
  // ══════════════════════════════════════════════════════════════
  sectionHeader(3, "PERFORMANCE SUMMARY", C.accent);

  metricRow(4,  "TOTAL P&L",
    '=IF(COUNTIF(RAW_DATA!R:R,"<>")>1,SUMIF(RAW_DATA!R2:R1000,"<>",RAW_DATA!R2:R1000),0)',
    C.accent);

  metricRow(5,  "WIN RATE",
    '=IF(COUNTIF(RAW_DATA!R2:R1000,"<>0")=0,"—",TEXT(COUNTIF(RAW_DATA!R2:R1000,">0")/COUNTIF(RAW_DATA!R2:R1000,"<>0"),"0%")&" ("&COUNTIF(RAW_DATA!R2:R1000,">0")&"W / "&COUNTIF(RAW_DATA!R2:R1000,"<0")&"L)")',
    C.green);

  metricRow(6,  "EXPECTANCY / TRADE",
    '=IF(COUNTIF(RAW_DATA!R2:R1000,"<>0")=0,"—","$"&TEXT(SUMIF(RAW_DATA!R2:R1000,"<>0",RAW_DATA!R2:R1000)/COUNTIF(RAW_DATA!R2:R1000,"<>0"),"0.00"))',
    C.cyan);

  metricRow(7,  "AVG WIN",
    '=IF(COUNTIF(RAW_DATA!R2:R1000,">0")=0,"—","$"&TEXT(AVERAGEIF(RAW_DATA!R2:R1000,">0",RAW_DATA!R2:R1000),"0.00"))',
    C.green);

  metricRow(8,  "AVG LOSS",
    '=IF(COUNTIF(RAW_DATA!R2:R1000,"<0")=0,"—","$"&TEXT(AVERAGEIF(RAW_DATA!R2:R1000,"<0",RAW_DATA!R2:R1000),"0.00"))',
    C.red);

  metricRow(9,  "PROFIT FACTOR",
    '=IF(COUNTIF(RAW_DATA!R2:R1000,"<0")=0,"—",TEXT(SUMIF(RAW_DATA!R2:R1000,">0",RAW_DATA!R2:R1000)/ABS(SUMIF(RAW_DATA!R2:R1000,"<0",RAW_DATA!R2:R1000)),"0.00"))',
    C.gold);

  metricRow(10, "AVG R-MULTIPLE",
    '=IF(COUNTIF(RAW_DATA!T2:T1000,"<>0")=0,"—",TEXT(AVERAGEIF(RAW_DATA!T2:T1000,"<>0",RAW_DATA!T2:T1000),"0.00")&"R")',
    C.accent2);

  metricRow(11, "AVG DAYS HELD",
    '=IF(COUNTIF(RAW_DATA!U2:U1000,"<>0")=0,"—",TEXT(AVERAGEIF(RAW_DATA!U2:U1000,"<>0",RAW_DATA!U2:U1000),"0.0")&" days")',
    C.muted);

  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — TRADE STATS (rows 13-23)
  // ══════════════════════════════════════════════════════════════
  sectionHeader(13, "TRADE STATISTICS", C.cyan);

  metricRow(14, "TOTAL TRADES",
    '=COUNTA(RAW_DATA!C2:C1000)',
    C.text);

  metricRow(15, "CLOSED TRADES",
    '=COUNTIF(RAW_DATA!J2:J1000,"<>0")-COUNTIF(RAW_DATA!J2:J1000,"")',
    C.text);

  metricRow(16, "OPEN POSITIONS",
    '=COUNTA(RAW_DATA!C2:C1000)-COUNTIF(RAW_DATA!J2:J1000,"<>0")+COUNTIF(RAW_DATA!J2:J1000,"")',
    C.accent);

  metricRow(17, "SLOTS AVAILABLE",
    '=5-(COUNTA(RAW_DATA!C2:C1000)-COUNTIF(RAW_DATA!J2:J1000,"<>0")+COUNTIF(RAW_DATA!J2:J1000,""))',
    C.green);

  metricRow(18, "BEST TRADE",
    '=IF(COUNTIF(RAW_DATA!R2:R1000,">0")=0,"—","$"&TEXT(MAX(RAW_DATA!R2:R1000),"0.00"))',
    C.green);

  metricRow(19, "WORST TRADE",
    '=IF(COUNTIF(RAW_DATA!R2:R1000,"<0")=0,"—","$"&TEXT(MIN(RAW_DATA!R2:R1000),"0.00"))',
    C.red);

  metricRow(20, "BEST R-MULTIPLE",
    '=IF(COUNTIF(RAW_DATA!T2:T1000,"<>0")=0,"—",TEXT(MAX(RAW_DATA!T2:T1000),"0.00")&"R")',
    C.gold);

  metricRow(21, "LARGEST WIN STREAK",
    '="—"',
    C.muted, "coming soon");

  metricRow(22, "PROGRESS TO SCALE",
    '=COUNTA(RAW_DATA!C2:C1000)&" / 50 trades ("&TEXT(COUNTA(RAW_DATA!C2:C1000)/50,"0%")&")"',
    C.accent2);

  metricRow(23, "EST. WEEKS TO SCALE",
    '=IF(COUNTA(RAW_DATA!C2:C1000)=0,"—",TEXT(CEILING((50-COUNTA(RAW_DATA!C2:C1000))/(COUNTA(RAW_DATA!C2:C1000)/MAX(1,DATEDIF(MIN(IF(RAW_DATA!B2:B1000<>"",RAW_DATA!B2:B1000)),TODAY(),"D")/7)),1)&" weeks")',
    C.muted);

  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — P&L BY SIGNAL GRADE (rows 25-32)
  // ══════════════════════════════════════════════════════════════
  sectionHeader(25, "P&L BY SIGNAL GRADE", C.accent2);
  breakdownHeader(26, "GRADE", "P&L", "TRADES", "WIN RATE");

  const grades = ["A", "B", "C", "D"];
  grades.forEach((g, i) => {
    const row = 27 + i;
    range(row, 1, 1, 6).setBackground(C.panel);
    setCell(row, 2, g, {
      bg: C.panel, color: C.accent2, bold: true,
      size: 12, font: 'Courier New', align: 'left', valign: 'middle'
    });
    cell(row, 3).setFormula(
      `=IF(COUNTIF(RAW_DATA!V2:V1000,"${g}")=0,"—","$"&TEXT(SUMPRODUCT((RAW_DATA!V2:V1000="${g}")*(RAW_DATA!R2:R1000<>"")*(RAW_DATA!R2:R1000)),"0.00"))`
    );
    cell(row, 4).setFormula(
      `=IF(COUNTIF(RAW_DATA!V2:V1000,"${g}")=0,"—",COUNTIF(RAW_DATA!V2:V1000,"${g}"))`
    );
    cell(row, 5).setFormula(
      `=IF(COUNTIF(RAW_DATA!V2:V1000,"${g}")=0,"—",TEXT(SUMPRODUCT((RAW_DATA!V2:V1000="${g}")*(RAW_DATA!R2:R1000>0))/MAX(1,COUNTIF(RAW_DATA!V2:V1000,"${g}")),"0%"))`
    );
    [3,4,5].forEach(c => {
      setCell(row, c, null, {
        bg: C.panel, color: C.text, size: 11,
        font: 'Courier New', align: 'center', valign: 'middle'
      });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — P&L BY SELF GRADE (rows 37-43)
  // ══════════════════════════════════════════════════════════════
  sectionHeader(37, "P&L BY SELF GRADE", C.gold);
  breakdownHeader(38, "GRADE", "P&L", "TRADES", "WIN RATE");

  const selfGrades = ["A", "B", "C"];
  selfGrades.forEach((g, i) => {
    const row = 39 + i;
    range(row, 1, 1, 6).setBackground(C.panel);
    setCell(row, 2, g, {
      bg: C.panel, color: C.gold, bold: true,
      size: 12, font: 'Courier New', align: 'left', valign: 'middle'
    });
    cell(row, 3).setFormula(
      `=IF(COUNTIF(RAW_DATA!W2:W1000,"${g}")=0,"—","$"&TEXT(SUMPRODUCT((RAW_DATA!W2:W1000="${g}")*(RAW_DATA!R2:R1000<>"")*(RAW_DATA!R2:R1000)),"0.00"))`
    );
    cell(row, 4).setFormula(
      `=IF(COUNTIF(RAW_DATA!W2:W1000,"${g}")=0,"—",COUNTIF(RAW_DATA!W2:W1000,"${g}"))`
    );
    cell(row, 5).setFormula(
      `=IF(COUNTIF(RAW_DATA!W2:W1000,"${g}")=0,"—",TEXT(SUMPRODUCT((RAW_DATA!W2:W1000="${g}")*(RAW_DATA!R2:R1000>0))/MAX(1,COUNTIF(RAW_DATA!W2:W1000,"${g}")),"0%"))`
    );
    [3,4,5].forEach(c => {
      setCell(row, c, null, {
        bg: C.panel, color: C.text, size: 11,
        font: 'Courier New', align: 'center', valign: 'middle'
      });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 5 — P&L BY EXIT REASON (rows 49-57)
  // ══════════════════════════════════════════════════════════════
  sectionHeader(49, "P&L BY EXIT REASON", C.red);
  breakdownHeader(50, "EXIT REASON", "P&L", "TRADES", "WIN RATE");

  const exits = [
    "Target Hit", "Stop Hit", "EMA Exit",
    "Manual — Profit", "Manual — Loss", "10-Day Timeout"
  ];

  exits.forEach((ex, i) => {
    const row = 51 + i;
    range(row, 1, 1, 6).setBackground(C.panel);
    setCell(row, 2, ex, {
      bg: C.panel, color: C.text, size: 9,
      font: 'Courier New', align: 'left', valign: 'middle'
    });
    cell(row, 3).setFormula(
      `=IF(COUNTIF(RAW_DATA!L2:L1000,"${ex}")=0,"—","$"&TEXT(SUMPRODUCT((RAW_DATA!L2:L1000="${ex}")*(RAW_DATA!R2:R1000<>"")*(RAW_DATA!R2:R1000)),"0.00"))`
    );
    cell(row, 4).setFormula(
      `=IF(COUNTIF(RAW_DATA!L2:L1000,"${ex}")=0,"—",COUNTIF(RAW_DATA!L2:L1000,"${ex}"))`
    );
    cell(row, 5).setFormula(
      `=IF(COUNTIF(RAW_DATA!L2:L1000,"${ex}")=0,"—",TEXT(SUMPRODUCT((RAW_DATA!L2:L1000="${ex}")*(RAW_DATA!R2:R1000>0))/MAX(1,COUNTIF(RAW_DATA!L2:L1000,"${ex}")),"0%"))`
    );
    [3,4,5].forEach(c => {
      setCell(row, c, null, {
        bg: C.panel, color: C.text, size: 11,
        font: 'Courier New', align: 'center', valign: 'middle'
      });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 6 — P&L BY SECTOR (rows 61-74)
  // ══════════════════════════════════════════════════════════════
  sectionHeader(61, "P&L BY SECTOR", C.cyan);
  breakdownHeader(62, "SECTOR", "P&L", "TRADES", "WIN RATE");

  const sectors = [
    "Technology", "Financials", "Healthcare", "Energy",
    "Industrials", "Consumer", "Utilities", "REITs",
    "Materials", "Telecom", "Biotech", "Crypto", "CEF"
  ];

  sectors.forEach((sec, i) => {
    const row = 63 + i;
    range(row, 1, 1, 6).setBackground(C.panel);
    setCell(row, 2, sec, {
      bg: C.panel, color: C.cyan, size: 9,
      font: 'Courier New', align: 'left', valign: 'middle'
    });
    cell(row, 3).setFormula(
      `=IF(COUNTIF(RAW_DATA!D2:D1000,"${sec}")=0,"—","$"&TEXT(SUMPRODUCT((RAW_DATA!D2:D1000="${sec}")*(RAW_DATA!R2:R1000<>"")*(RAW_DATA!R2:R1000)),"0.00"))`
    );
    cell(row, 4).setFormula(
      `=IF(COUNTIF(RAW_DATA!D2:D1000,"${sec}")=0,"—",COUNTIF(RAW_DATA!D2:D1000,"${sec}"))`
    );
    cell(row, 5).setFormula(
      `=IF(COUNTIF(RAW_DATA!D2:D1000,"${sec}")=0,"—",TEXT(SUMPRODUCT((RAW_DATA!D2:D1000="${sec}")*(RAW_DATA!R2:R1000>0))/MAX(1,COUNTIF(RAW_DATA!D2:D1000,"${sec}")),"0%"))`
    );
    [3,4,5].forEach(c => {
      setCell(row, c, null, {
        bg: C.panel, color: C.text, size: 11,
        font: 'Courier New', align: 'center', valign: 'middle'
      });
    });
  });

  // ── BORDERS — add subtle bottom borders to all data rows ─────
  for (let r = 3; r <= 76; r++) {
    range(r, 2, 1, 4).setBorder(
      false, false, true, false, false, false,
      C.border, SpreadsheetApp.BorderStyle.SOLID
    );
  }

  // ── FREEZE header row ─────────────────────────────────────────
  dash.setFrozenRows(1);

  // ── HIDE gridlines ────────────────────────────────────────────
  // Note: hiding gridlines requires Sheets API — skip for now

  // ── PROTECT the dashboard (view only) ────────────────────────
  // Users should edit RAW_DATA not DASHBOARD

  SpreadsheetApp.flush();
  Logger.log("✅ SwingBot Dashboard built successfully");
  SpreadsheetApp.getUi().alert("✅ SwingBot Dashboard built!\n\nClick the DASHBOARD tab to see your trading metrics.");
}
