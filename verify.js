// Verify dataset integrity.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const FIN = path.join(ROOT, "data", "financials");
const PRX = path.join(ROOT, "data", "prices");

let badJson = [];
let financialsWithData = 0;
let financialStubs = 0;
let pricesWithData = 0;
let priceStubs = 0;
let totalFinancialYears = 0;
let totalPriceMonths = 0;

for (const f of fs.readdirSync(FIN)) {
  if (!f.endsWith(".json")) continue;
  try {
    const d = JSON.parse(fs.readFileSync(path.join(FIN, f), "utf-8"));
    if (d.status === "no_data") financialStubs++;
    else {
      financialsWithData++;
      totalFinancialYears += (d.fiscal_years || []).length;
    }
  } catch (e) {
    badJson.push(`fin/${f}: ${e.message}`);
  }
}

for (const f of fs.readdirSync(PRX)) {
  if (!f.endsWith(".json")) continue;
  try {
    const d = JSON.parse(fs.readFileSync(path.join(PRX, f), "utf-8"));
    if (d.status === "no_data") priceStubs++;
    else {
      pricesWithData++;
      let months = 0;
      if (Array.isArray(d.monthly_closes)) months = d.monthly_closes.length;
      else if (d.monthly_closes_csv) months = d.monthly_closes_csv.split("|").length;
      totalPriceMonths += months;
    }
  } catch (e) {
    badJson.push(`prx/${f}: ${e.message}`);
  }
}

const finCount = fs.readdirSync(FIN).filter(f => f.endsWith(".json")).length;
const prxCount = fs.readdirSync(PRX).filter(f => f.endsWith(".json")).length;

// Read tickers.csv as ground truth
const tickerLines = fs.readFileSync(path.join(ROOT, "tickers.csv"), "utf-8").split("\n").filter(l => l.length > 0);
const tickerCount = tickerLines.length - 1; // minus header

console.log("=== Dataset verification ===");
console.log(`Registry tickers (tickers.csv): ${tickerCount}`);
console.log(`Financial JSON files: ${finCount} (${financialsWithData} with data + ${financialStubs} stubs)`);
console.log(`Price JSON files: ${prxCount} (${pricesWithData} with data + ${priceStubs} stubs)`);
console.log(`Total fiscal years across all tickers: ${totalFinancialYears}`);
console.log(`Total monthly price points across all tickers: ${totalPriceMonths}`);
console.log(`Avg fiscal years per data-bearing ticker: ${(totalFinancialYears / financialsWithData).toFixed(1)}`);
console.log(`Avg price months per data-bearing ticker: ${(totalPriceMonths / pricesWithData).toFixed(1)}`);
console.log(`JSON parse failures: ${badJson.length}`);
if (badJson.length) badJson.forEach(b => console.log(`  ${b}`));

// Verify CSV row counts match
const finCsv = fs.readFileSync(path.join(ROOT, "financials.csv"), "utf-8").split("\n").filter(l => l.length).length - 1;
const prxCsv = fs.readFileSync(path.join(ROOT, "prices_monthly.csv"), "utf-8").split("\n").filter(l => l.length).length - 1;
console.log(`\nfinancials.csv rows: ${finCsv} (expected ${totalFinancialYears})`);
console.log(`prices_monthly.csv rows: ${prxCsv} (expected ${totalPriceMonths})`);

// Spot-check key tickers
console.log("\n=== Anchor spot-check (latest FY revenue USD) ===");
const anchors = ["NVDA", "MSFT", "TSM", "AMD", "AVGO", "ASML", "AAPL", "AMZN", "GOOGL", "META", "SMCI", "MU", "CEG", "VRT", "COHR", "PLTR", "IONQ"];
const finRows = fs.readFileSync(path.join(ROOT, "financials.csv"), "utf-8").split("\n");
for (const a of anchors) {
  const row = finRows.find(l => l.startsWith(a + ","));
  if (row) {
    const cells = row.split(",");
    const rev = parseInt(cells[6]) || 0;
    const fy = cells[1];
    const fye = cells[2];
    console.log(`${a.padEnd(7)} FY${fy} (${fye}): rev_usd ${(rev/1e9).toFixed(1)}B  -- ${cells[5] === cells[6] ? "USD-native" : "converted"}`);
  } else {
    console.log(`${a.padEnd(7)} -- NOT FOUND`);
  }
}
