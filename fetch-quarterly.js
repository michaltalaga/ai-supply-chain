// fetch-quarterly.js — scrape last 8 quarters of income-statement data from
// stockanalysis.com (which renders client-side, so we need a headless browser).
//
// REQUIRES: `npm install playwright` first (not pinned to project deps since
// it pulls down a browser binary; opt-in dependency).
//
// Usage:
//   node fetch-quarterly.js                # only tickers missing a quarterly file
//   node fetch-quarterly.js --all          # all 172 tickers
//   node fetch-quarterly.js NVDA AMD       # specific tickers
//
// Writes data/quarterly/<TICKER>.json

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TICKERS_CSV = path.join(ROOT, "tickers.csv");
const Q_DIR = path.join(ROOT, "data", "quarterly");

// Same OTC list that fails the price API — quarterly will also fail.
const SKIP = new Set([
  "SSNLF","SHECY","SUOPY","SOIGY","AIQUY","AKZOY","LYSDY","VEOEY","SMSMY",
  "ASMIY","BESIY","SBGSY","ABBNY","LNVGY","COMM"
]);

function readTickers() {
  const text = fs.readFileSync(TICKERS_CSV, "utf-8");
  return text.split(/\r?\n/).filter(Boolean).slice(1).map(l => l.split(",")[0]).filter(Boolean);
}

function currencyFor(ticker) {
  // Cheap lookup from tickers.csv row
  const text = fs.readFileSync(TICKERS_CSV, "utf-8");
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(",");
    if (cells[0] === ticker) return cells[3] || "USD";
  }
  return "USD";
}

async function fetchTicker(page, ticker) {
  const url = `https://stockanalysis.com/stocks/${ticker.toLowerCase()}/financials/?p=quarterly`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Wait for the financial table to render
  try {
    await page.waitForSelector("table tr", { timeout: 8000 });
  } catch (e) {
    return { ok: false, reason: "table never appeared" };
  }
  const data = await page.evaluate(() => {
    const tbl = document.querySelector("table");
    if (!tbl) return null;
    const rows = Array.from(tbl.querySelectorAll("tr"));
    const hdrs = rows[0]
      ? Array.from(rows[0].querySelectorAll("th, td")).map(c => c.innerText.trim()).slice(1)
      : [];
    const m = {};
    for (const tr of rows.slice(1)) {
      const cells = Array.from(tr.querySelectorAll("th, td")).map(c => c.innerText.trim());
      const label = cells[0];
      if (label) m[label] = cells.slice(1);
    }
    return {
      hdrs,
      rev: m["Revenue"],
      ni:  m["Net Income"],
      eps: m["EPS (Diluted)"]
    };
  });
  if (!data || !data.rev) return { ok: false, reason: "no Revenue row" };
  const N = Math.min(8, data.hdrs.length, data.rev.length);
  const quarters = [];
  for (let i = 0; i < N; i++) {
    const num = s => {
      if (s == null || s === "" || s === "-") return null;
      const v = Number(String(s).replace(/,/g, ""));
      return isNaN(v) ? null : v;
    };
    quarters.push({
      q: (data.hdrs[i] || "").replace(/\s+/g, "_"),
      revenue_native: num(data.rev[i]),
      net_income_native: num(data.ni && data.ni[i]),
      eps_diluted_native: num(data.eps && data.eps[i]),
    });
  }
  return { ok: true, quarters };
}

async function main() {
  const args = process.argv.slice(2);
  const wantAll = args.includes("--all");
  const explicit = args.filter(a => !a.startsWith("--"));
  const all = readTickers();
  let targets;
  if (explicit.length) {
    targets = explicit;
  } else if (wantAll) {
    targets = all.filter(t => !SKIP.has(t));
  } else {
    targets = all.filter(t => !SKIP.has(t) && !fs.existsSync(path.join(Q_DIR, t + ".json")));
  }
  console.log(`Fetching quarterly data for ${targets.length} ticker(s)...`);

  let pw;
  try { pw = require("playwright"); }
  catch (e) {
    console.error("\n⚠ playwright not installed. Run:\n    npm install playwright\n    npx playwright install chromium\n");
    process.exit(1);
  }

  if (!fs.existsSync(Q_DIR)) fs.mkdirSync(Q_DIR, { recursive: true });

  const browser = await pw.chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 ai-supply-chain quarterly-fetcher" });
  const page = await ctx.newPage();

  const today = new Date().toISOString().slice(0, 10);
  let ok = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    process.stdout.write(`\r  [${i+1}/${targets.length}] ${t.padEnd(8)} `);
    try {
      const r = await fetchTicker(page, t);
      if (r.ok) {
        fs.writeFileSync(path.join(Q_DIR, t + ".json"), JSON.stringify({
          ticker: t,
          currency_native: currencyFor(t),
          units_fetched: "millions",
          quarters: r.quarters,
          as_of: today,
          source: `https://stockanalysis.com/stocks/${t.toLowerCase()}/financials/?p=quarterly`
        }, null, 2) + "\n");
        ok++;
      } else {
        failures.push(`${t}: ${r.reason}`);
        fail++;
      }
    } catch (e) {
      failures.push(`${t}: ${e.message}`);
      fail++;
    }
    await new Promise(res => setTimeout(res, 300)); // gentle rate limit
  }

  await browser.close();
  console.log(`\n\n✓ ${ok} succeeded · ✗ ${fail} failed`);
  if (failures.length && failures.length < 40) failures.forEach(f => console.log("    " + f));
  console.log("\nNext step: npm run build");
}

main().catch(e => { console.error(e); process.exit(1); });
