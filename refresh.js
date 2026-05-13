// refresh.js — re-fetch monthly price history for all tickers in tickers.csv
// from stockanalysis.com's public JSON history endpoint.
//
// Usage:
//   node refresh.js                    # all tickers
//   node refresh.js NVDA AMD TSM       # specific tickers only
//
// Requires Node >= 18 (uses global fetch).

const fs = require("fs");
const path = require("path");

const PRICE_DIR = path.join(__dirname, "data", "prices");
const TICKERS_CSV = path.join(__dirname, "tickers.csv");

const BATCH_SIZE = 8;
const BATCH_PAUSE_MS = 400;
const REQUEST_TIMEOUT_MS = 15000;
const TODAY = new Date().toISOString().slice(0, 10);

function readTickers() {
  const text = fs.readFileSync(TICKERS_CSV, "utf-8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map(l => l.split(",")[0]).filter(Boolean);
}

async function fetchPrices(ticker) {
  const url = `https://stockanalysis.com/api/symbol/s/${ticker.toLowerCase()}/history?range=5Y&period=Monthly`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "ai-supply-chain-refresh/1.0 (+github.com/michaltalaga/ai-supply-chain)" }
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}`, url };
    const json = await res.json();
    if (!json || !Array.isArray(json.data) || json.data.length === 0) {
      return { ok: false, reason: "empty payload", url };
    }
    const sorted = [...json.data].sort((a, b) => String(a.t).localeCompare(String(b.t)));
    const csv = sorted
      .map(r => `${String(r.t).slice(0, 7)}:${r.c}`)
      .join("|");
    return { ok: true, csv, count: sorted.length, url };
  } catch (e) {
    return { ok: false, reason: e.name === "AbortError" ? "timeout" : e.message, url };
  } finally {
    clearTimeout(timer);
  }
}

function writeStub(ticker, reason) {
  fs.writeFileSync(
    path.join(PRICE_DIR, ticker + ".json"),
    JSON.stringify({ ticker, status: "no_data", reason, as_of: TODAY }) + "\n"
  );
}

function writeData(ticker, csv) {
  fs.writeFileSync(
    path.join(PRICE_DIR, ticker + ".json"),
    JSON.stringify({
      ticker,
      currency_native: "USD",
      monthly_closes_csv: csv,
      as_of: TODAY,
      source: `https://stockanalysis.com/api/symbol/s/${ticker.toLowerCase()}/history?range=5Y&period=Monthly`
    }) + "\n"
  );
}

async function main() {
  const args = process.argv.slice(2);
  const tickers = args.length ? args : readTickers();
  console.log(`Refreshing prices for ${tickers.length} ticker(s) → ${PRICE_DIR}`);

  if (!fs.existsSync(PRICE_DIR)) fs.mkdirSync(PRICE_DIR, { recursive: true });

  const failures = [];
  let success = 0;

  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async t => ({ t, r: await fetchPrices(t) })));
    for (const { t, r } of results) {
      if (r.ok) {
        writeData(t, r.csv);
        success++;
      } else {
        writeStub(t, r.reason);
        failures.push(`${t}: ${r.reason}`);
      }
    }
    const pct = Math.min(100, Math.round(((i + BATCH_SIZE) / tickers.length) * 100));
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, tickers.length)}/${tickers.length}  (${pct}%)  `);
    if (i + BATCH_SIZE < tickers.length) {
      await new Promise(res => setTimeout(res, BATCH_PAUSE_MS));
    }
  }

  console.log("\n");
  console.log(`✓ ${success} with data`);
  console.log(`✗ ${failures.length} stubs (expected for OTC unsponsored ADRs: SSNLF, SHECY, SUOPY, SOIGY, AIQUY, AKZOY, LYSDY, VEOEY, SMSMY, ASMIY, BESIY, SBGSY, ABBNY, LNVGY + acquired: JNPR + restructure: COMM)`);
  if (failures.length && failures.length < 25) {
    console.log("\nFailures:");
    failures.forEach(f => console.log("  " + f));
  }
  console.log("\nNext step: npm run build");
}

main().catch(e => { console.error(e); process.exit(1); });
