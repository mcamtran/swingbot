"""
SwingBot — Live Scanner
Runs hourly during market hours via GitHub Actions.
Sends Grade A and B signals to Telegram.
"""

import os
import json
import time
import urllib.request
import warnings
from datetime import datetime, date, timedelta
import pytz
import pandas as pd
import numpy as np
import yfinance as yf

warnings.filterwarnings('ignore')
pd.set_option('future.no_silent_downcasting', True)

# ── Constants ─────────────────────────────────────────────────────────────────
TELEGRAM_TOKEN   = os.environ['TELEGRAM_TOKEN']
CHAT_ID          = os.environ['CHAT_ID']
PRICE_MIN        = 5.0
PRICE_MAX        = 25.0
VIX_MIN          = 15.0
VIX_MAX          = 25.0
RISK_PER_TRADE   = 7.0
ATR_STOP_MULT    = 2.0
ATR_TARGET_MULT  = 4.0
ATR_PERIOD       = 14
EARNINGS_DAYS    = 7
DEDUP_FILE       = 'data/alerted_today.json'
UNIVERSE_FILE    = 'data/universe.csv'
EST              = pytz.timezone('America/New_York')

# ── US Market Holidays 2026 ───────────────────────────────────────────────────
MARKET_HOLIDAYS = {
    date(2026, 1, 1),   # New Year's Day
    date(2026, 1, 19),  # MLK Day
    date(2026, 2, 16),  # Presidents Day
    date(2026, 4, 3),   # Good Friday
    date(2026, 5, 25),  # Memorial Day
    date(2026, 7, 3),   # Independence Day (observed)
    date(2026, 9, 7),   # Labor Day
    date(2026, 11, 26), # Thanksgiving
    date(2026, 12, 25), # Christmas
}

# ── Telegram ──────────────────────────────────────────────────────────────────
def send_telegram(text):
    """Send a message to Telegram with retry logic."""
    url  = f'https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage'
    data = json.dumps({
        'chat_id'    : CHAT_ID,
        'text'       : text,
        'parse_mode' : 'HTML'
    }).encode()
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url, data=data,
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=10) as r:
                result = json.loads(r.read())
                if result.get('ok'):
                    return True
        except Exception as e:
            if attempt < 2:
                time.sleep(2)
    return False

# ── Market status ─────────────────────────────────────────────────────────────
def is_market_holiday():
    return date.today() in MARKET_HOLIDAYS

def get_est_time():
    return datetime.now(EST)

# ── Deduplication ─────────────────────────────────────────────────────────────
def load_alerted():
    """Load tickers already alerted today."""
    try:
        if os.path.exists(DEDUP_FILE):
            with open(DEDUP_FILE) as f:
                data = json.load(f)
            # Reset if it's a new day
            if data.get('date') != str(date.today()):
                return {}
            return data.get('tickers', {})
    except:
        pass
    return {}

def save_alerted(tickers):
    """Save alerted tickers for today."""
    os.makedirs('data', exist_ok=True)
    with open(DEDUP_FILE, 'w') as f:
        json.dump({'date': str(date.today()), 'tickers': tickers}, f)

# ── Universe ──────────────────────────────────────────────────────────────────
def load_universe():
    """Load ticker universe from CSV file."""
    try:
        df = pd.read_csv(UNIVERSE_FILE)
        # Handle TradingView export format
        col = None
        for c in df.columns:
            if c.lower() in ['ticker', 'symbol']:
                col = c
                break
        if col:
            tickers = df[col].dropna().tolist()
        else:
            # First column
            tickers = df.iloc[:, 0].dropna().tolist()
        # Clean tickers
        tickers = [str(t).strip().replace('.', '-') for t in tickers
                   if str(t).strip().isalpha() or '-' in str(t)]
        return list(dict.fromkeys(tickers))
    except Exception as e:
        send_telegram(f'🔴 <b>SwingBot ERROR</b>\nFailed to load universe: {e}')
        return []

