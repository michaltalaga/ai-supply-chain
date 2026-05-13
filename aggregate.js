// Aggregate per-ticker JSON files into master CSVs + tickers.json graph.
// Run from project root: node aggregate.js

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const FIN_DIR = path.join(ROOT, "data", "financials");
const PRICE_DIR = path.join(ROOT, "data", "prices");

// Year-end FX rates (1 unit native = X USD)
const FX = {
  USD: { 2021: 1, 2022: 1, 2023: 1, 2024: 1, 2025: 1, 2026: 1 },
  EUR: { 2021: 1.1370, 2022: 1.0666, 2023: 1.1039, 2024: 1.0354, 2025: 1.0463, 2026: 1.05 },
  TWD: { 2021: 0.03612, 2022: 0.03263, 2023: 0.03269, 2024: 0.03050, 2025: 0.03079, 2026: 0.031 },
  JPY: { 2021: 0.00868, 2022: 0.00763, 2023: 0.00709, 2024: 0.00637, 2025: 0.00643, 2026: 0.0065 },
  KRW: { 2021: 0.000843, 2022: 0.000790, 2023: 0.000776, 2024: 0.000680, 2025: 0.000683, 2026: 0.00069 },
  AUD: { 2021: 0.7260, 2022: 0.6810, 2023: 0.6810, 2024: 0.6206, 2025: 0.6213, 2026: 0.63 },
  GBP: { 2021: 1.350, 2022: 1.210, 2023: 1.275, 2024: 1.252, 2025: 1.305, 2026: 1.30 },
  CNY: { 2021: 0.1568, 2022: 0.1450, 2023: 0.1408, 2024: 0.1370, 2025: 0.1390, 2026: 0.140 },
  CHF: { 2021: 1.094, 2022: 1.080, 2023: 1.189, 2024: 1.102, 2025: 1.205, 2026: 1.20 },
};

function fxRate(currency, fy) {
  if (FX[currency] && FX[currency][fy] != null) return FX[currency][fy];
  return null;
}

function unitsMult(units) {
  if (!units) return 1_000_000; // default: assume millions (most stockanalysis tables)
  const u = String(units).toLowerCase();
  if (u.includes("million")) return 1_000_000;
  if (u.includes("thousand")) return 1_000;
  if (u.includes("billion")) return 1_000_000_000;
  return 1;
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function writeCsv(filePath, rows) {
  if (rows.length === 0) {
    fs.writeFileSync(filePath, "");
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map(h => csvEscape(r[h])).join(","));
  }
  fs.writeFileSync(filePath, lines.join("\n") + "\n");
}

function parseCsvLine(line) {
  // Simple parser; handles double-quoted fields with embedded commas
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === ",") { out.push(cur); cur = ""; }
      else if (ch === '"') inQuotes = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf-8");
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ""; });
    return obj;
  });
}

function buildFinancials() {
  const files = fs.readdirSync(FIN_DIR).filter(f => f.endsWith(".json")).sort();
  const rows = [];
  const missing = [];
  for (const f of files) {
    const ticker = f.replace(".json", "");
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(FIN_DIR, f), "utf-8"));
    } catch (e) {
      missing.push({ ticker, reason: `parse_error: ${e.message}` });
      continue;
    }
    if (data.status === "no_data") {
      missing.push({ ticker, reason: data.reason || "no_data" });
      continue;
    }
    const currency = data.currency_native || "USD";
    const mult = unitsMult(data.units_fetched);
    const source = data.source || "";
    for (const fy of (data.fiscal_years || [])) {
      const fy_num = fy.fy;
      const fye = fy.fye || fy.fye_date || "";
      const rev_n = fy.revenue_native;
      const ni_n = fy.net_income_native;
      const eps_n = fy.eps_diluted_native ?? fy.eps_diluted;
      const rev_full = typeof rev_n === "number" ? rev_n * mult : null;
      const ni_full = typeof ni_n === "number" ? ni_n * mult : null;
      const fx = fxRate(currency, fy_num);
      const rev_usd = (rev_full != null && fx != null) ? rev_full * fx : null;
      const ni_usd = (ni_full != null && fx != null) ? ni_full * mult / mult * fx : (ni_full != null && fx != null ? ni_full * fx : null);
      const ni_usd_fix = (ni_full != null && fx != null) ? ni_full * fx : null;
      const eps_usd = (typeof eps_n === "number" && fx != null) ? eps_n * fx : null;
      rows.push({
        ticker,
        fiscal_year: fy_num,
        fiscal_year_end_date: fye,
        currency_native: currency,
        fx_rate_native_to_usd: fx,
        revenue_native_full: rev_full,
        revenue_usd: rev_usd != null ? Math.round(rev_usd) : "",
        net_income_native_full: ni_full,
        net_income_usd: ni_usd_fix != null ? Math.round(ni_usd_fix) : "",
        eps_diluted_native: eps_n,
        eps_diluted_usd: eps_usd != null ? Math.round(eps_usd * 10000) / 10000 : "",
        source_url: source,
      });
    }
  }
  writeCsv(path.join(ROOT, "financials.csv"), rows);
  console.log(`financials.csv: ${rows.length} rows from ${files.length} files`);
  if (missing.length) {
    console.log(`  no_data: ${missing.length}`);
    fs.writeFileSync(path.join(ROOT, "notes", "financials-missing.json"),
      JSON.stringify(missing, null, 2));
  }
  return { rows, missing };
}

