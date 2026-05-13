// fetch-earnings.js — scrape next-earnings-date per ticker from
// stockanalysis.com (their stock page server-renders "Earnings Date: ...").
// Writes data/earnings-dates.json which gets embedded in the viewer.
//
// Usage: node fetch-earnings.js
// Output: { "ticker": { "next": "YYYY-MM-DD", "label": "Aug 27, 2026", "as_of": ... } }
//
// Run weekly via GH Action (matches the price-refresh cadence).

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TICKERS_CSV = path.join(ROOT, "tickers.csv");
const OUT = path.join(ROOT, "data", "earnings-dates.json");
const BATCH = 6;
const PAUSE_MS = 400;
const TIMEOUT_MS = 15000;

const SKIP = new Set([
  "SSNLF","SHECY","SUOPY","SOIGY","AIQUY","AKZOY","LYSDY","VEOEY","SMSMY",
  "ASMIY","BESIY","SBGSY","ABBNY","LNVGY","COMM"
]);

function readTickers() {
  return fs.readFileSync(TICKERS_CSV, "utf-8").split(/\r?\n/).filter(Boolean).slice(1)
    .map(l => l.split(",")[0]).filter(Boolean);
}

async function fetchTicker(t) {
  const url = `https://stockanalysis.com/stocks/${t.toLowerCase()}/`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      headers: { "User-Agent": "ai-supply-chain-earnings/1.0" },
    });
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };
    const html = await r.text();
    // Look for "Earnings Date" pattern. stockanalysis renders "Earnings Date" with the next date.
    // Examples: "Earnings Date</span>...Aug 27, 2026", "Earnings: Aug 27, 2026"
    const patterns = [
      // stockanalysis embeds: earningsDate:"May 20, 2026"
      /earningsDate:"([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})"/,
      /"earningsDate":"([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})"/,
      /Earnings Date[^A-Z]{1,40}([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/,
      /next earnings[^A-Z]{1,30}([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/i,
    ];
    for (const pat of patterns) {
      const m = pat.exec(html);
      if (m) {
        const label = m[1];
        // Try to parse to ISO
        const d = new Date(label);
        const iso = isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
        return { ok: true, label, next: iso };
      }
    }
    return { ok: false, reason: "no date found" };
  } catch (e) {
    return { ok: false, reason: e.name === "AbortError" ? "timeout" : e.message };
  } finally { clearTimeout(timer); }
}

async function main() {
  const all = readTickers().filter(t => !SKIP.has(t));
  console.log(`Fetching earnings dates for ${all.length} tickers...`);
  const today = new Date().toISOString().slice(0, 10);
  const out = {};
  let success = 0, fail = 0;
  for (let i = 0; i < all.length; i += BATCH) {
    const batch = all.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async t => ({ t, r: await fetchTicker(t) })));
    for (const { t, r } of results) {
      if (r.ok) { out[t] = { label: r.label, next: r.next, as_of: today }; success++; }
      else { fail++; }
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH, all.length)}/${all.length}`);
    if (i + BATCH < all.length) await new Promise(res => setTimeout(res, PAUSE_MS));
  }
  console.log("\n");
  if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ as_of: today, dates: out }, null, 2) + "\n");
  console.log(`Wrote ${Object.keys(out).length} dates to ${OUT}. (${fail} couldn't be parsed)`);
}

main().catch(e => { console.error(e); process.exit(1); });