# ── Data fetch with retry ─────────────────────────────────────────────────────
def fetch_with_retry(func, retries=3, delay=5):
    """Retry a yfinance fetch on failure."""
    for attempt in range(retries):
        try:
            result = func()
            if result is not None and not (hasattr(result, 'empty') and result.empty):
                return result
        except Exception:
            pass
        if attempt < retries - 1:
            time.sleep(delay)
    return None

def get_vix():
    """Get current VIX value."""
    try:
        def fetch():
            v = yf.download('^VIX', period='5d', interval='1d',
                           progress=False, auto_adjust=True)
            if v.empty: return None
            if v.index.tz is not None:
                v.index = v.index.tz_localize(None)
            return float(v['Close'].dropna().iloc[-1])
        return fetch_with_retry(fetch)
    except:
        return None

def get_daily_close(tickers):
    """Get yesterday's closing prices and SMA200 for all tickers."""
    try:
        end   = date.today()
        start = end - timedelta(days=300)
        def fetch():
            return yf.download(
                tickers, start=start.strftime('%Y-%m-%d'),
                end=end.strftime('%Y-%m-%d'),
                interval='1d', progress=False, auto_adjust=True
            )
        raw = fetch_with_retry(fetch)
        if raw is None or raw.empty: return {}, {}
        if raw.index.tz is not None:
            raw.index = raw.index.tz_localize(None)
        close_df = raw['Close']
        prices   = {}
        sma200s  = {}
        for ticker in tickers:
            if ticker not in close_df.columns: continue
            s = close_df[ticker].dropna()
            if s.empty: continue
            prices[ticker]  = float(s.iloc[-1])
            sma = s.rolling(200, min_periods=50).mean().dropna()
            if not sma.empty:
                sma200s[ticker] = float(sma.iloc[-1])
        return prices, sma200s
    except:
        return {}, {}

def get_hourly(tickers):
    """Get 1H bars for EMA cross detection."""
    try:
        end   = date.today() + timedelta(days=1)
        start = date.today() - timedelta(days=5)
        def fetch():
            return yf.download(
                tickers, start=start.strftime('%Y-%m-%d'),
                end=end.strftime('%Y-%m-%d'),
                interval='1h', progress=False, auto_adjust=True
            )
        raw = fetch_with_retry(fetch)
        if raw is None or raw.empty: return None
        if raw.index.tz is not None:
            raw.index = raw.index.tz_localize(None)
        return raw
    except:
        return None

def check_earnings(ticker):
    """Check if ticker has earnings within EARNINGS_DAYS."""
    try:
        t   = yf.Ticker(ticker)
        cal = t.calendar
        if cal is None or (hasattr(cal, 'empty') and cal.empty):
            return False
        if isinstance(cal, pd.DataFrame):
            if 'Earnings Date' in cal.index:
                earn = pd.Timestamp(cal.loc['Earnings Date'].iloc[0])
            elif 'Earnings Date' in cal.columns:
                earn = pd.Timestamp(cal['Earnings Date'].iloc[0])
            else:
                return False
            earn = earn.tz_localize(None) if earn.tzinfo else earn
            diff = (earn - pd.Timestamp(date.today())).days
            return 0 <= diff <= EARNINGS_DAYS
    except:
        pass
    return False

# ── Grading ───────────────────────────────────────────────────────────────────
def get_bars(ticker, daily_raw):
    """Extract daily bars for a ticker."""
    try:
        close_df  = daily_raw['Close']
        open_df   = daily_raw['Open']
        high_df   = daily_raw['High']
        low_df    = daily_raw['Low']
        volume_df = daily_raw['Volume']
        if ticker not in close_df.columns: return None
        df = pd.DataFrame({
            'open'  : open_df[ticker].dropna(),
            'high'  : high_df[ticker].dropna(),
            'low'   : low_df[ticker].dropna(),
            'close' : close_df[ticker].dropna(),
            'volume': volume_df[ticker].dropna(),
        }).tail(60)
        return df if len(df) >= 5 else None
    except:
        return None

