#!/usr/bin/env node
/**
 * Merge Yahoo holders data into people JSON files.
 *
 * Usage: node merge_holders.js <TICKER> <holders_json_file> [output_dir]
 * holders_json_file should contain the raw `data` array from browser_evaluate.
 */
const fs = require("fs");
const path = require("path");

function parseShares(s) {
  if (s === null || s === undefined || s === "" || s === "N/A") return null;
  s = String(s).trim().replace(/,/g, "");
  const m = s.match(/^([\d.]+)\s*([BMK]?)$/);
  if (!m) {
    const v = parseFloat(s);
    return isNaN(v) ? null : Math.round(v);
  }
  let num = parseFloat(m[1]);
  const suffix = m[2];
  if (suffix === "B") num *= 1_000_000_000;
  else if (suffix === "M") num *= 1_000_000;
  else if (suffix === "K") num *= 1_000;
  return Math.round(num);
}

function parseValue(s) {
  if (s === null || s === undefined || s === "") return null;
  s = String(s).trim().replace(/,/g, "");
  const v = parseFloat(s);
  return isNaN(v) ? null : Math.round(v);
}

function parsePct(s) {
  if (s === null || s === undefined || s === "") return null;
  s = String(s).trim().replace(/%/g, "");
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

function parseHolderTable(rows) {
  if (!rows || rows.length < 2) return [];
  const header = rows[0];
  if (header.length < 5) return [];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 5) continue;
    out.push({
      name: r[0],
      shares: parseShares(r[1]),
      date_reported: r[2],
      pct_outstanding: parsePct(r[3]),
      value_usd: parseValue(r[4]),
    });
  }
  return out;
}

function parseBreakdown(rows) {
  const out = {};
  for (const r of rows) {
    if (r.length >= 2) {
      out[r[1]] = r[0];
    }
  }
  return out;
}

function merge(ticker, tablesData, outputDir) {
  const fp = path.join(outputDir, `${ticker}.json`);
  if (!fs.existsSync(fp)) {
    console.log(`FAIL: ${ticker} - JSON file not found at ${fp}`);
    return false;
  }
  const existing = JSON.parse(fs.readFileSync(fp, "utf-8"));

  if (!tablesData || tablesData.length === 0) {
    console.log(`SKIP: ${ticker} - no tables data`);
    return false;
  }

  let breakdown = null;
  let topHolders = null;
  let topMutualFunds = null;

  for (const tbl of tablesData) {
    if (!tbl || tbl.length === 0) continue;
    const firstRow = tbl[0];
    if (firstRow.length === 1 && /breakdown/i.test(firstRow[0])) {
      breakdown = parseBreakdown(tbl.slice(1));
    } else if (firstRow[0] && firstRow[0].toLowerCase() === "holder") {
      const parsed = parseHolderTable(tbl);
      if (topHolders === null) topHolders = parsed;
      else topMutualFunds = parsed;
    }
  }

  const updates = {};
  if (breakdown && Object.keys(breakdown).length > 0) updates.ownership_breakdown = breakdown;
  if (topHolders && topHolders.length > 0) updates.top_holders = topHolders;
  if (topMutualFunds && topMutualFunds.length > 0) updates.top_mutual_funds = topMutualFunds;

  if (Object.keys(updates).length === 0) {
    console.log(`SKIP: ${ticker} - parsed nothing useful`);
    return false;
  }

  Object.assign(existing, updates);

  const sources = existing.sources || {};
  sources.top_holders = `https://finance.yahoo.com/quote/${ticker}/holders/`;
  existing.sources = sources;
  existing.as_of = "2026-05-13";

  fs.writeFileSync(fp, JSON.stringify(existing, null, 2), "utf-8");

  const nH = topHolders ? topHolders.length : 0;
  const nF = topMutualFunds ? topMutualFunds.length : 0;
  const nB = breakdown ? Object.keys(breakdown).length : 0;
  console.log(`OK: ${ticker} - ${nH} holders, ${nF} funds, ${nB} breakdown fields`);
  return true;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("Usage: merge_holders.js <TICKER> <json_file> [output_dir]");
    process.exit(1);
  }
  const ticker = args[0];
  const jsonPath = args[1];
  const outputDir = args[2] || "C:\\data\\dev\\testprojects\\ai-supply-chain\\data\\people";
  const tablesData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  merge(ticker, tablesData, outputDir);
}
