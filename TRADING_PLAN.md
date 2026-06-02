# Trading System Overview – Cam's Semi-Systematic Swing Trading Plan
*Last updated: May 29, 2026*

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

1. 9 EMA crosses above 21 EMA on the 1H chart (confirmed in Thinkorswim — TOS is source of truth)
2. Price above 200 SMA on the daily chart
3. Setup receives **Grade B or higher** from the automated grading system
4. VIX is between **15 and 25** — no exceptions
5. No earnings announcement within the next **7 days**
6. Chart has clean structure and room to move higher (visual confirmation in Thinkorswim)
7. No more than 5 positions currently open
8. ATR ≥ 1.0% of price — below this the stop is too tight to survive normal spread noise
9. Float ≥ 20M shares — below this liquidity is too thin for clean exits
10. Signal fired during market hours (9:30 AM – 3:30 PM EST)

**No discretionary negotiation once a setup passes all criteria.**
**Grade A is a bonus. Grade B is the primary signal. Grade C and D are never taken.**

---

## Entry Execution Rules

**Order Type:** Limit order — Day Only
**Entry Price:** Alert price exactly — never market order
**Cancel Rule:** If unfilled by 3:30 PM EST — cancel, signal expired
**No Chase Rule:** Skip if current price is more than 3% above alert entry price
**Signal Expiration:** A 1H EMA cross signal expires at market close the same day it fired. Never carry a signal to the next day.
**Faded Entry:** Place limit order at alert price and walk away. If price pulls back to your entry it fills. If it doesn't pull back the order expires. Never convert to market order to chase.

---

## Grading System

Setups are scored automatically using a 10-question checklist (0–10 points):

| Q | Question | How Measured |
|---|---|---|
| Q1 | EMA crossover confirmed? | TOS scanner — confirmed on 1H chart |
| Q2 | Price above 200 SMA? | TOS scanner — daily chart |
| Q3 | Price staying above EMA9/21 after cross? | Last 3 bars above both EMAs |
| Q4 | Clear direction — not choppy? | ADX > 20 |
| Q5 | Price near a swing high/low from last 20 days? | Within 3% of recent swing level |
| Q6 | VIX between 15–25? | From VIX data |
| Q7 | Strong candle (big body)? | Body > 50% of total range, bullish close |
| Q8 | Daily trend aligned? | Daily EMA9 > EMA21 |
| Q9 | Clear stop below recent swing low? | Swing low within 2×ATR of entry |
| Q10 | Volume higher than normal? | Volume ≥ 1.5× 20-bar average |

**Grades:** A = 9–10 | B = 7–8 | C = 5–6 | D = 0–4

**Note:** Q1 and Q2 are confirmed by the scanner before grading begins. Score reweighting to be reviewed after 50 live trades and backtest rerun.

---

## Verdict Rules

| Verdict | Conditions |
|---------|-----------|
| **TAKE** | Score 7+ AND time-adjusted RVol ≥ threshold AND ATR ≥ 1.0% AND market hours AND data ≤ 30 min old |
| **CAUTION** | Score 5-6 OR RVol borderline for time of day OR after hours signal OR data stale |
| **SKIP** | Score <5 OR RVol below threshold OR ATR <1.0% OR SwingΔ >5% OR broken structure |

---

## Time-Adjusted Relative Volume

RVol means different things at different times of day. A 0.7x RVol at 9:45 AM is a strong signal. The same number at 3:00 PM is weak.

| Signal Time | Minimum Acceptable RVol |
|-------------|------------------------|
| Before 10:00 AM | 0.3x — early, volume still building |
| 10:00–11:00 AM | 0.5x — on pace for the session |
| 11:00 AM–1:00 PM | 0.7x — mid-session baseline |
| 1:00–2:00 PM | 1.0x — institutional confirmation needed |
| After 2:00 PM | 1.2x — late session, needs strong conviction |

---

## Risk Management Rules

**Position Sizing**
- Fixed dollar risk per trade: **$7 during initial testing phase**
- Stop-loss: Entry − **1×ATR** (changed from 2×ATR — May 2026)
- Profit target: Entry + **2×ATR** (changed from 4×ATR — May 2026)
- R:R ratio: 2:1 minimum
- Dead trade exit: close after **10 days** with no meaningful movement

**Trade Management**
- Bracket orders placed **immediately** after entry — stop and target set at time of entry
- Never move stop loss wider after entry
- Never average down into a losing position
- Never hold through earnings

**Portfolio Rules**
- Maximum **5 trades open at any one time**
- Maximum **2 trade per sector** — check open positions before entering
- Never hold through earnings announcements
- Exit before earnings if announcement falls within 7 days of open position

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
- All limit orders must be **Day Only** — no GTC orders
- Cancel any unfilled limit order by **3:30 PM EST**

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

## Technology Stack

**Signal Generation**
- **Primary:** Thinkorswim Stock Hacker scanner — scans All Listed Stocks every 3-5 minutes
- Scanner filters: EMA9 crosses above EMA21 (1H), price above SMA200 (Daily), ATR% ≥ 0.5% (Daily), RVol ≥ 0.7x (Daily), SwingΔ ≤ 5% (Daily), Price $5–$25
- TOS is the source of truth for all EMA calculations — eliminates yfinance data inconsistency
- Push notification to phone when new tickers pass all filters