def grade_signal(bars, price, vix):
    """Score signal 0-10 using 10 questions."""
    if bars is None:
        return 2, 'D', [1,1,0,0,0,0,0,0,0,0]

    scores = []

    # Q1 — EMA cross confirmed (always 1 — scanner confirmed it)
    scores.append(1)

    # Q2 — Above 200 SMA (always 1 — scanner confirmed it)
    scores.append(1)

    # Q3 — Price staying above 10/20 EMA
    try:
        e10 = bars['close'].ewm(span=10, adjust=False).mean()
        e20 = bars['close'].ewm(span=20, adjust=False).mean()
        c3  = bars['close'].iloc[-3:].values
        scores.append(1 if all(c3 > e10.iloc[-3:].values) and
                          all(c3 > e20.iloc[-3:].values) else 0)
    except: scores.append(0)

    # Q4 — ADX > 20 (trending not choppy)
    try:
        if len(bars) >= 20:
            h,l,c = bars['high'], bars['low'], bars['close']
            tr    = pd.concat([h-l,(h-c.shift(1)).abs(),(l-c.shift(1)).abs()],axis=1).max(axis=1)
            up    = h.diff(); dn = -l.diff()
            pdm   = up.where((up>dn)&(up>0), 0.0)
            ndm   = dn.where((dn>up)&(dn>0), 0.0)
            atr14 = tr.rolling(14).mean()
            pdi   = 100*pdm.rolling(14).mean()/atr14
            ndi   = 100*ndm.rolling(14).mean()/atr14
            dx    = 100*(pdi-ndi).abs()/(pdi+ndi)
            adx   = dx.rolling(14).mean()
            scores.append(1 if float(adx.iloc[-1]) > 20 else 0)
        else: scores.append(0)
    except: scores.append(0)

    # Q5 — Price near swing high/low from last 20 days
    try:
        sh = bars.tail(20)['high'].max()
        sl = bars.tail(20)['low'].min()
        scores.append(1 if (abs(price-sh)/price <= 0.03 or
                            abs(price-sl)/price <= 0.03) else 0)
    except: scores.append(0)

    # Q6 — VIX 15-25
    scores.append(1 if vix and VIX_MIN <= float(vix) <= VIX_MAX else 0)

    # Q7 — Strong bullish candle
    try:
        l    = bars.iloc[-1]
        body = abs(l['close']-l['open'])
        rng  = l['high']-l['low']
        scores.append(1 if rng > 0 and body/rng >= 0.5 and l['close'] > l['open'] else 0)
    except: scores.append(0)

    # Q8 — Daily trend aligned (EMA9 > EMA21)
    try:
        e9  = bars['close'].ewm(span=9,  adjust=False).mean()
        e21 = bars['close'].ewm(span=21, adjust=False).mean()
        scores.append(1 if float(e9.iloc[-1]) > float(e21.iloc[-1]) else 0)
    except: scores.append(0)

    # Q9 — Clear stop placement
    try:
        if len(bars) >= 14:
            tr  = pd.concat([bars['high']-bars['low'],
                             (bars['high']-bars['close'].shift(1)).abs(),
                             (bars['low'] -bars['close'].shift(1)).abs()],axis=1).max(axis=1)
            atr = float(tr.rolling(14).mean().iloc[-1])
            sl  = float(bars['low'].tail(10).min())
            scores.append(1 if (price-2*atr) <= sl <= price else 0)
        else: scores.append(0)
    except: scores.append(0)

    # Q10 — Volume above 1.5x 20-bar average
    try:
        avg = bars['volume'].tail(21).iloc[:-1].mean()
        scores.append(1 if avg > 0 and float(bars['volume'].iloc[-1]) >= 1.5*avg else 0)
    except: scores.append(0)

    total = sum(scores)
    if total >= 9:   grade = 'A'
    elif total >= 7: grade = 'B'
    elif total >= 5: grade = 'C'
    else:            grade = 'D'

    return total, grade, scores

