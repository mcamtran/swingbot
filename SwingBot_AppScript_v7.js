// SwingBot Trade Logger — Google Apps Script v6
// Entry: appends new row
// Exit: finds existing row by trade ID and updates it
// Read: returns all rows as JSON for journal app
const SHEET_NAME = "RAW_DATA";
const ID_COL     = 36; // Column AJ — Trade ID

function doGet(e) {
  // ── Read all trades ──────────────────────────────────────────────────────
  if (e.parameter && e.parameter.action === "read") {
    return readTrades();
  }
  // ── Write/Update trade ───────────────────────────────────────────────────
  if (!e.parameter || !e.parameter.data) {
    return resp({ status: "SwingBot webhook active v6", sheet: SHEET_NAME });
  }
  try {
    const data = JSON.parse(decodeURIComponent(e.parameter.data));
    return writeTrade(data);
  } catch(err) {
    return resp({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return writeTrade(data);
  } catch(err) {
    return resp({ error: err.message });
  }
}

function readTrades() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return resp({ error: "Sheet RAW_DATA not found" });

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return resp({ trades: [], count: 0 });

    const data = sheet.getRange(2, 1, lastRow - 1, 36).getValues();
    const trades = [];

    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      // Skip completely empty rows
      if (!r[2] || r[2] === 0) continue;

      trades.push({
        trade_num    : r[0],
        date         : r[1] ? Utilities.formatDate(r[1], "America/New_York", "yyyy-MM-dd") : "",
        ticker       : r[2],
        sector       : r[3],
        direction    : r[4],
        shares       : r[5],
        entry        : r[6],
        stop         : r[7],
        target       : r[8],
        exit_price   : r[9],
        exit_date    : r[10] ? Utilities.formatDate(r[10], "America/New_York", "yyyy-MM-dd") : "",
        exit_reason  : r[11],
        atr          : r[12],
        rel_vol      : r[13],
        swing_delta  : r[14],
        float_m      : r[15],
        vix          : r[16],
        pnl_dollar   : r[17],
        pnl_pct      : r[18],
        r_multiple   : r[19],
        days_held    : r[20],
        signal_grade : r[21],
        self_grade   : r[22],
        scores       : [r[23],r[24],r[25],r[26],r[27],r[28],r[29],r[30],r[31],r[32]],
        score        : r[33],
        notes        : r[34],
        id           : r[35],
        is_open      : (r[9] === '' || r[9] === null || r[9] === undefined || r[9] === 0 || r[9] === '0' || r[9] === false), // no exit price = open trade
      });
    }

    return resp({ trades: trades, count: trades.length });
  } catch(err) {
    return resp({ error: err.message });
  }
}

function writeTrade(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return resp({ error: "Sheet RAW_DATA not found" });

  // ── Calculations ──────────────────────────────────────────────────────────
  const entryPrice = parseFloat(data.entry_price || data.fill_price) || 0;
  const exitPrice  = parseFloat(data.exit_price)  || 0;
  const shares     = parseInt(data.shares)         || 0;
  const direction  = (data.direction || "BUY").toUpperCase();
  const mult       = direction === "BUY" ? 1 : -1;

  const pnlDollar = exitPrice > 0
    ? Math.round((exitPrice - entryPrice) * mult * shares * 100) / 100 : "";
  const pnlPct    = exitPrice > 0 && entryPrice > 0
    ? Math.round((exitPrice - entryPrice) / entryPrice * mult * 10000) / 100 : "";
  const stopPrice = parseFloat(data.stop) || 0;
  const risk      = Math.abs(entryPrice - stopPrice);
  const rMult     = exitPrice > 0 && risk > 0
    ? Math.round((exitPrice - entryPrice) * mult / risk * 100) / 100 : "";

  let daysHeld = "";
  if (data.entry_date && data.exit_date) {
    daysHeld = Math.round(
      (new Date(data.exit_date) - new Date(data.entry_date)) / 86400000
    );
  }

  const q = (i) => { const s = data.scores || []; return s[i] != null ? s[i] : ""; };

  // ── Build full row ─────────────────────────────────────────────────────────
  const row = [
    "",                                                // A  Trade #
    data.entry_date   || data.date        || "",       // B  Date
    (data.ticker      || "").toUpperCase(),            // C  Ticker
    data.sector       || "",                           // D  Sector
    direction,                                         // E  Direction
    shares,                                            // F  Shares
    entryPrice,                                        // G  Entry
    data.stop         || "",                           // H  Stop
    data.target       || "",                           // I  Target
    exitPrice         || "",                           // J  Exit Price
    data.exit_date    || "",                           // K  Exit Date
    data.exit_reason  || "",                           // L  Exit Reason
    data.atr          || "",                           // M  ATR
    data.rel_vol      || "",                           // N  Rel Vol
    data.swing_delta  || "",                           // O  Swing Delta %
    data.float_m      || "",                           // P  Float (M)
    data.vix          || "",                           // Q  VIX
    pnlDollar,                                         // R  P&L $
    pnlPct,                                            // S  P&L %
    rMult,                                             // T  R-Multiple
    daysHeld,                                          // U  Days Held
    data.signal_grade || "",                           // V  Signal Grade
    data.self_grade   || "",                           // W  Self Grade
    q(0), q(1), q(2), q(3), q(4),                     // X-AB  Q1-Q5
    q(5), q(6), q(7), q(8), q(9),                     // AC-AG Q6-Q10
    data.score        || "",                           // AH Score /10
    data.notes        || "",                           // AI Notes
    data.id           || "",                           // AJ Trade ID
  ];

  // ── Find existing row by trade ID ──────────────────────────────────────────
  const tradeId   = data.id || "";
  let   targetRow = -1;

  if (tradeId && sheet.getLastRow() > 1) {
    const idValues = sheet.getRange(2, ID_COL, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < idValues.length; i++) {
      if (idValues[i][0] === tradeId) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow > 0) {
    // ── UPDATE existing row ───────────────────────────────────────────────
    const existingTradeNum = sheet.getRange(targetRow, 1).getValue();
    row[0] = existingTradeNum;
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);

    if (pnlDollar !== "") {
      const c = sheet.getRange(targetRow, 18);
      c.setBackground(pnlDollar >= 0 ? "#c6efce" : "#ffc7ce");
      c.setFontColor(pnlDollar  >= 0 ? "#276221" : "#9c0006");
    }

    return resp({ success: true, action: "updated", ticker: data.ticker, row: targetRow });

  } else {
    // ── APPEND new row ────────────────────────────────────────────────────
    const tradeNum = sheet.getLastRow() < 2 ? 1 : sheet.getLastRow() - 1;
    row[0] = tradeNum + 1; // +1 because we are appending a new row
    sheet.appendRow(row);

    const nr = sheet.getLastRow();

    if (pnlDollar !== "") {
      const c = sheet.getRange(nr, 18);
      c.setBackground(pnlDollar >= 0 ? "#c6efce" : "#ffc7ce");
      c.setFontColor(pnlDollar  >= 0 ? "#276221" : "#9c0006");
    }

    return resp({ success: true, action: "appended", ticker: data.ticker, row: nr });
  }
}

function resp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testConnection() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  Logger.log(s ? "OK — rows: " + s.getLastRow() : "ERROR: RAW_DATA not found");
}

function testRead() {
  const result = readTrades();
  Logger.log(result.getContent());
}