**Signal Grading**
- Google Colab (SwingBot_Colab_Scanner_v6) — Cell 5.5
- Reads tickers from Google Sheets Scanner tab (populated by Claude parsing TOS screenshot)
- Calculates full grade, stop, target, shares, sector, earnings
- Fires graded alert to Telegram

**Signal Review Workflow**
1. TOS scanner fires push alert
2. Open TOS mobile → check watchlist columns (RVol, ATR%, SwingΔ%)
3. Hard skip anything RED in columns
4. Screenshot TOS watchlist → send to Claude
5. Claude parses tickers, pre-screens, gives list
6. Paste list into Google Sheets Scanner tab
7. Run Colab Cell 5.5 → full graded alert fires to Telegram
8. Pull 1H + Daily charts in TOS → upload to SwingBot Trade Review
9. Review output → place limit order if TAKE

**Chart Study (TOS)**
- Study name: SwingBot_Study
- EMA9 (green), EMA21 (yellow), SMA200 (red dashed)
- On-chart labels: ATR, RVol, SwingΔ%, VIX, SMA200 status, EMA status
- Signal arrows: green up on bullish cross, magenta down on bearish cross
- Saved styles: SwingBot_1H and SwingBot_Daily

**Watchlist Columns (TOS)**
- RVol — relative volume vs 20-bar average, color coded
- ATR$ — dollar ATR using Wilder's smoothing
- ATR% — ATR as % of price, color coded
- SwingΔ% — % below 20-bar swing high, color coded

**Trade Journal**
- URL: mcamtran.github.io/swingbot/SwingBot%20Journal%20Standalone.html
- Add to home screen for app-like access
- Reads and writes to Google Sheets RAW_DATA tab via Apps Script webhook
- Entry: paste JSON from Claude → parse → confirm → save
- Exit: select open trade → paste exit JSON → confirm → save

**Dashboard**
- Google Sheets DASHBOARD tab — auto-updates from RAW_DATA
- Shows: P&L, win rate, expectancy, profit factor, R-multiple, progress to 50 trades
- Breakdowns by signal grade, self grade, exit reason, sector

**Alert Format (current):**
```
🟢 SIGNAL ALERT — 10:05 AM EST
Data as of: 10:00 AM EST
━━━━━━━━━━━━━━━━━━━━━
CYRX | Grade B | Score 7/10
Entry   : $10.45
Stop    : $10.12  (Entry − 1×ATR)
Target  : $11.11  (Entry + 2×ATR)
ATR     : $0.165
Shares  : 21
Sector  : Healthcare
Rel Vol : 0.7x 🟢 Acceptable for this time
Swing Δ : 1.4% below swing high
Float   : 77.7M  |  Mkt Cap: $2726.6M
VIX     : 18.4
Earnings: NO
━━━━━━━━━━━━━━━━━━━━━
1 signal found
```

---

## Monthly Review Process

At the end of every month review these four questions:

1. Did my live win rate match the backtest expectations?
2. Which grading questions were most predictive of wins?
3. Which signals did I skip — should I have taken them?
4. What market condition was I trading in (trending, choppy, high VIX)?

Adjust grading weights only after reviewing a minimum of 50 trades and rerunning the backtest with updated scoring.

---

## Key Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| ATR stop multiplier | 1× (changed from 2×) | Matches backtest best performer |
| ATR target multiplier | 2× (changed from 4×) | R:R 2:1 confirmed by backtest |
| Timeout rule | 10 days | Better P&L than 14 days |
| Grade threshold | B minimum | Grade B 56% WR vs Grade A 25% WR |
| VIX range | 15–25 | Confirmed by multiple backtests |
| Trade cap | 5 open max | Balance between frequency and risk |
| Bearish cross exit | Rejected | Cuts winners, -$917 P&L impact |
| Data source | TOS native | Eliminates yfinance EMA inconsistency |
| Entry type | Limit Day Only | Faded entry — never chase |
| ATR% minimum | 1.0% | Below this stop too tight for noise |
| Float minimum | 20M | Below this liquidity too thin |
| Score reweighting | Parked | Needs backtest rerun first |

---

## Key Dates

| Date | Action |
|---|---|
| May 27, 2026 | Go live — paper trading |
| May 29, 2026 | TOS scanner built, journal deployed, dashboard built |
| June 1, 2026 | First monthly universe refresh |
| September 15, 2026 | Review 4H signal addition |
| ~September 20, 2026 | Expected 50-trade milestone |

---

## Parked Items (review after 50 trades)

- Score reweighting — remove auto-pass Q1/Q2 from denominator (needs backtest rerun first)
- Float vs market cap floor — scaled by price tier
- Win rate by setup type
- Sector ETF alignment filter
- 4H signals

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

> TOS is the source of truth. If TOS doesn't show the cross, the signal is not confirmed regardless of what Colab fired.

> Place the limit order and walk away. If price comes back to you, you're in. If it doesn't, you missed it — that's fine.

> A signal that fired after 3:30 PM is not a trade for today. It's a watchlist item for tomorrow if structure holds.

> Check VIX before doing anything else. If it's outside 15–25, close Colab and go be a parent.
