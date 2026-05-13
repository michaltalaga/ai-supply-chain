// audit-tickers.js — sanity-check every ticker in tickers.csv against
// stockanalysis.com's price history API. Flags failures and groups them
// as "expected" (known unsupported OTC unsponsored ADRs / delisted /
// restructured) vs "surprising" (likely registry typos).
//
// Usage: node audit-tickers.js
// Optional: node audit-tickers.js --suggest    (also try common alt tickers)

const fs = require("fs");
const path = require("path");

const TICKERS_CSV = path.join(__dirname, "tickers.csv");
const BATCH_SIZE = 8;
const BATCH_PAUSE_MS = 400;
const TIMEOUT_MS = 15000;

const SUGGEST = process.argv.includes("--suggest");

// Tickers that legitimately fail because stockanalysis doesn't carry them.
// If you remove one of these from the list below, the audit will flag it as surprising.
const KNOWN_UNSUPPORTED = new Set([
  // OTC unsponsored ADRs — stockanalysis doesn't carry the OTC tier
  "SSNLF","SHECY","SUOPY","SOIGY","AIQUY","AKZOY","LYSDY","VEOEY","SMSMY",
  "ASMIY","BESIY","SBGSY","ABBNY","LNVGY",
  // Restructured / debt-event tickers (JNPR removed 2026-05-13: stockanalysis
  // now returns full history post-HPE-acquisition)
  "COMM",
]);

// For tickers that fail, suggest these alternate symbols if --suggest is set.
const SUGGESTIONS = {
  // ticker -> [candidate alternatives to probe]
  "BWX":   ["BWXT"],
  "AGX":   ["AGX"],
  "J":     ["J"],
  "D":     ["D"],
  // Add more as needed
};

function readTickers() {
  const text = fs.readFileSync(TICKERS_CSV, "utf-8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map(l => {
    // Simple split — exchange + name don't contain bare commas in this dataset
    const cells = l.split(",");
    return {
      ticker: cells[0],
      name: cells[1].replace(/^"|"$/g, ""),
      exchange: cells[2],
    };
  });
}

async function probe(ticker) {
  const url = `https://stockanalysis.com/api/symbol/s/${ticker.toLowerCase()}/history?range=5Y&period=Monthly`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "ai-supply-chain audit/1.0" },
    });
    if (!res.ok) return { ok: false, status: `HTTP ${res.status}`, url };
    const json = await res.json();
    if (!json || !Array.isArray(json.data) || json.data.length === 0) {
      return { ok: false, status: "empty payload", url };
    }
    return { ok: true, count: json.data.length, last: json.data[0]?.t, url };
  } catch (e) {
    return { ok: false, status: e.name === "AbortError" ? "timeout" : e.message, url };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const rows = readTickers();
  console.log(`Auditing ${rows.length} tickers against stockanalysis.com history API...\n`);

  const failed = [];
  const ok = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async row => ({ row, r: await probe(row.ticker) })));
    for (const { row, r } of results) {
      if (r.ok) ok.push({ ...row, ...r });
      else failed.push({ ...row, status: r.status });
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    if (i + BATCH_SIZE < rows.length) await new Promise(res => setTimeout(res, BATCH_PAUSE_MS));
  }
  console.log("\n");

  const expected = failed.filter(f => KNOWN_UNSUPPORTED.has(f.ticker));
  const surprising = failed.filter(f => !KNOWN_UNSUPPORTED.has(f.ticker));

  console.log(`✓ ${ok.length} tickers OK`);
  console.log(`◐ ${expected.length} expected failures (known unsupported on stockanalysis):`);
  expected.forEach(f => console.log(`    ${f.ticker.padEnd(8)} ${(f.name || "").padEnd(40)} ${f.status}`));

  if (surprising.length === 0) {
    console.log(`\n✓ No unexpected failures. Registry is clean.`);
  } else {
    console.log(`\n⚠ ${surprising.length} UNEXPECTED failures (likely registry errors — review!):`);
    for (const f of surprising) {
      console.log(`    ${f.ticker.padEnd(8)} ${(f.name || "").padEnd(40)} ${f.status}`);
    }

    if (SUGGEST) {
      console.log("\nProbing suggested alternates...\n");
      for (const f of surprising) {
        const alts = SUGGESTIONS[f.ticker] || [];
        if (!alts.length) continue;
        for (const alt of alts) {
          if (alt === f.ticker) continue;
          const r = await probe(alt);
          console.log(`    ${f.ticker.padEnd(8)} -> ${alt.padEnd(8)} ${r.ok ? `OK (${r.count} mo)` : `fail (${r.status})`}`);
          await new Promise(res => setTimeout(res, 200));
        }
      }
    } else {
      console.log("\nRe-run with `node audit-tickers.js --suggest` to probe alternate tickers.");
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
