// fetch-holders.js — scrape top institutional holders + insider/institutional
// ownership breakdown from finance.yahoo.com/quote/<T>/holders/.
//
// Yahoo's holders page is rendered client-side, so this needs a headless
// browser (playwright npm package — same as fetch-quarterly.js).
//
// Usage:
//   npm install playwright           # one-time
//   npx playwright install chromium  # one-time
//   node fetch-holders.js            # all anchors in data/people/
//   node fetch-holders.js NVDA AMD   # specific tickers
//
// Merges into existing data/people/<TICKER>.json under `top_holders` +
// `ownership_breakdown`. Run quarterly (after 13F filing deadlines —
// ~45 days after each calendar quarter-end).

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PEOPLE_DIR = path.join(ROOT, "data", "people");

function anchorTickers() {
  if (!fs.existsSync(PEOPLE_DIR)) return [];
  return fs.readdirSync(PEOPLE_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(/\.json$/, ""));
}

function parseShares(s) {
  // "1.94B", "725.49M", "12,345"
  if (s == null) return null;
  const str = String(s).trim();
  const m = /^([\d.,]+)\s*([BMK]?)$/i.exec(str);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(num)) return null;
  const mult = m[2] === "B" ? 1e9 : m[2] === "M" ? 1e6 : m[2] === "K" ? 1e3 : 1;
  return num * mult;
}

function parseValue(s) {
  if (s == null) return null;
  const v = Number(String(s).replace(/[,\$]/g, ""));
  return isNaN(v) ? null : v;
}

function parsePct(s) {
  if (s == null) return null;
  const v = Number(String(s).replace(/[%,]/g, ""));
  return isNaN(v) ? null : v;
}

async function fetchTicker(page, t) {
  const url = `https://finance.yahoo.com/quote/${t}/holders/`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  try { await page.waitForSelector("table tr", { timeout: 8000 }); }
  catch (e) { return { ok: false, reason: "no table" }; }
  const raw = await page.evaluate(() => {
    const tables = document.querySelectorAll("table");
    const out = [];
    for (const t of tables) {
      const trs = t.querySelectorAll("tr");
      const rows = [];
      for (const tr of trs) {
        const cells = Array.from(tr.querySelectorAll("th, td")).map(c => c.innerText.trim());
        if (cells.length) rows.push(cells);
      }
      if (rows.length) out.push(rows);
    }
    return out;
  });
  // Tables: [0]=breakdown, [1]=top institutional, [2]=top mutual funds (sometimes)
  const ownership = {};
  if (raw[0]) {
    for (const row of raw[0].slice(1)) {           // skip header
      // row format: [pct, label]
      if (row.length >= 2) ownership[row[1]] = row[0];
    }
  }
  function parseHolderTable(rows) {
    const out = [];
    for (const row of rows.slice(1)) {            // skip header
      if (row.length < 5) continue;
      out.push({
        name: row[0],
        shares: parseShares(row[1]),
        date_reported: row[2],
        pct_outstanding: parsePct(row[3]),
        value_usd: parseValue(row[4]),
      });
    }
    return out;
  }
  const institutional = raw[1] ? parseHolderTable(raw[1]) : [];
  const mutual_funds  = raw[2] ? parseHolderTable(raw[2]) : [];
  return { ok: true, ownership_breakdown: ownership, top_institutional: institutional, top_mutual_funds: mutual_funds };
}

async function main() {
  const args = process.argv.slice(2);
  const tickers = args.length ? args : anchorTickers();
  console.log(`Fetching holders for ${tickers.length} ticker(s) via Playwright...`);

  let pw;
  try { pw = require("playwright"); }
  catch (e) {
    console.error("\n⚠ playwright not installed. Run:\n    npm install playwright\n    npx playwright install chromium\n");
    process.exit(1);
  }

  const browser = await pw.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 ai-supply-chain-holders/1.0" });
  const page = await ctx.newPage();

  // One-time Yahoo consent
  try {
    await page.goto("https://finance.yahoo.com/quote/NVDA/holders/", { waitUntil: "domcontentloaded", timeout: 30000 });
    const consent = await page.$("button[name=agree]");
    if (consent) await consent.click();
  } catch (e) {}

  const today = new Date().toISOString().slice(0, 10);
  let ok = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < tickers.length; i++) {
    const t = tickers[i];
    process.stdout.write(`\r  [${i+1}/${tickers.length}] ${t.padEnd(8)} `);
    try {
      const r = await fetchTicker(page, t);
      if (r.ok) {
        const fp = path.join(PEOPLE_DIR, t + ".json");
        let existing = {};
        try { existing = JSON.parse(fs.readFileSync(fp, "utf-8")); } catch (e) { existing = { ticker: t }; }
        existing.top_holders = r.top_institutional;
        existing.top_mutual_funds = r.top_mutual_funds;
        existing.ownership_breakdown = r.ownership_breakdown;
        existing.sources = existing.sources || {};
        existing.sources.top_holders = `https://finance.yahoo.com/quote/${t}/holders/`;
        existing.as_of = today;
        fs.writeFileSync(fp, JSON.stringify(existing, null, 2) + "\n");
        ok++;
      } else {
        failures.push(`${t}: ${r.reason}`);
        fail++;
      }
    } catch (e) {
      failures.push(`${t}: ${e.message}`);
      fail++;
    }
    await new Promise(res => setTimeout(res, 600));
  }
  await browser.close();
  console.log(`\n\n✓ ${ok} with holders data  ·  ✗ ${fail} failed`);
  if (failures.length) failures.forEach(f => console.log("    " + f));
}

main().catch(e => { console.error(e); process.exit(1); });