# ── ATR calculation ───────────────────────────────────────────────────────────
def calc_atr(bars):
    try:
        if bars is None or len(bars) < ATR_PERIOD: return None
        tr = pd.concat([
            bars['high'] - bars['low'],
            (bars['high'] - bars['close'].shift(1)).abs(),
            (bars['low']  - bars['close'].shift(1)).abs()
        ], axis=1).max(axis=1)
        return float(tr.rolling(ATR_PERIOD).mean().iloc[-1])
    except:
        return None

# ── EMA cross detection ───────────────────────────────────────────────────────
def has_cross(series):
    ema9  = series.ewm(span=9,  adjust=False).mean()
    ema21 = series.ewm(span=21, adjust=False).mean()
    fast  = (ema9 > ema21).astype(bool)
    prev  = fast.shift(1).fillna(False).astype(bool)
    return fast & ~prev

# ── Format alert message ──────────────────────────────────────────────────────
def format_alert(signals, scan_time, data_time):
    now_str  = scan_time.strftime('%I:%M %p EST')
    data_str = data_time.strftime('%I:%M %p EST') if data_time else 'Unknown'
    lines    = [
        f'🟢 <b>SIGNAL ALERT — {now_str}</b>',
        f'Data as of: {data_str}',
        '━━━━━━━━━━━━━━━━━━━━━'
    ]
    for s in signals:
        lines += [
            f'<b>{s["ticker"]}</b> | Grade {s["grade"]} | Score {s["score"]}/10',
            f'Entry   : ${s["entry"]:.2f}',
            f'Stop    : ${s["stop"]:.2f}',
            f'Target  : ${s["target"]:.2f}',
            f'ATR     : ${s["atr"]:.3f}',
            f'Shares  : {s["shares"]}',
            f'VIX     : {s["vix"]}',
            f'Earnings: {s["earnings"]}',
            '━━━━━━━━━━━━━━━━━━━━━'
        ]
    lines.append(f'{len(signals)} signal{"s" if len(signals)>1 else ""} found')
    return '\n'.join(lines)

# ── Heartbeat ─────────────────────────────────────────────────────────────────
def send_heartbeat(vix):
    universe = load_universe()
    vix_str  = str(round(vix, 2)) if vix else 'N/A'
    vix_note = ''
    if vix:
        if vix < VIX_MIN:
            vix_note = f' ⚠️ Below {VIX_MIN} — no trades today'
        elif vix > VIX_MAX:
            vix_note = f' ⚠️ Above {VIX_MAX} — no trades today'
        else:
            vix_note = ' ✅ In range'
    msg = (f'✅ <b>SwingBot Online</b>\n'
           f'Market opens in 40 minutes\n'
           f'━━━━━━━━━━━━━━━━━━━━━\n'
           f'Universe : {len(universe)} tickers\n'
           f'VIX      : {vix_str}{vix_note}\n'
           f'Scans    : 10:05 11:05 12:05 13:05 14:05 15:05 EST')
    send_telegram(msg)

# ── Daily recap ───────────────────────────────────────────────────────────────
def send_recap(vix):
    alerted  = load_alerted()
    now_str  = get_est_time().strftime('%B %d, %Y')
    vix_str  = str(round(vix, 2)) if vix else 'N/A'
    if not alerted:
        msg = (f'📊 <b>SwingBot Daily Recap — {now_str}</b>\n'
               f'━━━━━━━━━━━━━━━━━━━━━\n'
               f'No signals today\n'
               f'VIX: {vix_str}')
    else:
        lines = [
            f'📊 <b>SwingBot Daily Recap — {now_str}</b>',
            f'━━━━━━━━━━━━━━━━━━━━━',
            f'Signals today: {len(alerted)}',
            '━━━━━━━━━━━━━━━━━━━━━'
        ]
        for ticker, info in alerted.items():
            lines.append(
                f'{info["time"]} — <b>{ticker}</b> | '
                f'Grade {info["grade"]} | Entry ${info["entry"]}'
            )
        lines.append(f'━━━━━━━━━━━━━━━━━━━━━')
        lines.append(f'VIX today: {vix_str}')
        msg = '\n'.join(lines)
    send_telegram(msg)

