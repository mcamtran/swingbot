# Trading System Overview – Cam's Semi-Systematic Swing Trading Plan
*Last updated: May 2026*

---

## Objective

Build a low-stress, rules-based swing trading system that minimizes emotional decision-making, reduces screen time, and fits a stay-at-home parent lifestyle. The goal is long-term consistency and process discipline first, with scaling only after live results prove stable over time.

---

## Core Trading Style

**Strategy Type**
Semi-systematic swing trading using EMA trend continuation setups.

**Primary Timeframes**
- 1H chart for signal generation and entry
- Daily chart for 200 SMA trend filter
- 4H chart to be added September 15, 2026

**Market Bias**
Long-only trading in stocks above the daily 200 SMA.

---

## Core Entry Rules

A trade qualifies **only** if ALL of the following are met:

1. 9 EMA crosses above 21 EMA on the 1H chart
2. Price above 200 SMA on the daily chart (using yesterday's closing price)
3. Setup receives **Grade B or higher** from the automated grading system
4. VIX is between **15 and 25** — no exceptions, no negotiation
5. No earnings announcement within the next **7 days**
6. Chart has clean structure and room to move higher (visual confirmation in Thinkorswim)
7. No more than 5 positions currently open

**No discretionary negotiation once a setup passes all criteria.**
**Grade A is a bonus. Grade B is the primary signal. Grade C and D are never taken.**

---

## Grading System

Setups are scored automatically using a 10-question checklist (0–10 points):

| Q | Question | How Measured |
|---|---|---|
| Q1 | EMA crossover confirmed? | Scanner — auto pass |
| Q2 | Price above 200 SMA? | Scanner — auto pass |
| Q3 | Price staying above 10/20 EMA after cross? | Last 3 bars above both EMAs |
| Q4 | Clear direction — not choppy? | ADX > 20 |
| Q5 | Price near a swing high/low from last 20 days? | Within 3% of recent swing level |
| Q6 | VIX between 15–25? | From VIX data |
| Q7 | Strong candle (big body)? | Body > 50% of total range, bullish close |
| Q8 | Daily trend aligned? | Daily EMA9 > EMA21 |
| Q9 | Clear stop below recent swing low? | Swing low within 2×ATR of entry |
| Q10 | Volume higher than normal? | Volume ≥ 1.5× 20-bar average |

**Grades:** A = 9–10 | B = 7–8 | C = 5–6 | D = 0–4

---

## Risk Management Rules

**Position Risk**
- Fixed dollar risk per trade: **$7 during initial testing phase**
- Stop-loss based on **2×ATR**
- Profit target set at **4×ATR**
- Dead trade exit: close after **10 days** with no meaningful movement

**Trade Management**
- Bracket orders placed **immediately** after entry in Thinkorswim — no exceptions
- Never move stop loss wider after entry
- Never average down into a losing position

**Portfolio Rules**
- Maximum **5 trades open at any one time**
- Avoid correlated sector exposure — open trades should come from different sectors
- Never hold through earnings announcements
- If a position has earnings within 7 days — exit before the announcement

**Consecutive Loss Rule**
After **5 consecutive stop-outs:**
1. Stop trading for **one full trading day**
2. Review: Is VIX still within 15–25?
3. Review: Is the broader market structure still supportive?
4. Resume only on the next qualifying Grade B or A signal
5. Do NOT increase position size to recover losses

---

## VIX Rules — Non-Negotiable

| VIX Level | Action |
|---|---|
| Below 15 | No trades — market too complacent, moves too small |
| 15 to 25 | Trading zone — take qualifying signals |
| Above 25 | No trades — market in fear mode, crosses are noise |

---

## Time of Day Rules

- **Never enter** in the first 30 minutes after open (9:30–10:00 AM EST)
- **Never enter** in the last 30 minutes before close (3:30–4:00 PM EST)
- Cleanest signals appear between **10:00 AM and 3:00 PM EST**
- Scanner runs at: 10:05, 11:05, 12:05, 13:05, 14:05, 15:05 EST

---

## Weekly Trend Filter

Before taking any trade confirm the **weekly chart is above its 50 SMA.**
Only trade in the direction of the weekly trend.

---

## Scaling Rules

**Phase 1 — Testing (current)**
- Risk: $7 per trade
- Target: 50 live trades
- Expected timeline: ~17 weeks at 5-cap (by September 20, 2026)
- Goal: Confirm live win rate matches backtest (Grade B target ~40–56%)

**Phase 2 — Scale Up**
- Only after 50 live trades with results matching backtest expectations
- Increase risk from $7 to $14 per trade
- No other changes to rules

**Phase 3 — Further Scaling**
- Only after another 50 live trades at $14 risk confirm consistent results
- Review grading system accuracy and adjust question weights if needed
- Review adding 4H signals (scheduled September 15, 2026)

---

## Automation System

**Tool 1 — Computer Scanner (Google Colab)**
- Run manually the night before or pre-market
- Set DATE_FROM and DATE_TO at the top
- Scans 318-ticker universe for EMA crosses
- Grades all signals and filters to A and B only
- Shows entry, stop, target, ATR, shares, VIX, earnings flag
- Downloads one CSV for review

**Tool 2 — Phone Scanner (GitHub Actions + Telegram)**
- Runs automatically — no manual action needed
- Heartbeat at 9:50 AM EST — confirms system online
- Scans at 10:05, 11:05, 12:05, 13:05, 14:05, 15:05 EST
- One alert per ticker per day maximum
- Combined message for multiple signals
- Daily recap at 3:30 PM EST
- Crash alert if scanner fails
- Silent when VIX outside 15–25
- Silent on market holidays
- DST auto-adjusted — reminder sent on clock change days
- Monthly universe validation on 1st of each month

**Alert Format:**
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

**Tool 3 — Backtest (Google Colab)**
- Upload scanner CSV as input
- Simulates stop, target, 10-day timeout
- Results shown by grade and timeframe
- Downloads one CSV with full trade details

**Execution**
- Trades manually executed in **Thinkorswim**
- Bracket order template saved: stop 2×ATR, target 4×ATR
- No broker API or automated execution

---

## Technology Stack

**Live (current)**
- GitHub repository: github.com/mcamtran/swingbot
- GitHub Actions: automated hourly scanning
- Telegram Bot: @Signalme921crossBot
- Data source: yfinance with retry logic
- Manual execution: Thinkorswim

**Universe management**
- Source: TradingView screener export
- Criteria: Price $5–$25, Volume 500K+, Above 200 SMA, US stocks
- Refresh: Monthly on the 1st — upload new CSV to GitHub
- Validation: Automatic check on upload with Telegram confirmation

**Backtest and analysis**
- Google Colab (Tool 1 and Tool 3)
- Data source: yfinance (historical, no rate limit issues)

---

## Monthly Review Process

At the end of every month review these four questions:

1. Did my live win rate match the backtest expectations?
2. Which grading questions were most predictive of wins?
3. Which signals did I skip — should I have taken them?
4. What market condition was I trading in (trending, choppy, high VIX)?

Adjust grading weights only after reviewing a minimum of 50 trades.

---

## Key Dates

| Date | Action |
|---|---|
| May 27, 2026 | Go live — paper trading first week |
| June 3, 2026 | Switch to real money if paper trading confirms system |
| June 1, 2026 | First monthly universe refresh |
| September 15, 2026 | Review 4H signal addition |
| ~September 20, 2026 | Expected 50-trade milestone (5-cap, 10-day timeout) |

---

## Trading Philosophy

The goal is not constant activity or prediction accuracy.

**The goal is:**
- Consistent execution
- Controlled risk
- Emotional discipline
- Repeatable statistical edge

**Focus on:**
- Fewer high-quality trades (Grade B minimum)
- Process consistency over outcome chasing
- Long-term survivability
- Scalable structure built on proven data

**The system is intentionally designed to reduce:**
- Overtrading
- Emotional interference
- Chart addiction
- Impulsive decision-making

**This is a process-first trading business, not discretionary day trading.**

---

## Key Reminders

> The biggest risk to this system is not the strategy — it is breaking the rules during a losing streak.

> A Grade C trade after five consecutive losses is not a recovery trade. It is an undisciplined trade that destroys the statistical edge.

> The system only works if you take every Grade B signal that qualifies. Cherry-picking adds bias and destroys the edge.

> Check the heartbeat every morning at 9:50 AM. If it does not arrive, the scanner is down.

> Update the ticker list on the 1st of every month. Takes 5 minutes and keeps the scanner accurate.
