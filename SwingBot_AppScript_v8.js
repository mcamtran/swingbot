/**
 * SwingBot Apps Script — v8
 * ─────────────────────────────────────────────────────────────
 * Changes from v7:
 *   + writeScanLog() — writes scan diagnostics to SCAN_LOG tab
 *   + doGet routing updated to handle action=scan_log
 *   All v7 trade journal logic (writeTrade, readTrades,
 *   buildDashboard, testConnection) preserved exactly.
 *
 * Deployment: Extensions → Apps Script → paste → Deploy as Web App
 *   Execute as: Me
 *   Who has access: Anyone
 * After deploy: copy new Web App URL → update HARDCODED_WEBHOOK
 *   in SwingBot_Journal_Standalone.html
 * ─────────────────────────────────────────────────────────────
 */

// ── Sheet tab names ────────────────────────────────────────────
var RAW_DATA_TAB  = 'RAW_DATA';
var DASHBOARD_TAB = 'DASHBOARD';
var SCAN_LOG_TAB  = 'SCAN_LOG';   // NEW in v8

// ── CORS helper ────────────────────────────────────────────────
function corsOutput(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ══════════════════════════════════════════════════════════════
// doGet — main entry point
// Routes:
//   ?action=read            → readTrades()
//   ?data=JSON&action=scan_log → writeScanLog(data)  [NEW v8]
//   ?data=JSON              → writeTrade(data)
// ══════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action || '';
    var raw    = params.data   || '';

    // ── Read all trades ──────────────────────────────────────
    if (action === 'read') {
      return corsOutput(readTrades());
    }

    // ── Write scan log row (NEW v8) ──────────────────────────
    if (action === 'scan_log' && raw) {
      var data = JSON.parse(raw);
      return corsOutput(writeScanLog(data));
    }

    // ── Write or update trade row ────────────────────────────
    if (raw) {
      var data = JSON.parse(raw);
      return corsOutput(writeTrade(data));
    }

    // ── Test connection ──────────────────────────────────────
    return corsOutput({ status: 'ok', message: 'SwingBot Apps Script v8 online' });

  } catch (err) {
    return corsOutput({ status: 'error', message: err.toString() });
  }
}