# ── Monthly validation ────────────────────────────────────────────────────────
def send_monthly_validation():
    universe = load_universe()
    now_str  = get_est_time().strftime('%B %d, %Y')
    # Validate tickers
    valid    = []
    invalid  = []
    for ticker in universe[:10]:  # sample check first 10
        try:
            d = yf.download(ticker, period='5d', interval='1d',
                           progress=False, auto_adjust=True)
            if not d.empty: valid.append(ticker)
            else:           invalid.append(ticker)
        except:
            invalid.append(ticker)
        time.sleep(0.2)
    msg = (f'📋 <b>Universe Updated — {now_str}</b>\n'
           f'━━━━━━━━━━━━━━━━━━━━━\n'
           f'Tickers loaded : {len(universe)}\n'
           f'Sample check   : {len(valid)}/10 valid\n')
    if invalid:
        msg += f'Issues found   : {", ".join(invalid)}\n'
    msg += f'Next refresh   : {(date.today().replace(day=1) + timedelta(days=32)).replace(day=1).strftime("%B 1, %Y")}'
    send_telegram(msg)

# ── Main scanner ──────────────────────────────────────────────────────────────
def run_scanner(mode='scan'):
    """
    mode options:
      heartbeat — send 9:50 AM status message
      scan      — run hourly signal scan
      recap     — send 3:30 PM daily recap
      monthly   — send monthly validation
      dst_reminder — send DST clock change reminder
    """
    try:
        vix = get_vix()

        # ── Test mode — sends a real message to confirm pipeline works ────────
        if mode == 'test':
            now_str = get_est_time().strftime('%I:%M %p EST')
            send_telegram(
                f'\U0001f7e2 <b>SwingBot Pipeline Test</b>\n'
                f'━━━━━━━━━━━━━━━━━━━━━\n'
                f'GitHub Actions → Telegram: ✅ Working\n'
                f'Time: {now_str}\n'
                f'VIX: {round(vix, 2) if vix else "N/A"}\n'
                f'━━━━━━━━━━━━━━━━━━━━━\n'
                f'SwingBot is ready to go live!'
            )
            return

        # ── Heartbeat ─────────────────────────────────────────────────────────
        if mode == 'heartbeat':
            send_heartbeat(vix)
            return

        # ── Daily recap ───────────────────────────────────────────────────────
        if mode == 'recap':
            send_recap(vix)
            return

        # ── Monthly validation ────────────────────────────────────────────────
        if mode == 'monthly':
            send_monthly_validation()
            return

        # ── DST reminder ──────────────────────────────────────────────────────
        if mode == 'dst_reminder':
            now = get_est_time()
            if now.month == 3:
                msg = ('⏰ <b>DST Reminder — Clocks Spring Forward Tonight</b>\n'
                       'Set clocks ahead 1 hour at 2:00 AM\n'
                       'SwingBot schedule automatically adjusted ✅')
            else:
                msg = ('⏰ <b>DST Reminder — Clocks Fall Back Tonight</b>\n'
                       'Set clocks back 1 hour at 2:00 AM\n'
                       'SwingBot schedule automatically adjusted ✅')
            send_telegram(msg)
            return

        # ── Hourly scan ───────────────────────────────────────────────────────
        if is_market_holiday():
            return  # silent on holidays

        # VIX check — silent if outside range
        if vix and (vix < VIX_MIN or vix > VIX_MAX):
            return

        now       = get_est_time()
        universe  = load_universe()
        alerted   = load_alerted()

        if not universe:
            return

        # Get daily data for all tickers
        prices, sma200s = get_daily_close(universe)

        # Filter to in-range and above SMA200
        candidates = [
            t for t in universe
            if t in prices and PRICE_MIN <= prices[t] <= PRICE_MAX
            and t in sma200s and prices[t] > sma200s[t]
        ]

        if not candidates:
            return

        # Get 1H data for candidates
        hourly_raw = get_hourly(candidates)
        if hourly_raw is None:
            return

        hourly_close = hourly_raw['Close']

        # Get daily data again for grading (includes open/high/low/volume)
        end    = date.today()
        start  = end - timedelta(days=300)
        daily_raw = fetch_with_retry(lambda: yf.download(
            candidates,
            start=start.strftime('%Y-%m-%d'),
            end=end.strftime('%Y-%m-%d'),
            interval='1d', progress=False, auto_adjust=True
        ))
        if daily_raw is not None and daily_raw.index.tz is not None:
            daily_raw.index = daily_raw.index.tz_localize(None)

        # Get latest data timestamp
        data_time = None
        try:
            last_ts = hourly_close.index[-1]
            data_time = pd.Timestamp(last_ts).tz_localize(EST) if last_ts.tzinfo is None else last_ts.tz_convert(EST)
            data_time = data_time.to_pydatetime()
        except:
            pass

        # Scan for crosses in last hour
        scan_window_start = now - timedelta(hours=1, minutes=10)
        signals_found = []

        for ticker in candidates:
            # Skip if already alerted today
            if ticker in alerted:
                continue

            if ticker not in hourly_close.columns:
                continue

            s = hourly_close[ticker].dropna()
            if len(s) < 20:
                continue

            # Detect cross in last scan window
            cross = has_cross(s)
            # Filter to last hour
            window = cross[cross.index >= pd.Timestamp(scan_window_start.replace(tzinfo=None))]
            if not window.any():
                continue

            price = float(s.iloc[-1])
            if not (PRICE_MIN <= price <= PRICE_MAX):
                continue
            if price <= sma200s.get(ticker, price):
                continue

            # Grade the signal
            bars        = get_bars(ticker, daily_raw) if daily_raw is not None else None
            score, grade, q_scores = grade_signal(bars, price, vix)

            # Only A and B
            if grade not in ('A', 'B'):
                continue

            # Calculate trade levels
            atr_daily = calc_atr(bars)
            if atr_daily is None or atr_daily <= 0:
                continue

            stop    = round(price - ATR_STOP_MULT   * atr_daily, 2)
            target  = round(price + ATR_TARGET_MULT * atr_daily, 2)
            shares  = max(1, int(RISK_PER_TRADE / (ATR_STOP_MULT * atr_daily)))
            earnings= 'YES' if check_earnings(ticker) else 'NO'

            signals_found.append({
                'ticker'  : ticker,
                'grade'   : grade,
                'score'   : score,
                'entry'   : round(price, 2),
                'stop'    : stop,
                'target'  : target,
                'atr'     : round(atr_daily, 3),
                'shares'  : shares,
                'vix'     : round(vix, 2) if vix else 'N/A',
                'earnings': earnings,
            })

            # Record in dedup
            alerted[ticker] = {
                'time'  : now.strftime('%I:%M %p'),
                'grade' : grade,
                'entry' : round(price, 2)
            }

        # Send combined alert
        if signals_found:
            msg = format_alert(signals_found, now, data_time)
            send_telegram(msg)
            save_alerted(alerted)

    except Exception as e:
        # Send crash alert
        now_str = get_est_time().strftime('%I:%M %p EST')
        send_telegram(
            f'🔴 <b>SwingBot ERROR — {now_str}</b>\n'
            f'Scanner failed to complete\n'
            f'Reason: {str(e)[:100]}\n'
            f'Action: Check GitHub Actions logs'
        )

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else 'scan'
    run_scanner(mode)
