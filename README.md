# SwingBot — Cam's Semi-Systematic Swing Trading Scanner

Automated hourly scanner that sends Grade A and B EMA crossover signals to Telegram.

## How it works

1. Runs automatically via GitHub Actions every hour during market hours
2. Scans 318 tickers for 9/21 EMA crosses on the 1H chart
3. Grades each signal using a 10-question checklist
4. Sends only Grade A and B signals to your phone via Telegram

## Schedule (EDT)

| Time | Action |
|---|---|
| 9:50 AM | Heartbeat — confirms system is online |
| 10:05 AM | Hourly scan |
| 11:05 AM | Hourly scan |
| 12:05 PM | Hourly scan |
| 1:05 PM | Hourly scan |
| 2:05 PM | Hourly scan |
| 3:05 PM | Hourly scan |
| 3:30 PM | Daily recap |

## Signal filters

- Price: $5–$25
- Above daily 200 SMA
- 9 EMA crosses above 21 EMA on 1H
- Grade A or B only (score 7–10 out of 10)
- VIX between 15–25 (silent if outside range)
- No earnings within 7 days flagged

## Alert format

```
🟢 SIGNAL ALERT — 10:05 AM EST
Data as of: 10:00 AM EST
━━━━━━━━━━━━━━━━━━━━━
CYRX | Grade B | Score 7/10
Entry   : $10.45
Stop    : $10.12
Target  : $11.11
ATR     : $0.165
Shares  : 21
VIX     : 18.4
Earnings: NO
━━━━━━━━━━━━━━━━━━━━━
1 signal found
```

## Setup

### GitHub Secrets required
Go to Settings → Secrets → Actions and add:
- `TELEGRAM_TOKEN` — your Telegram bot token
- `CHAT_ID` — your Telegram chat ID

### Universe file
Upload your TradingView CSV export to `data/universe.csv`
Refresh monthly on the 1st of each month.

## Files

| File | Purpose |
|---|---|
| `scanner.py` | Main scanner script |
| `.github/workflows/scanner.yml` | GitHub Actions schedule |
| `data/universe.csv` | Your 318-ticker watchlist |
| `data/alerted_today.json` | Deduplication file (auto-updated) |
| `requirements.txt` | Python dependencies |

## Testing

Use the manual trigger in GitHub Actions:
1. Go to Actions tab
2. Click SwingBot Scanner
3. Click Run workflow
4. Select mode: test, heartbeat, scan, recap

## Trading rules

- Risk per trade: $7
- Stop: 2×ATR below entry
- Target: 4×ATR above entry
- Max open trades: 5 (enforced manually)
- Dead trade exit: 10 days
- VIX range: 15–25
- No entries first/last 30 minutes of market

## 4H signals

Scheduled for review September 15, 2026.