// ══════════════════════════════════════════════════════════════
// writeTrade — preserved exactly from v7
// Appends new trade or updates existing row by Trade ID (col AJ)
// ══════════════════════════════════════════════════════════════
function writeTrade(data) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(RAW_DATA_TAB);
    if (!sheet) return { status: 'error', message: RAW_DATA_TAB + ' tab not found' };

    var tradeId = data.id || '';

    // ── Exit update: find existing row by Trade ID ────────────
    if (data.direction === 'SELL' && tradeId) {
      var allData = sheet.getDataRange().getValues();
      for (var i = 1; i < allData.length; i++) {
        if (allData[i][35] === tradeId) {  // col AJ = index 35
          var row   = i + 1;
          var entry = parseFloat(allData[i][6])  || 0;  // col G
          var shares= parseFloat(allData[i][5])  || 0;  // col F
          var exit  = parseFloat(data.exit_price || data.fill_price) || 0;
          var pnl   = (exit - entry) * shares;
          var pnlPct= entry > 0 ? ((exit - entry) / entry * 100) : 0;
          var rMult = data.atr > 0 ? (pnl / (data.atr * shares)) : 0;
          var entryDate = allData[i][1] ? new Date(allData[i][1]) : new Date();
          var exitDate  = data.date ? new Date(data.date) : new Date();
          var daysHeld  = Math.round((exitDate - entryDate) / (1000 * 60 * 60 * 24));

          sheet.getRange(row, 10).setValue(exit);                          // J: Exit Price
          sheet.getRange(row, 11).setValue(data.date || '');               // K: Exit Date
          sheet.getRange(row, 12).setValue(data.exit_reason || '');        // L: Exit Reason
          sheet.getRange(row, 18).setValue(Math.round(pnl * 100) / 100);  // R: P&L$
          sheet.getRange(row, 19).setValue(Math.round(pnlPct * 100) / 100); // S: P&L%
          sheet.getRange(row, 20).setValue(Math.round(rMult * 100) / 100); // T: R-Multiple
          sheet.getRange(row, 21).setValue(daysHeld);                      // U: Days Held
          sheet.getRange(row, 23).setValue(data.self_grade || '');         // W: Self Grade

          // Color P&L cell
          var pnlCell = sheet.getRange(row, 18);
          pnlCell.setBackground(pnl >= 0 ? '#b7e1cd' : '#f4c7c3');

          return { status: 'ok', action: 'exit_updated', row: row, pnl: Math.round(pnl * 100) / 100 };
        }
      }
      return { status: 'error', message: 'Trade ID not found: ' + tradeId };
    }

    // ── Entry: append new row ─────────────────────────────────
    var newId   = data.ticker + '_' + new Date().getTime();
    var scores  = data.scores || [0,0,0,0,0,0,0,0,0,0];
    var lastRow = sheet.getLastRow() + 1;
    var tradeNum= lastRow - 1;  // row 1 is header

    var rowData = [
      tradeNum,                        // A: Trade#
      data.date         || '',         // B: Date
      data.ticker       || '',         // C: Ticker
      data.sector       || '',         // D: Sector
      data.direction    || 'BUY',      // E: Direction
      data.shares       || '',         // F: Shares
      data.fill_price   || '',         // G: Entry
      data.stop         || '',         // H: Stop
      data.target       || '',         // I: Target
      '',                              // J: Exit Price (blank until exit)
      '',                              // K: Exit Date
      '',                              // L: Exit Reason
      data.atr          || '',         // M: ATR
      data.rel_vol      || '',         // N: Rel Vol
      data.swing_delta  || '',         // O: Swing Delta%
      data.float_m      || '',         // P: Float(M)
      data.vix          || '',         // Q: VIX
      '',                              // R: P&L$ (blank until exit)
      '',                              // S: P&L% (blank until exit)
      '',                              // T: R-Multiple (blank until exit)
      '',                              // U: Days Held (blank until exit)
      data.signal_grade || '',         // V: Signal Grade
      '',                              // W: Self Grade (blank until exit)
      scores[0] || 0,                  // X: Q1
      scores[1] || 0,                  // Y: Q2
      scores[2] || 0,                  // Z: Q3
      scores[3] || 0,                  // AA: Q4
      scores[4] || 0,                  // AB: Q5
      scores[5] || 0,                  // AC: Q6
      scores[6] || 0,                  // AD: Q7
      scores[7] || 0,                  // AE: Q8
      scores[8] || 0,                  // AF: Q9
      scores[9] || 0,                  // AG: Q10
      data.score        || '',         // AH: Score/10
      data.notes        || '',         // AI: Notes
      newId                            // AJ: Trade ID
    ];

    sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);

    return { status: 'ok', action: 'entry_added', row: lastRow, trade_id: newId };

  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ══════════════════════════════════════════════════════════════
