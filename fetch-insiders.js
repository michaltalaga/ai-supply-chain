// fetch-insiders.js — scrape recent Form 4 insider trades from finviz.com
// for the 31 anchor tickers. Merges results into data/people/<TICKER>.json
// under `insider_trades` (preserves the existing `leadership` array).
//
// Source: finviz quote page has an "Insider Trading" HTML table with the
// most-recent ~10 transactions per ticker. Free, no key needed, scrapable.
//
// Usage:
//   node fetch-insiders.js              # all anchor tickers with people files
//   node fetch-insiders.js NVDA AMD     # specific tickers

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PEOPLE_DIR = path.join(ROOT, "data", "people");
const BATCH = 2;
const PAUSE_MS = 2200;       // finviz rate-limits aggressive scrapers
const TIMEOUT_MS = 15000;
const RETRY_ON_429 = true;
const RETRY_DELAY_MS = 8000;

function anchorTickers() {
  if (!fs.existsSync(PEOPLE_DIR)) return [];
  return fs.readdirSync(PEOPLE_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(/\.json$/, ""));
}

function parseDateStr(s) {
  // "Mar 20 '26" → "2026-03-20"
  const m = /^([A-Z][a-z]{2})\s+(\d{1,2})\s+'?(\d{2})/.exec(String(s || "").trim());
  if (!m) return null;
  const months = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };
  const month = months[m[1]];
  if (!month) return null;
  const day = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);
  year = year + (year < 50 ? 2000 : 1900);   // '26 → 2026, '99 → 1999
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

function parseNum(s) {
  if (s == null) return null;
  const v = Number(String(s).replace(/[,\$]/g, ""));
  return isNaN(v) ? null : v;
}

async function fetchTicker(t) {
  const url = `https://finviz.com/quote.ashx?t=${t}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ai-supply-chain-insiders/1.0",
        "Accept": "text/html",
      },
    });
    if (r.status === 429 && RETRY_ON_429) {
      await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
      const r2 = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (!r2.ok) return { ok: false, reason: `HTTP ${r2.status} (retried)` };
      const html2 = await r2.text();
      return processHtml(html2);
    }
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    const html = await r.text();
    return processHtml(html);
  } catch (e) {
    return { ok: false, reason: e.name === "AbortError" ? "timeout" : e.message };
  } finally { clearTimeout(timer); }
}

function processHtml(html) {
    const idx = html.indexOf("Insider Trading");
    if (idx < 0) return { ok: false, reason: "no insider section" };
    const section = html.substring(idx, idx + 20000);
    const rows = section.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    const trades = [];
    for (const row of rows) {
      const cells = (row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) || [])
        .map(c => c.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
      if (cells.length < 8) continue;
      if (/^Insider/i.test(cells[0]) || /^Relationship/i.test(cells[1])) continue; // header row
      const date = parseDateStr(cells[2]);
      if (!date) continue;
      trades.push({
        date,
        name: cells[0],
        role: cells[1],
        type: cells[3],
        price: parseNum(cells[4]),
        shares: parseNum(cells[5]),
        value_usd: parseNum(cells[6]),
        post_holding: parseNum(cells[7]),
      });
    }
    const filtered = trades
      .filter(t => !/^Proposed/i.test(t.type))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
    return { ok: true, trades: filtered };
}

async function main() {
  const args = process.argv.slice(2);
  const tickers = args.length ? args : anchorTickers();
  console.log(`Fetching insiders for ${tickers.length} ticker(s)...`);
  const today = new Date().toISOString().slice(0, 10);
  let ok = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < tickers.length; i += BATCH) {
    const batch = tickers.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async t => ({ t, r: await fetchTicker(t) })));
    for (const { t, r } of results) {
      const fp = path.join(PEOPLE_DIR, t + ".json");
      let existing = {};
      try { existing = JSON.parse(fs.readFileSync(fp, "utf-8")); } catch (e) { existing = { ticker: t }; }
      if (r.ok) {
        existing.insider_trades = r.trades;
        existing.sources = existing.sources || {};
        existing.sources.insider_trades = `https://finviz.com/quote.ashx?t=${t}`;
        existing.as_of = today;
        fs.writeFileSync(fp, JSON.stringify(existing, null, 2) + "\n");
        ok++;
      } else {
        failures.push(`${t}: ${r.reason}`);
        fail++;
      }
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH, tickers.length)}/${tickers.length}`);
    if (i + BATCH < tickers.length) await new Promise(res => setTimeout(res, PAUSE_MS));
  }
  console.log("\n");
  console.log(`✓ ${ok} with insider data  ·  ✗ ${fail} failed`);
  if (failures.length && failures.length < 30) failures.forEach(f => console.log("    " + f));
}

main().catch(e => { console.error(e); process.exit(1); });