function buildPrices() {
  const files = fs.readdirSync(PRICE_DIR).filter(f => f.endsWith(".json")).sort();
  const rows = [];
  const missing = [];
  for (const f of files) {
    const ticker = f.replace(".json", "");
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(PRICE_DIR, f), "utf-8"));
    } catch (e) {
      missing.push({ ticker, reason: `parse_error: ${e.message}` });
      continue;
    }
    if (data.status === "no_data") {
      missing.push({ ticker, reason: data.reason || "no_data" });
      continue;
    }
    const currency = data.currency_native || "USD";
    const source = data.source || "";
    let pairs = [];
    if (Array.isArray(data.monthly_closes)) {
      pairs = data.monthly_closes.map(r => [r.month, r.close, r.partial || false]);
    } else if (typeof data.monthly_closes_csv === "string") {
      pairs = data.monthly_closes_csv.split("|").filter(c => c.includes(":")).map(c => {
        const [m, v] = c.split(":");
        return [m, parseFloat(v), false];
      });
    } else {
      missing.push({ ticker, reason: "no_price_field" });
      continue;
    }
    for (const [month, close, partial] of pairs) {
      if (!month || isNaN(close)) continue;
      const yr = parseInt(month.slice(0, 4), 10);
      const fx = fxRate(currency, yr);
      const close_usd = (currency === "USD" || fx == null) ? close : close * fx;
      rows.push({
        ticker,
        month_end: month,
        close_native: close,
        currency_native: currency,
        fx_rate_native_to_usd: fx ?? "",
        close_usd: close_usd != null ? Math.round(close_usd * 10000) / 10000 : "",
        is_partial_month: partial ? "true" : "",
        source_url: source,
      });
    }
  }
  writeCsv(path.join(ROOT, "prices_monthly.csv"), rows);
  console.log(`prices_monthly.csv: ${rows.length} rows from ${files.length} files`);
  if (missing.length) {
    console.log(`  no_data: ${missing.length}`);
    fs.writeFileSync(path.join(ROOT, "notes", "prices-missing.json"),
      JSON.stringify(missing, null, 2));
  }
  return { rows, missing };
}

function buildTickersJson() {
  const tickers = readCsv(path.join(ROOT, "tickers.csv"));
  const out = { as_of: "2026-05-11", tickers: {} };
  for (const row of tickers) {
    const t = row.ticker;
    out.tickers[t] = {
      name: row.name,
      exchange: row.exchange,
      currency_native: row.currency_native,
      segment: row.segment,
      tier: row.tier,
      role_in_chain: row.role_in_chain,
      key_upstream: (row.key_upstream || "").split(";").map(s => s.trim()).filter(s => s),
      key_downstream: (row.key_downstream || "").split(";").map(s => s.trim()).filter(s => s),
      notes: row.notes,
    };
  }
  fs.writeFileSync(path.join(ROOT, "data", "tickers.json"),
    JSON.stringify(out, null, 2));
  console.log(`data/tickers.json: ${Object.keys(out.tickers).length} tickers`);
  return out;
}

function crossRefCheck(tickersJson) {
  const universe = new Set(Object.keys(tickersJson.tickers));
  const dangling = {};
  for (const [t, info] of Object.entries(tickersJson.tickers)) {
    for (const dir of ["key_upstream", "key_downstream"]) {
      for (const ref of info[dir]) {
        if (ref && !universe.has(ref)) {
          if (!dangling[ref]) dangling[ref] = [];
          dangling[ref].push(`${t}.${dir}`);
        }
      }
    }
  }
  return dangling;
}

// Run
const tj = buildTickersJson();
const fin = buildFinancials();
const pr = buildPrices();
const dangling = crossRefCheck(tj);
console.log("\n=== VERIFICATION ===");
console.log(`Tickers: ${Object.keys(tj.tickers).length}`);
console.log(`Financials: ${fin.rows.length} rows`);
console.log(`Prices: ${pr.rows.length} rows`);
console.log(`Financials no_data: ${fin.missing.length}`);
console.log(`Prices no_data: ${pr.missing.length}`);
console.log(`Dangling refs: ${Object.keys(dangling).length}`);
if (Object.keys(dangling).length) {
  fs.writeFileSync(path.join(ROOT, "notes", "dangling-refs.json"),
    JSON.stringify(dangling, null, 2));
  console.log("  See notes/dangling-refs.json");
}