// readTrades — preserved exactly from v7
// Returns all RAW_DATA rows as JSON for journal display
// ══════════════════════════════════════════════════════════════
function readTrades() {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(RAW_DATA_TAB);
    if (!sheet) return { status: 'error', message: RAW_DATA_TAB + ' tab not found' };

    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows    = [];

    for (var i = 1; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      rows.push(row);
    }

    return { status: 'ok', count: rows.length, trades: rows };

  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ══════════════════════════════════════════════════════════════
// writeScanLog — NEW in v8
// Appends one row to SCAN_LOG tab
// Called by Colab Cell 5.5 log_to_scan_log() for every
// ticker processed (signals + skips)
//
// Expected data fields:
//   timestamp, ticker, result (SIGNAL/SKIP), reason,
//   score, grade, atr_pct, swing_delta
//
// SCAN_LOG tab must exist with headers in row 1:
//   Timestamp | Ticker | Result | Reason | Score | Grade | ATR% | SwingΔ%
// ══════════════════════════════════════════════════════════════
function writeScanLog(data) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SCAN_LOG_TAB);

    // Auto-create SCAN_LOG tab if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SCAN_LOG_TAB);
      var headers = ['Timestamp', 'Ticker', 'Result', 'Reason', 'Score', 'Grade', 'ATR%', 'SwingΔ%'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var row = [
      data.timestamp   || new Date().toISOString(),  // A: Timestamp
      data.ticker      || '',                         // B: Ticker
      data.result      || '',                         // C: Result (SIGNAL/SKIP)
      data.reason      || '',                         // D: Reason
      data.score       || '',                         // E: Score
      data.grade       || '',                         // F: Grade
      data.atr_pct     || '',                         // G: ATR%
      data.swing_delta || '',                         // H: SwingΔ%
    ];

    var lastRow = sheet.getLastRow() + 1;
    sheet.getRange(lastRow, 1, 1, row.length).setValues([row]);

    // Color Result cell: green for SIGNAL, red for SKIP
    var resultCell = sheet.getRange(lastRow, 3);
    if (data.result === 'SIGNAL') {
      resultCell.setBackground('#b7e1cd');  // green
    } else if (data.result === 'SKIP') {
      resultCell.setBackground('#f4c7c3');  // red
    }

    return { status: 'ok', action: 'scan_log_added', row: lastRow };

  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// ══════════════════════════════════════════════════════════════
// testConnection — preserved from v7
// Run manually from Apps Script editor to verify sheet access
// ══════════════════════════════════════════════════════════════
function testConnection() {
  var ss       = SpreadsheetApp.getActiveSpreadsheet();
  var rawSheet = ss.getSheetByName(RAW_DATA_TAB);
  var logSheet = ss.getSheetByName(SCAN_LOG_TAB);

  Logger.log('SwingBot Apps Script v8');
  Logger.log('Spreadsheet: ' + ss.getName());
  Logger.log(RAW_DATA_TAB + ' tab: ' + (rawSheet ? '✅ Found (' + rawSheet.getLastRow() + ' rows)' : '❌ NOT FOUND'));
  Logger.log(SCAN_LOG_TAB + ' tab: ' + (logSheet ? '✅ Found (' + logSheet.getLastRow() + ' rows)' : '⚠️  Not found — will auto-create on first scan'));
  Logger.log('All functions: writeTrade ✅ | readTrades ✅ | writeScanLog ✅ | buildDashboard ✅');
}

// ══════════════════════════════════════════════════════════════
// buildDashboard — preserved exactly from v7
// Run once manually from Apps Script editor
// Creates DASHBOARD tab with auto-updating formulas
// ══════════════════════════════════════════════════════════════
function buildDashboard() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DASHBOARD_TAB);

  if (!sheet) {
    sheet = ss.insertSheet(DASHBOARD_TAB);
  } else {
    sheet.clear();
  }

  // ── Styling helpers ───────────────────────────────────────
  function header(range, label) {
    range.setValue(label);
    range.setFontWeight('bold');
    range.setBackground('#1e2327');
    range.setFontColor('#ffffff');
  }

  function label(range, text) {
    range.setValue(text);
    range.setFontColor('#555555');
  }

  var col = 1;

  // ── Performance Summary ───────────────────────────────────
  header(sheet.getRange(1, col), 'PERFORMANCE SUMMARY');
  label(sheet.getRange(2, col), 'Total P&L ($)');
  sheet.getRange(2, col + 1).setFormula("=IFERROR(SUM(RAW_DATA!R:R),0)");
  label(sheet.getRange(3, col), 'Total Trades');
  sheet.getRange(3, col + 1).setFormula("=IFERROR(COUNTA(RAW_DATA!J2:J)-COUNTBLANK(RAW_DATA!J2:J),0)");
  label(sheet.getRange(4, col), 'Win Rate');
  sheet.getRange(4, col + 1).setFormula('=IFERROR(COUNTIF(RAW_DATA!R:R,">0")/COUNTA(RAW_DATA!J2:J),0)');
  sheet.getRange(4, col + 1).setNumberFormat('0.0%');
  label(sheet.getRange(5, col), 'Avg Win ($)');
  sheet.getRange(5, col + 1).setFormula('=IFERROR(AVERAGEIF(RAW_DATA!R:R,">0"),0)');
  label(sheet.getRange(6, col), 'Avg Loss ($)');
  sheet.getRange(6, col + 1).setFormula('=IFERROR(AVERAGEIF(RAW_DATA!R:R,"<0"),0)');
  label(sheet.getRange(7, col), 'Expectancy ($)');
  sheet.getRange(7, col + 1).setFormula('=IFERROR(AVERAGE(RAW_DATA!R2:R),0)');
  label(sheet.getRange(8, col), 'Trades to 50');
  sheet.getRange(8, col + 1).setFormula('=MAX(0,50-COUNTA(RAW_DATA!J2:J)+COUNTBLANK(RAW_DATA!J2:J))');

  // ── P&L by Signal Grade ───────────────────────────────────
  var row = 10;
  header(sheet.getRange(row, col), 'P&L BY SIGNAL GRADE');
  ['A', 'B', 'C'].forEach(function(g) {
    row++;
    label(sheet.getRange(row, col), 'Grade ' + g);
    sheet.getRange(row, col + 1).setFormula('=IFERROR(SUMIF(RAW_DATA!V:V,"' + g + '",RAW_DATA!R:R),0)');
  });

  // ── P&L by Self Grade ─────────────────────────────────────
  row += 2;
  header(sheet.getRange(row, col), 'P&L BY SELF GRADE');
  ['A', 'B', 'C'].forEach(function(g) {
    row++;
    label(sheet.getRange(row, col), 'Self ' + g);
    sheet.getRange(row, col + 1).setFormula('=IFERROR(SUMIF(RAW_DATA!W:W,"' + g + '",RAW_DATA!R:R),0)');
  });

  // ── P&L by Exit Reason ───────────────────────────────────
  row += 2;
  header(sheet.getRange(row, col), 'P&L BY EXIT REASON');
  var exitReasons = ['Target Hit', 'Stop Hit', 'EMA Exit', 'Dead Trade', 'Manual'];
  exitReasons.forEach(function(reason) {
    row++;
    label(sheet.getRange(row, col), reason);
    sheet.getRange(row, col + 1).setFormula('=IFERROR(SUMIF(RAW_DATA!L:L,"' + reason + '",RAW_DATA!R:R),0)');
  });

  // ── P&L by Sector ────────────────────────────────────────
  row += 2;
  header(sheet.getRange(row, col), 'P&L BY SECTOR');
  var sectors = ['Technology', 'Healthcare', 'Financials', 'Energy', 'Consumer',
                 'Industrials', 'REITs', 'Crypto', 'Biotech', 'Utilities',
                 'Telecom', 'Materials'];
  sectors.forEach(function(sector) {
    row++;
    label(sheet.getRange(row, col), sector);
    sheet.getRange(row, col + 1).setFormula('=IFERROR(SUMIF(RAW_DATA!D:D,"' + sector + '",RAW_DATA!R:R),0)');
  });

  // ── Format value column ──────────────────────────────────
  sheet.getRange(2, col + 1, row, 1).setNumberFormat('$#,##0.00');
  sheet.setColumnWidth(col, 180);
  sheet.setColumnWidth(col + 1, 120);

  Logger.log('✅ DASHBOARD tab built successfully.');
}
