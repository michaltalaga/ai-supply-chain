// Build a single-file interactive viewer.html with all data embedded.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const tickers = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "tickers.json"), "utf-8"));
const relPath = path.join(ROOT, "data", "relationships.json");
const relationships = fs.existsSync(relPath)
  ? JSON.parse(fs.readFileSync(relPath, "utf-8"))
  : { edges: {} };
const ghostPath = path.join(ROOT, "data", "ghost-nodes.json");
const ghosts = fs.existsSync(ghostPath)
  ? JSON.parse(fs.readFileSync(ghostPath, "utf-8"))
  : { ghosts: {}, edges: {} };

// Year-end FX rates for converting non-USD market caps (1 native = X USD)
const FX = {
  USD: 1, EUR: 1.05, TWD: 0.031, JPY: 0.0065, KRW: 0.00069,
  AUD: 0.63, GBP: 1.30, CNY: 0.140, CHF: 1.20
};

// Compute approximate market cap (USD, millions).
// shares (millions) = |net_income / EPS|; mcap = shares * latest_close.
// For ADRs where EPS is per-ADR and price is per-ADR (Yahoo/SAa convention) this works directly.
// For OTC unsponsored where EPS is per-ordinary in native currency but price is in foreign units —
// applied a coarse FX adjustment using the company's reporting currency.
function computeMcap(fd, lastPrice) {
  if (!fd || !fd.fiscal_years || !fd.fiscal_years.length) return null;
  if (!lastPrice) return null;
  const latest = fd.fiscal_years[0];
  const ni = latest.net_income_native;
  const eps = latest.eps_diluted_native ?? latest.eps_diluted;
  if (typeof ni !== "number" || typeof eps !== "number" || eps === 0) return null;
  const sharesMillions = Math.abs(ni / eps);
  const ccy = fd.currency_native || "USD";
  // For US-listed (price USD, EPS USD), no FX. For ADRs with EPS in native:
  // price is USD-per-ADR, EPS is native-per-ADR. shares are ADR count. So mcap = shares * USD price = USD.
  // The native currency cancels in the shares calc. So no FX needed in the typical case.
  // For unsponsored OTC where price may not reflect ADR ratio cleanly, mcap is rough.
  return sharesMillions * lastPrice;
}

// Embed per-ticker financials + prices summary (compact form to keep HTML reasonable)
const QUARTERLY_DIR = path.join(ROOT, "data", "quarterly");
const embedded = {};
for (const t of Object.keys(tickers.tickers)) {
  const fin = path.join(ROOT, "data", "financials", t + ".json");
  const prx = path.join(ROOT, "data", "prices", t + ".json");
  const qf = path.join(QUARTERLY_DIR, t + ".json");
  let f = null, p = null, q = null, lastPrice = null, fd = null;
  if (fs.existsSync(qf)) {
    try {
      const qd = JSON.parse(fs.readFileSync(qf, "utf-8"));
      if (qd.quarters && qd.quarters.length) {
        q = qd.quarters.map(x => ({
          q: x.q,
          rev: x.revenue_native,
          ni: x.net_income_native,
          eps: x.eps_diluted_native ?? x.eps_diluted
        }));
      }
    } catch (e) {}
  }
  if (fs.existsSync(fin)) {
    try {
      fd = JSON.parse(fs.readFileSync(fin, "utf-8"));
      if (fd.status !== "no_data") {
        f = {
          ccy: fd.currency_native,
          yr: (fd.fiscal_years || []).map(x => ({
            fy: x.fy, fye: x.fye || x.fye_date,
            rev: x.revenue_native, ni: x.net_income_native, eps: x.eps_diluted_native ?? x.eps_diluted
          }))
        };
      }
    } catch (e) {}
  }
  if (fs.existsSync(prx)) {
    try {
      const pd = JSON.parse(fs.readFileSync(prx, "utf-8"));
      if (pd.status !== "no_data") {
        let pairs = [];
        if (Array.isArray(pd.monthly_closes)) {
          pairs = pd.monthly_closes.map(r => [r.month, r.close]);
        } else if (pd.monthly_closes_csv) {
          pairs = pd.monthly_closes_csv.split("|").filter(c => c.includes(":")).map(c => {
            const [m, v] = c.split(":");
            return [m, parseFloat(v)];
          });
        }
        p = pairs;
        if (pairs.length) lastPrice = pairs[pairs.length - 1][1];
      }
    } catch (e) {}
  }
  const mcap = computeMcap(fd, lastPrice);
  embedded[t] = { f, p, q, mcap, info: tickers.tickers[t] };
}

const mcaps = Object.values(embedded).map(e => e.mcap).filter(m => m && m > 0);
const maxMcap = Math.max(...mcaps);
console.log(`Mcap range: ${(Math.min(...mcaps)/1e3).toFixed(2)}B - ${(maxMcap/1e6).toFixed(2)}T (across ${mcaps.length} tickers)`);

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<title>AI Supply Chain Explorer</title>
<style>
  body { font: 14px/1.4 -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background: #0e1116; color: #e3e7ed; }
  #app { display: grid; grid-template-columns: 1fr 420px; height: 100vh; }
  #graph { background: #0a0d12; }
  #side { padding: 20px; overflow-y: auto; border-left: 1px solid #2a2f38; display: flex; flex-direction: column; min-height: 100vh; }
  #detail { flex: 1; }
  #footer-meta { margin-top: 24px; padding-top: 12px; border-top: 1px solid #2a2f38; font-size: 11px; color: #7a8395; }
  #footer-meta h1 { font-size: 12px; color: #97a3b6; margin: 0 0 4px; padding: 0; border: 0; }
  #footer-meta p { margin: 4px 0; }
  h1 { font-size: 16px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid #2a2f38; }
  h2 { font-size: 13px; margin: 16px 0 6px; color: #8ab4f8; }
  .meta { color: #97a3b6; font-size: 12px; }
  .pill { display: inline-block; background: #1d2129; color: #8ab4f8; padding: 1px 7px; border-radius: 10px; font-size: 11px; margin-right: 4px; margin-bottom: 4px; }
  .pill-link { cursor: pointer; }
  .pill-link:hover { background: #2a3a55; }
  .pill-extern { color: #97a3b6; background: #15171c; }
  #tip { position: fixed; max-width: 360px; background: #1d2129; border: 1px solid #3a4150;
         border-radius: 6px; padding: 10px 12px; font-size: 12px; line-height: 1.45;
         pointer-events: none; display: none; z-index: 100; box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
  #tip .tip-head { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
  #tip .tip-from { color: #4ec9b0; }
  #tip .tip-to { color: #ff8c42; }
  #tip .tip-arrow { color: #97a3b6; margin: 0 6px; }
  #tip .tip-row { margin: 3px 0; }
  #tip .tip-label { color: #97a3b6; display: inline-block; min-width: 80px; }
  #tip .tip-tag { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 10.5px; font-weight: 600; }
  #tip .tag-critical { background: #5c1a22; color: #f08080; }
  #tip .tag-major    { background: #4a3a14; color: #e6b450; }
  #tip .tag-meaningful { background: #1a3a4a; color: #67b5d8; }
  #tip .tag-tangential { background: #2a2f38; color: #97a3b6; }
  #tip .tag-risk-high   { background: #5c1a22; color: #f08080; }
  #tip .tag-risk-medium { background: #4a3a14; color: #e6b450; }
  #tip .tag-risk-low    { background: #1a4a2e; color: #80e080; }
  #tip .tag-risk-none   { background: #2a2f38; color: #97a3b6; }
  #tip .tip-section { color: #c5cad3; font-size: 11.5px; margin-top: 6px; }
  #tip .tip-event { color: #8ab4f8; font-size: 11.5px; margin-top: 6px; font-style: italic; }
  #tip .tip-basis { color: #7a8395; font-size: 11px; margin-top: 6px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; margin: 4px 0; }
  th { text-align: right; padding: 4px 8px; color: #97a3b6; font-weight: 500; border-bottom: 1px solid #2a2f38; }
  td { text-align: right; padding: 3px 8px; border-bottom: 1px solid #1d2129; }
  td:first-child, th:first-child { text-align: left; }
  .neg { color: #f08080; }
  .pos { color: #80e080; }
  #controls { padding: 10px 12px; border-bottom: 1px solid #2a2f38; background: #0a0d12; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  #controls > * { flex-shrink: 0; }
  #screen-toggle { background: #1d2129; color: #97a3b6; border: 1px solid #2a2f38; padding: 4px 10px; border-radius: 4px; cursor: pointer; font: inherit; }
  #screen-toggle.active, #screen-toggle:hover { color: #8ab4f8; border-color: #3a4150; }
  #screen-panel { display: none; padding: 10px 12px; border-bottom: 1px solid #2a2f38; background: #0a0d12; font-size: 12px; color: #97a3b6; }
  #screen-panel.open { display: block; }
  #screen-panel label { display: inline-block; margin-right: 14px; margin-bottom: 4px; }
  #screen-panel input[type=number] { width: 70px; padding: 2px 6px; }
  #screen-status { color: #7a8395; margin-left: 10px; }
  .preset-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #2a2f38; }
  .preset-row-label { color: #7a8395; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px; }
  .preset-chip { display: inline-flex; align-items: center; gap: 4px; background: #1d2129; color: #c5cad3; padding: 5px 12px; border-radius: 16px; border: 1px solid #2a3a4a; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.12s; user-select: none; }
  .preset-chip::before { content: "›"; color: #67b5d8; font-weight: 700; }
  .preset-chip:hover { background: #2a3a55; border-color: #4a6a90; color: #ffffff; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(74, 106, 144, 0.25); }
  .preset-chip:active { transform: translateY(0); box-shadow: none; }
  .preset-chip.active { background: #1a3a55; border-color: #67b5d8; color: #b1ceff; }
  .preset-chip.active::before { content: "✓"; color: #80e080; }
  .preset-sep { display: inline-block; width: 1px; height: 18px; background: #2a3a4a; margin: 0 2px; }
  #minimap-wrap { position: absolute; bottom: 16px; right: 16px; width: 200px; height: 110px; background: rgba(13,16,22,0.85); border: 1px solid #2a3a4a; border-radius: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.5); cursor: crosshair; z-index: 30; }
  #minimap { width: 100%; height: 100%; display: block; }
  #compare-bin { position: fixed; bottom: 16px; left: 16px; max-width: calc(100vw - 460px); background: #1d2129; border: 1px solid #3a4150; border-radius: 6px; padding: 10px 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.4); display: none; z-index: 50; font-size: 13px; }
  #compare-bin.open { display: block; }
  #compare-bin .bin-head { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
  #compare-bin .bin-pills { display: flex; flex-wrap: wrap; gap: 4px; max-width: 60ch; }
  #compare-bin .bin-pill { background: #15171c; color: #8ab4f8; padding: 2px 8px; border-radius: 10px; cursor: pointer; font-size: 11px; }
  #compare-bin .bin-pill:hover { background: #2a3a55; }
  #compare-bin button { background: #1a3a4a; color: #67b5d8; border: 1px solid #2a4a5a; padding: 4px 10px; border-radius: 4px; cursor: pointer; font: inherit; font-size: 12px; }
  #compare-bin button:hover { background: #2a4a5a; color: #b1ceff; }
  #compare-bin button.clear { background: transparent; color: #97a3b6; border-color: #2a2f38; }
  input, select { background: #1d2129; color: #e3e7ed; border: 1px solid #2a2f38; padding: 4px 8px; border-radius: 4px; font: inherit; }
  .legend { font-size: 11px; padding: 8px 12px; background: #0a0d12; border-top: 1px solid #2a2f38; }
  .legend span { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
  #sparkbox { background: #1d2129; padding: 8px; border-radius: 4px; margin-top: 8px; }
  a { color: #8ab4f8; }
  .gf-link { color: #8ab4f8; text-decoration: none; border-bottom: 1px dashed #3a4150; }
  .gf-link:hover { color: #b1ceff; border-bottom-color: #8ab4f8; }
  .gf-link .gf-arrow { font-size: 0.75em; opacity: 0.7; margin-left: 2px; }
  .gf-link:hover .gf-arrow { opacity: 1; }
</style>
</head>
<body>
<div id="app">
  <div>
    <div id="controls">
      <input id="search" placeholder="search ticker or name..." style="width: 260px">
      <select id="filter">
        <option value="">All segments</option>
      </select>
      <button id="screen-toggle" onclick="toggleScreenPanel()">Screen ▾</button>
      <button id="ew-toggle" onclick="toggleEdgeWeight()">Edges: uniform</button>
      <button onclick="showTierDashboard()" title="Tier-level aggregates (total mcap, weighted CAGR, etc.)">Tier dashboard</button>
      <button onclick="clearSelection(); document.getElementById('search').value=''; resetView()">Reset</button>
      <span id="screen-status"></span>
    </div>
    <div id="screen-panel">
      <div class="preset-row">
        <span class="preset-row-label">One-click screens</span>
        <button class="preset-chip" data-preset="cheap"      onclick="applyPreset('cheap')"      title="P/E &lt; 15">Cheap</button>
        <button class="preset-chip" data-preset="expensive"  onclick="applyPreset('expensive')"  title="P/E &gt; 40">Expensive</button>
        <button class="preset-chip" data-preset="garp"       onclick="applyPreset('garp')"       title="PEG &lt; 1 + 5yr CAGR &gt; 10%">Growth at value</button>
        <button class="preset-chip" data-preset="hidden"     onclick="applyPreset('hidden')"     title="CAGR &gt; 25% + P/E &lt; 25 + mcap &gt; $5B">Hidden gems</button>
        <span class="preset-sep"></span>
        <button class="preset-chip" data-preset="quality"    onclick="applyPreset('quality')"    title="Net margin &gt; 25% + P/E &lt; 30">Quality</button>
        <button class="preset-chip" data-preset="cashcows"   onclick="applyPreset('cashcows')"   title="Net margin &gt; 25% + 5yr CAGR &lt; 10% — mature profitable">Cash cows</button>
        <button class="preset-chip" data-preset="losers"     onclick="applyPreset('losers')"     title="Net margin &lt; 0 — pre-revenue / growth-at-any-cost">Money-losers</button>
        <span class="preset-sep"></span>
        <button class="preset-chip" data-preset="bubble"     onclick="applyPreset('bubble')"     title="Decoupling &gt; 15× — price way ahead of fundamentals">Decoupled</button>
        <button class="preset-chip" data-preset="aiwinners"  onclick="applyPreset('aiwinners')"  title="YTD &gt; 40% + mcap &gt; $10B — what's running this year">AI winners YTD</button>
        <button class="preset-chip" data-preset="big_losers" onclick="applyPreset('big_losers')" title="YTD &lt; -20% — out-of-favor names">Big losers YTD</button>
        <span class="preset-sep"></span>
        <button class="preset-chip" data-preset="megacap"    onclick="applyPreset('megacap')"    title="mcap &gt; $500B">Mega-caps</button>
        <button class="preset-chip" data-preset="smallcap"   onclick="applyPreset('smallcap')"   title="mcap &lt; $5B + 5yr CAGR &gt; 15%">Small-cap growers</button>
        <button class="preset-chip" data-preset="power"      onclick="applyPreset('power')"      title="tier D2 (Power / Utilities / Cooling / REIT) + mcap &gt; $5B">Power play</button>
        <button class="preset-chip" data-preset="quantum"    onclick="applyPreset('quantum')"    title="tier Q — quantum pure-plays + Honeywell">Quantum</button>
      </div>
      <label>Mcap $B: <input type="number" id="f-minMcap" min="0" step="1" placeholder="min" style="width:55px"> – <input type="number" id="f-maxMcap" step="1" placeholder="max" style="width:55px"></label>
      <label>5yr CAGR %: <input type="number" id="f-minCagr" step="5" placeholder="min" style="width:55px"> – <input type="number" id="f-maxCagr" step="5" placeholder="max" style="width:55px"></label>
      <label>5yr return %: <input type="number" id="f-minRet" step="50" placeholder="min" style="width:55px"> – <input type="number" id="f-maxRet" step="50" placeholder="max" style="width:55px"></label>
      <label>YTD %: <input type="number" id="f-minYtd" step="5" placeholder="min" style="width:55px"> – <input type="number" id="f-maxYtd" step="5" placeholder="max" style="width:55px"></label>
      <label>P/E: <input type="number" id="f-minPe" step="5" placeholder="min" style="width:55px"> – <input type="number" id="f-maxPe" step="5" placeholder="max" style="width:55px"></label>
      <label>P/S: <input type="number" id="f-minPs" step="2" placeholder="min" style="width:55px"> – <input type="number" id="f-maxPs" step="2" placeholder="max" style="width:55px"></label>
      <label>PEG: <input type="number" id="f-minPeg" step="0.5" placeholder="min" style="width:55px"> – <input type="number" id="f-maxPeg" step="0.5" placeholder="max" style="width:55px"></label>
      <label>Net margin %: <input type="number" id="f-minNm" step="5" placeholder="min" style="width:55px"> – <input type="number" id="f-maxNm" step="5" placeholder="max" style="width:55px"></label>
      <label>Decoupling ×: <input type="number" id="f-minDcp" step="1" placeholder="min" style="width:55px"> – <input type="number" id="f-maxDcp" step="1" placeholder="max" style="width:55px"></label>
      <label>Tier:
        <select id="f-tier">
          <option value="">any</option>
          <option value="U5">U5 Mining</option>
          <option value="U4">U4 Gases/Wafers</option>
          <option value="U3">U3 WFE/EDA</option>
          <option value="U2">U2 Foundry/Memory</option>
          <option value="U1">U1 Chips/Photonics</option>
          <option value="AI core">AI server</option>
          <option value="D1">D1 Hyperscalers/SW</option>
          <option value="D2">D2 Power/Cooling/REIT</option>
          <option value="D3">D3 EPC/Fiber</option>
          <option value="D4">D4 Waste</option>
          <option value="Q">Q Quantum</option>
        </select>
      </label>
      &nbsp;<button onclick="applyScreen()">Apply</button>
      <button class="clear" onclick="clearScreen()">Clear screen</button>
    </div>
    <div id="graph" style="height: calc(100vh - 84px); position: relative">
      <div id="minimap-wrap" title="Click to center main view here">
        <svg id="minimap" viewBox="0 0 200 110"></svg>
      </div>
    </div>
    <div class="legend" id="legend"></div>
  </div>
  <div id="tip"></div>
  <div id="compare-bin">
    <div class="bin-head">
      <strong style="color:#8ab4f8">Compare</strong>
      <div class="bin-pills" id="bin-pills"></div>
      <button onclick="openCompare()">Open</button>
      <button class="clear" onclick="clearCompare()">Clear</button>
    </div>
    <div style="color:#7a8395; font-size:11px">Shift-click a ticker to add it · max 5</div>
  </div>
  <div id="side">
    <div id="detail"><p class="meta"><em>Hover a ticker for a quick view, click for the full detail panel. Hover an edge for relationship context.</em></p></div>
    <div id="footer-meta">
      <h1>AI / Quantum / Photonics Supply Chain</h1>
      <p>Click a node to inspect. Drag to pan, scroll to zoom.</p>
      <p>Data as of 2026-05-11. <a href="report.html">Full narrative report</a> &middot; <a href="tickers.csv">tickers.csv</a> &middot; <a href="financials.csv">financials.csv</a> &middot; <a href="prices_monthly.csv">prices_monthly.csv</a></p>
      <p><a href="https://github.com/michaltalaga/ai-supply-chain" target="_blank" rel="noopener">github.com/michaltalaga/ai-supply-chain</a></p>
    </div>
  </div>
</div>

<script>
const DATA = ${JSON.stringify(embedded)};
const RELATIONSHIPS = ${JSON.stringify(relationships)};
const GHOSTS = ${JSON.stringify(ghosts)};
const tierColor = {
  "U5": "#a5673f", "U4": "#bf8a3e", "U3": "#c9b449", "U2": "#a7c44a",
  "U1": "#4ec9b0", "AI core": "#ff8c42",
  "D1": "#5b9bd5", "D2": "#9b8ce8", "D3": "#c97acc", "D4": "#7a8ba0",
  "Q": "#e25972"
};
const tierLabel = {
  "U5": "Mining", "U4": "Gases/Wafers", "U3": "WFE/EDA", "U2": "Foundry/Memory",
  "U1": "Chips/Photonics", "AI core": "AI Servers",
  "D1": "Hyperscalers/SW", "D2": "Power/Cooling/REIT", "D3": "EPC/Fiber", "D4": "Waste",
  "Q": "Quantum"
};

function fmtUsd(v) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e6) return "$" + (v/1e6).toFixed(1) + "T";  // millions input ⇒ T
  if (Math.abs(v) >= 1e3) return "$" + (v/1e3).toFixed(1) + "B";  // millions input ⇒ B
  if (Math.abs(v) >= 1) return "$" + v.toFixed(0) + "M";
  return "$" + (v*1000).toFixed(0) + "K";
}

// Populate filter dropdown
const segments = new Set();
for (const t in DATA) segments.add(DATA[t].info.segment);
const filterEl = document.getElementById("filter");
for (const s of [...segments].sort()) {
  const o = document.createElement("option");
  o.value = s; o.textContent = s;
  filterEl.appendChild(o);
}

// Legend
const legendEl = document.getElementById("legend");
let legendHtml = '';
for (const t in tierColor) {
  legendHtml += '<span style="background:'+tierColor[t]+'"></span>'+tierLabel[t]+' &nbsp; ';
}
legendHtml += '<span style="color:#7a8395">&nbsp; | &nbsp; arrow points supplier → customer ($ flows opposite) &nbsp; · &nbsp; dot size ∝ √mcap &nbsp; · &nbsp; edge width = uniform OR ∝ √($/yr) when toggled</span>';
legendEl.innerHTML = legendHtml;

// Build node + link arrays
function buildGraph(filter) {
  const nodes = [];
  const links = [];
  const seen = new Set();
  for (const t in DATA) {
    const info = DATA[t].info;
    if (filter && info.segment !== filter) continue;
    nodes.push({
      id: t,
      name: info.name,
      tier: info.tier,
      segment: info.segment,
      color: tierColor[info.tier] || "#888",
      isGhost: false,
    });
    seen.add(t);
  }
  // Include ghost nodes (private / foreign-only) as small grey circles.
  // Only include a ghost if at least one of its edges has both endpoints visible.
  const ghostEdges = (GHOSTS && GHOSTS.edges) || {};
  const ghostNodesDef = (GHOSTS && GHOSTS.ghosts) || {};
  const referencedGhosts = new Set();
  for (const key in ghostEdges) {
    const [src, dst] = key.split("->");
    if ((seen.has(src) || ghostNodesDef[src]) && (seen.has(dst) || ghostNodesDef[dst])) {
      if (ghostNodesDef[src]) referencedGhosts.add(src);
      if (ghostNodesDef[dst]) referencedGhosts.add(dst);
    }
  }
  for (const gid of referencedGhosts) {
    const g = ghostNodesDef[gid];
    nodes.push({
      id: gid,
      name: g.name,
      tier: g.tier,
      segment: g.segment,
      color: "#555a66",
      isGhost: true,
      kind: g.kind,
      where: g.where,
      role: g.role,
    });
    seen.add(gid);
  }
  // Walk both key_upstream (u -> t) and key_downstream (t -> d). Dedupe by
  // "source->target" so an edge declared on both sides only appears once.
  const linkSet = new Set();
  for (const t in DATA) {
    if (filter && DATA[t].info.segment !== filter) continue;
    const info = DATA[t].info;
    for (const u of info.key_upstream || []) {
      if (!DATA[u]) continue;
      if (filter && !seen.has(u)) continue;
      const k = u + "->" + t;
      if (!linkSet.has(k)) { linkSet.add(k); links.push({ source: u, target: t }); }
    }
    for (const d of info.key_downstream || []) {
      if (!DATA[d]) continue;
      if (filter && !seen.has(d)) continue;
      const k = t + "->" + d;
      if (!linkSet.has(k)) { linkSet.add(k); links.push({ source: t, target: d }); }
    }
  }
  // Add ghost edges (registered → ghost, ghost → registered) where both endpoints rendered.
  for (const key in ghostEdges) {
    const [src, dst] = key.split("->");
    if (!seen.has(src) || !seen.has(dst)) continue;
    if (!linkSet.has(key)) { linkSet.add(key); links.push({ source: src, target: dst, isGhost: true }); }
  }
  return { nodes, links };
}

// Render with D3-ish manual force layout (no external deps)
const canvas = document.getElementById("graph");
const width = canvas.clientWidth;
const height = canvas.clientHeight;
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("viewBox", "0 0 "+width+" "+height);
svg.style.width = "100%"; svg.style.height = "100%";
canvas.appendChild(svg);

// Defs: two arrow markers (dim + highlighted)
const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
function makeMarker(id, color) {
  const m = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  m.setAttribute("id", id);
  m.setAttribute("viewBox", "0 0 10 10");
  m.setAttribute("refX", "10");
  m.setAttribute("refY", "5");
  // markerUnits="userSpaceOnUse" detaches arrow size from stroke-width, so
  // dim 0.6-stroke edges and highlighted 1.4-stroke edges get the same arrow.
  m.setAttribute("markerUnits", "userSpaceOnUse");
  m.setAttribute("markerWidth", "14");
  m.setAttribute("markerHeight", "14");
  m.setAttribute("orient", "auto-start-reverse");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", "M0,0 L10,5 L0,10 z");
  p.setAttribute("fill", color);
  m.appendChild(p);
  defs.appendChild(m);
}
makeMarker("arrow-dim",  "#3a4150");
makeMarker("arrow-hi",   "#8ab4f8");
makeMarker("arrow-faint", "#1d2129");
svg.appendChild(defs);

const linkG = document.createElementNS("http://www.w3.org/2000/svg", "g"); svg.appendChild(linkG);
const nodeG = document.createElementNS("http://www.w3.org/2000/svg", "g"); svg.appendChild(nodeG);

// Market-cap → dot radius. Area-proportional (radius ∝ √mcap) so the visual
// area roughly tracks size. Clamped to [3.5, 18] for layout stability.
function nodeRadius(ticker) {
  const d = DATA[ticker];
  if (!d || !d.mcap || d.mcap <= 0) return 5;
  const refMcap = 4_000_000;     // ~ $4T mcap reference (≈ NVDA peak)
  const maxR = 18, minR = 3.5;
  const r = Math.sqrt(d.mcap / refMcap) * maxR;
  return Math.max(minR, Math.min(maxR, r));
}

let viewState = { tx: 0, ty: 0, k: 1 };
function applyViewport() {
  linkG.setAttribute("transform", \`translate(\${viewState.tx} \${viewState.ty}) scale(\${viewState.k})\`);
  nodeG.setAttribute("transform", \`translate(\${viewState.tx} \${viewState.ty}) scale(\${viewState.k})\`);
  if (typeof updateMinimapViewport === "function") updateMinimapViewport();
}
svg.addEventListener("wheel", e => {
  e.preventDefault();
  const delta = -e.deltaY * 0.0015;
  const newK = Math.max(0.2, Math.min(4, viewState.k * (1 + delta)));
  const rect = svg.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  viewState.tx = mx - (mx - viewState.tx) * (newK / viewState.k);
  viewState.ty = my - (my - viewState.ty) * (newK / viewState.k);
  viewState.k = newK;
  applyViewport();
});
let dragStart = null;
let didDrag = false;          // distinguishes a true click from a drag-then-release
const DRAG_THRESHOLD = 3;     // px before we consider it a drag

svg.addEventListener("mousedown", e => {
  dragStart = { x: e.clientX, y: e.clientY, tx: viewState.tx, ty: viewState.ty };
  didDrag = false;
});
svg.addEventListener("mouseup", () => { dragStart = null; });
svg.addEventListener("mouseleave", () => { dragStart = null; });
svg.addEventListener("mousemove", e => {
  if (!dragStart) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if (!didDrag && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) didDrag = true;
  viewState.tx = dragStart.tx + dx;
  viewState.ty = dragStart.ty + dy;
  applyViewport();
});
function resetView() {
  viewState = { tx: 0, ty: 0, k: 1 };
  applyViewport();
  draw();
}

// Layout: tier columns
let renderState = { nodeEls: {}, linkEls: [] }; // {id: {g, circle, text}} + [{path, source, target}]
let highlightSet = null; // null = no highlight; otherwise Set of ticker ids to show
let selectedTicker = null;

function draw(filter) {
  const { nodes, links } = buildGraph(filter);
  const tiers = ["U5","U4","U3","U2","U1","AI core","D1","D2","D3","D4","Q"];
  const byTier = {};
  for (const n of nodes) {
    if (!byTier[n.tier]) byTier[n.tier] = [];
    byTier[n.tier].push(n);
  }
  const colW = width / (tiers.length + 1);
  const nodeMap = {};
  for (const n of nodes) nodeMap[n.id] = n;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const list = byTier[t] || [];
    list.sort((a,b) => a.id.localeCompare(b.id));
    for (let j = 0; j < list.length; j++) {
      list[j].x = colW * (i + 1);
      list[j].y = 60 + (height - 120) * (j / Math.max(1, list.length - 1));
    }
  }

  // Reset render state
  renderState = { nodeEls: {}, linkEls: [] };
  linkG.innerHTML = "";
  nodeG.innerHTML = "";

  // Pre-compute node radii so we can trim links to the target circle's edge
  for (const n of nodes) n.radius = n.isGhost ? 4 : nodeRadius(n.id);

  // Render links (supplier → customer, with arrow at customer end)
  for (const l of links) {
    const s = nodeMap[l.source]; const t = nodeMap[l.target];
    if (!s || !t) continue;
    // Path: cubic Bezier with horizontal control handles at midpoint
    const mid = (s.x + t.x) / 2;
    // Trim end short of target circle so arrowhead sits on edge of circle, not inside
    const dx = t.x - s.x, dy = t.y - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    const gap = t.radius + 9; // leave room for the (larger) arrowhead
    const tx2 = t.x - (dx / dist) * gap;
    const ty2 = t.y - (dy / dist) * gap;
    // And trim start so it doesn't cover source's label
    const gapS = s.radius + 1;
    const sx2 = s.x + (dx / dist) * gapS;
    const sy2 = s.y + (dy / dist) * gapS;
    const d = \`M\${sx2},\${sy2} C\${mid},\${sy2} \${mid},\${ty2} \${tx2},\${ty2}\`;

    // Visible thin line with arrow at target end
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", d);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#3a4150");
    line.setAttribute("stroke-width", "0.6");
    line.setAttribute("opacity", "0.55");
    line.setAttribute("pointer-events", "none");
    line.setAttribute("marker-end", "url(#arrow-dim)");
    linkG.appendChild(line);

    // Invisible thick hit area for hovering
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hit.setAttribute("d", d);
    hit.setAttribute("fill", "none");
    hit.setAttribute("stroke", "transparent");
    hit.setAttribute("stroke-width", "10");
    hit.style.cursor = "help";
    hit.addEventListener("mouseenter", e => showEdgeTip(l.source, l.target, e));
    hit.addEventListener("mousemove", e => moveTip(e));
    hit.addEventListener("mouseleave", () => hideTip());
    linkG.appendChild(hit);
    renderState.linkEls.push({ el: line, hit, source: l.source, target: l.target });
  }

  // Render nodes (radius reflects market cap; ghosts are small + grey)
  for (const n of nodes) {
    const r = n.radius;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", \`translate(\${n.x} \${n.y})\`);
    g.style.cursor = n.isGhost ? "help" : "pointer";
    g.style.transition = "opacity 0.15s";
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", r.toFixed(2));
    c.setAttribute("fill", n.color);
    c.setAttribute("stroke", n.isGhost ? "#3a4150" : "#fff");
    c.setAttribute("stroke-width", n.isGhost ? "0.8" : "0.5");
    if (n.isGhost) c.setAttribute("stroke-dasharray", "1.5,1.5");
    g.appendChild(c);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", (r + 3).toFixed(1));
    txt.setAttribute("y", "3");
    txt.setAttribute("fill", n.isGhost ? "#7a8395" : "#e3e7ed");
    txt.setAttribute("font-size", n.isGhost ? "9" : "10");
    txt.setAttribute("font-style", n.isGhost ? "italic" : "normal");
    txt.textContent = n.isGhost ? n.name.replace(/ (Inc|Corp|Ltd|Corporation|PBC|GmbH|Oy|Group)\.?$/, "") : n.id;
    g.appendChild(txt);
    const baseR = r;
    g.addEventListener("click", e => {
      e.stopPropagation();
      if (n.isGhost) return;
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        toggleCompare(n.id);
      } else {
        selectTicker(n.id);
      }
    });
    g.addEventListener("mouseenter", e => {
      c.setAttribute("r", (baseR + 3).toFixed(2));
      if (n.isGhost) showGhostTip(n, e); else showNodeTip(n.id, e);
    });
    g.addEventListener("mousemove", e => moveTip(e));
    g.addEventListener("mouseleave", () => {
      c.setAttribute("r", baseR.toFixed(2));
      hideTip();
    });
    nodeG.appendChild(g);
    renderState.nodeEls[n.id] = { g, circle: c, text: txt, color: n.color, baseR, isGhost: n.isGhost };
  }
  // Re-apply current highlight after redraw
  applyHighlight();
  // Refresh minimap to mirror current node positions
  renderMinimap(nodes);
}

// === Mini-map ===
let minimapNodes = [];   // last set of nodes drawn on the main graph
function renderMinimap(nodes) {
  minimapNodes = nodes;
  const mm = document.getElementById("minimap");
  if (!mm) return;
  const MW = 200, MH = 110;
  const sx = MW / width, sy = MH / height;
  let s = '<rect x="0" y="0" width="'+MW+'" height="'+MH+'" fill="#0a0d12"/>';
  for (const n of nodes) {
    const mx = n.x * sx, my = n.y * sy;
    s += '<circle cx="'+mx.toFixed(1)+'" cy="'+my.toFixed(1)+'" r="'+(n.isGhost ? 0.8 : 1.4)+'" fill="'+(n.color || '#888')+'"/>';
  }
  // Viewport rectangle — what slice of the main graph is currently shown
  s += '<rect id="mm-viewport" stroke="#8ab4f8" stroke-width="1" fill="rgba(138,180,248,0.07)" pointer-events="none"/>';
  mm.innerHTML = s;
  updateMinimapViewport();
}

function updateMinimapViewport() {
  const mm = document.getElementById("minimap");
  const vp = mm && document.getElementById("mm-viewport");
  if (!vp) return;
  const MW = 200, MH = 110;
  const sx = MW / width, sy = MH / height;
  // Visible region in main graph coords (in the same SVG userspace):
  //   xVis = (0 - tx) / k  to (width - tx) / k
  const x0 = (0 - viewState.tx) / viewState.k;
  const y0 = (0 - viewState.ty) / viewState.k;
  const x1 = (width - viewState.tx) / viewState.k;
  const y1 = (height - viewState.ty) / viewState.k;
  vp.setAttribute("x", (x0 * sx).toFixed(1));
  vp.setAttribute("y", (y0 * sy).toFixed(1));
  vp.setAttribute("width", Math.max(2, (x1 - x0) * sx).toFixed(1));
  vp.setAttribute("height", Math.max(2, (y1 - y0) * sy).toFixed(1));
}

// Click on minimap → recenter main graph on that point
(function bindMinimapClick(){
  const wrap = document.getElementById("minimap-wrap");
  if (!wrap) return;
  wrap.addEventListener("click", e => {
    const mm = document.getElementById("minimap");
    const rect = mm.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    // Target main-graph point in userspace
    const tx = mx * width;
    const ty = my * height;
    // Center viewport on (tx, ty): translate so that viewport center maps to tx,ty
    viewState.tx = (width / 2) - tx * viewState.k;
    viewState.ty = (height / 2) - ty * viewState.k;
    applyViewport();
    updateMinimapViewport();
  });
})();

// Click on empty background clears selection — but only when it's a real click,
// not the click event the browser fires at the end of a drag.
svg.addEventListener("click", e => {
  if (didDrag) { didDrag = false; return; }
  if (e.target === svg) clearSelection();
});

function selectTicker(ticker) {
  if (!DATA[ticker]) return;
  selectedTicker = ticker;
  const info = DATA[ticker].info;
  const set = new Set([ticker]);
  // Forward: relationships declared on this ticker's own row.
  for (const u of info.key_upstream || []) if (DATA[u]) set.add(u);
  for (const d of info.key_downstream || []) if (DATA[d]) set.add(d);
  // Reverse: anyone whose row declares THIS ticker as an up/downstream.
  // Without this, LASR-selected wouldn't surface IONQ even though IONQ
  // lists LASR as upstream (the buildGraph traversal is bidirectional
  // but the highlight was one-sided).
  for (const other in DATA) {
    const oi = DATA[other].info;
    if ((oi.key_upstream || []).includes(ticker)) set.add(other);
    if ((oi.key_downstream || []).includes(ticker)) set.add(other);
  }
  // Ghost edges: include any ghost node that has an edge to/from this ticker.
  const ge = (GHOSTS && GHOSTS.edges) || {};
  for (const key in ge) {
    const [s, t] = key.split("->");
    if (s === ticker) set.add(t);
    if (t === ticker) set.add(s);
  }
  highlightSet = set;
  applyHighlight();
  showDetail(ticker);
  updateUrl();
}

// Helpers used by the detail panel to show "reverse" neighbors symmetrically.
function reverseUpstreams(ticker) {
  // Tickers (or ghosts) whose key_downstream lists this ticker
  // -> they supply us -> they're our upstream.
  const out = [];
  for (const other in DATA) {
    if ((DATA[other].info.key_downstream || []).includes(ticker)) out.push(other);
  }
  const ge = (GHOSTS && GHOSTS.edges) || {};
  for (const key in ge) {
    const [s, t] = key.split("->");
    if (t === ticker && !DATA[s]) out.push(s); // ghost source
  }
  return out;
}
function reverseDownstreams(ticker) {
  // Tickers (or ghosts) whose key_upstream lists this ticker
  // -> we supply them -> they're our downstream.
  const out = [];
  for (const other in DATA) {
    if ((DATA[other].info.key_upstream || []).includes(ticker)) out.push(other);
  }
  const ge = (GHOSTS && GHOSTS.edges) || {};
  for (const key in ge) {
    const [s, t] = key.split("->");
    if (s === ticker && !DATA[t]) out.push(t); // ghost target
  }
  return out;
}

function clearSelection() {
  selectedTicker = null;
  highlightSet = null;
  applyHighlight();
  updateUrl();
}

function highlightFromSearch(query) {
  if (!query) {
    if (!selectedTicker) { highlightSet = null; applyHighlight(); }
    return;
  }
  const q = query.toLowerCase();
  const set = new Set();
  for (const t in DATA) {
    if (t.toLowerCase().includes(q) || (DATA[t].info.name||"").toLowerCase().includes(q)) set.add(t);
  }
  highlightSet = set.size ? set : null;
  applyHighlight();
}

function applyHighlight() {
  // Nodes
  for (const id in renderState.nodeEls) {
    const { g, circle } = renderState.nodeEls[id];
    if (!highlightSet) {
      g.style.opacity = "1";
      circle.setAttribute("stroke", "#fff");
      circle.setAttribute("stroke-width", "0.5");
    } else if (highlightSet.has(id)) {
      g.style.opacity = "1";
      const isSelected = id === selectedTicker;
      circle.setAttribute("stroke", isSelected ? "#fff" : "#8ab4f8");
      circle.setAttribute("stroke-width", isSelected ? "2" : "1.2");
    } else {
      g.style.opacity = "0.12";
      circle.setAttribute("stroke", "#fff");
      circle.setAttribute("stroke-width", "0.5");
    }
  }
  // Links — combine base width (from edgeWeightMode) with highlight state
  for (const { el, source, target } of renderState.linkEls) {
    const base = edgeBaseWidth(source, target);
    if (!highlightSet) {
      el.setAttribute("stroke", "#3a4150");
      el.setAttribute("stroke-width", base.toFixed(2));
      el.setAttribute("opacity", "0.55");
      el.setAttribute("marker-end", "url(#arrow-dim)");
    } else if (highlightSet.has(source) && highlightSet.has(target)) {
      el.setAttribute("stroke", "#8ab4f8");
      el.setAttribute("stroke-width", Math.max(1.3, base * 1.8).toFixed(2));
      el.setAttribute("opacity", "0.95");
      el.setAttribute("marker-end", "url(#arrow-hi)");
    } else {
      el.setAttribute("stroke", "#1d2129");
      el.setAttribute("stroke-width", Math.max(0.3, base * 0.5).toFixed(2));
      el.setAttribute("opacity", "0.18");
      el.setAttribute("marker-end", "url(#arrow-faint)");
    }
  }
}

// === Node hover tooltip ===

function fmtNative(value_millions, ccy) {
  if (value_millions == null || isNaN(value_millions)) return "—";
  const abs = Math.abs(value_millions);
  let v, unit;
  if (abs >= 1e6) { v = value_millions/1e6; unit = "T"; }
  else if (abs >= 1e3) { v = value_millions/1e3; unit = "B"; }
  else { v = value_millions; unit = "M"; }
  const sym = ({USD:"$", EUR:"€", TWD:"NT$", JPY:"¥", KRW:"₩", AUD:"A$", GBP:"£", CNY:"¥", CHF:"CHF "})[ccy] || "";
  const sign = value_millions < 0 ? "-" : "";
  return sign + sym + Math.abs(v).toFixed(1) + unit;
}

// Compute valuation / quality metrics from the embedded data.
// Returns { pe, ps, netMargin, pegPx, decoupling } — any may be null.
function deriveMetrics(ticker) {
  const d = DATA[ticker]; if (!d) return {};
  const latest = d.f && d.f.yr && d.f.yr[0];
  if (!latest) return {};
  const lastPrice = d.p && d.p.length ? d.p[d.p.length - 1][1] : null;
  const eps = latest.eps;          // native EPS (USD for US tickers; native for ADRs)
  const rev = latest.rev;          // millions native
  const ni = latest.ni;            // millions native
  const mcapUsd = d.mcap;          // millions USD
  const out = {};

  // P/E: only meaningful when EPS > 0
  if (typeof eps === "number" && eps > 0 && lastPrice) {
    out.pe = lastPrice / eps;
  }
  // P/S: only when revenue > 0 + mcap known
  if (typeof rev === "number" && rev > 0 && mcapUsd) {
    out.ps = mcapUsd / rev;     // both in millions, units cancel
  }
  // Net margin = NI / Revenue
  if (typeof rev === "number" && rev !== 0 && typeof ni === "number") {
    out.netMargin = (ni / rev) * 100;
  }
  // 5y revenue CAGR (already computed elsewhere; do it here too)
  if (d.f.yr.length >= 2) {
    const sorted = [...d.f.yr].sort((a,b)=>a.fy-b.fy);
    const r0 = sorted[0].rev, rN = sorted[sorted.length-1].rev;
    const n = sorted[sorted.length-1].fy - sorted[0].fy;
    if (r0 > 0 && rN > 0 && n > 0) {
      out.revCagr = (Math.pow(rN/r0, 1/n) - 1) * 100;
    }
  }
  // 5y price return
  if (d.p && d.p.length >= 2) {
    const first = d.p[0][1], last = d.p[d.p.length-1][1];
    if (first > 0) out.priceRet = ((last/first) - 1) * 100;
  }
  // YTD return: latest close vs December close of the previous calendar year.
  if (d.p && d.p.length >= 2) {
    const latest = d.p[d.p.length - 1];
    const latestYear = parseInt(String(latest[0]).slice(0, 4));
    const refMonth = (latestYear - 1) + "-12";
    const ref = d.p.find(r => r[0] === refMonth);
    if (ref && ref[1] > 0) out.ytdReturn = ((latest[1] / ref[1]) - 1) * 100;
  }
  // PEG (P/E ÷ growth%): only meaningful with positive P/E + positive growth
  if (out.pe && out.revCagr > 0) {
    out.peg = out.pe / out.revCagr;
  }
  // Decoupling: price-return ÷ revenue-CAGR. Above ~10 = mostly revaluation; below 1 = fundamentals not rewarded.
  if (out.revCagr && out.revCagr > 0 && typeof out.priceRet === "number") {
    out.decoupling = out.priceRet / out.revCagr;
  }
  return out;
}

function fmtPe(v) { return v == null ? "—" : v.toFixed(1) + "x"; }
function fmtPs(v) { return v == null ? "—" : v.toFixed(1) + "x"; }
function fmtPct1(v) { return v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(1) + "%"; }
function decouplingLabel(v) {
  if (v == null) return null;
  if (v > 15) return { txt: "extreme revaluation", cls: "neg" };
  if (v > 5) return { txt: "strong revaluation", cls: "pos" };
  if (v > 1) return { txt: "balanced", cls: "" };
  if (v > -1) return { txt: "fundamentals under-rewarded", cls: "neg" };
  return { txt: "punished", cls: "neg" };
}

function showNodeTip(ticker, e) {
  const d = DATA[ticker]; if (!d) return;
  const info = d.info;
  const tip = document.getElementById("tip");

  let h = '<div class="tip-head"><span class="tip-from">'+ticker+'</span> ';
  h += '<span style="color:#e3e7ed; font-weight:400">'+info.name+'</span></div>';

  h += '<div style="margin-bottom:6px"><span class="pill">'+info.tier+' / '+info.segment+'</span>';
  if (d.mcap) {
    const mc = d.mcap >= 1e6 ? "$"+(d.mcap/1e6).toFixed(2)+"T"
             : d.mcap >= 1e3 ? "$"+(d.mcap/1e3).toFixed(1)+"B"
             : "$"+d.mcap.toFixed(0)+"M";
    h += ' <span class="pill" style="background:#15171c;color:#80e080">~'+mc+' mcap</span>';
  }
  h += '</div>';

  h += '<div class="tip-section">'+info.role_in_chain+'</div>';

  if (d.f && d.f.yr && d.f.yr.length) {
    const latest = d.f.yr[0];
    h += '<div class="tip-row" style="margin-top:7px"><span class="tip-label">FY'+latest.fy+':</span> ';
    h += 'Rev <b>'+fmtNative(latest.rev, d.f.ccy)+'</b>';
    h += ' &middot; NI <b>'+fmtNative(latest.ni, d.f.ccy)+'</b>';
    if (latest.eps != null) h += ' &middot; EPS '+latest.eps.toFixed(2);
    h += '</div>';

    if (d.f.yr.length >= 2) {
      const sorted = [...d.f.yr].sort((a,b)=>a.fy-b.fy);
      const r0 = sorted[0].rev, rN = sorted[sorted.length-1].rev;
      const n = sorted[sorted.length-1].fy - sorted[0].fy;
      if (r0 && rN && n > 0 && r0 > 0) {
        const cagr = (Math.pow(rN/r0, 1/n) - 1) * 100;
        const cls = cagr >= 0 ? 'pos' : 'neg';
        h += '<div class="tip-row"><span class="tip-label">'+n+'y rev CAGR:</span> <span class="'+cls+'">'+(cagr>=0?'+':'')+cagr.toFixed(0)+'%</span></div>';
      }
    }
  }

  if (d.p && d.p.length >= 2) {
    const first = d.p[0][1], last = d.p[d.p.length-1][1];
    if (first > 0) {
      const ret = ((last/first) - 1) * 100;
      const cls = ret >= 0 ? 'pos' : 'neg';
      h += '<div class="tip-row"><span class="tip-label">5y price return:</span> ';
      h += '<span class="'+cls+'">'+(ret>=0?'+':'')+ret.toFixed(0)+'%</span>';
      h += ' &nbsp;<span style="color:#7a8395; font-size:11px">($'+first.toFixed(2)+' → $'+last.toFixed(2)+')</span>';
      h += '</div>';
    }
    // YTD row
    const mY = deriveMetrics(ticker);
    if (mY.ytdReturn != null) {
      const cls = mY.ytdReturn >= 0 ? 'pos' : 'neg';
      h += '<div class="tip-row"><span class="tip-label">YTD return:</span> ';
      h += '<span class="'+cls+'">'+(mY.ytdReturn>=0?'+':'')+mY.ytdReturn.toFixed(1)+'%</span>';
      h += '</div>';
    }
  }

  // Derived metrics row
  const m = deriveMetrics(ticker);
  const metricsParts = [];
  if (m.pe != null) metricsParts.push('P/E '+fmtPe(m.pe));
  if (m.ps != null) metricsParts.push('P/S '+fmtPs(m.ps));
  if (m.peg != null) metricsParts.push('PEG '+m.peg.toFixed(1));
  if (m.netMargin != null) metricsParts.push('NM '+fmtPct1(m.netMargin));
  if (metricsParts.length) {
    h += '<div class="tip-row" style="font-size:11px; color:#c5cad3"><span class="tip-label">Multiples:</span> ' + metricsParts.join(' &middot; ') + '</div>';
  }
  if (m.decoupling != null) {
    const lbl = decouplingLabel(m.decoupling);
    if (lbl) {
      h += '<div class="tip-row" style="font-size:11px"><span class="tip-label">Decoupling:</span> ';
      h += '<span class="'+lbl.cls+'">'+m.decoupling.toFixed(1)+'×</span> <span style="color:#7a8395">('+lbl.txt+')</span>';
      h += '</div>';
    }
  }

  const up = (info.key_upstream || []).filter(u => DATA[u]).length;
  const dn = (info.key_downstream || []).filter(u => DATA[u]).length;
  if (up || dn) {
    h += '<div class="tip-row" style="margin-top:6px; color:#7a8395; font-size:11px">';
    h += up + ' upstream &middot; ' + dn + ' downstream (in registry)';
    if (d.q && d.q.length) h += ' &middot; <span style="color:#80e080">'+d.q.length+' quarters</span>';
    h += '</div>';
  }

  h += '<div class="tip-basis" style="margin-top:6px; font-style:italic">Click for full detail panel.</div>';

  tip.innerHTML = h;
  tip.style.display = "block";
  moveTip(e);
}

// === Edge tooltip ===

function findEdgeData(source, target) {
  const key = source + "->" + target;
  const e = (RELATIONSHIPS.edges && RELATIONSHIPS.edges[key])
         || (GHOSTS.edges && GHOSTS.edges[key]);
  if (e) return { ...e, curated: true, source, target };
  // Synthesized fallback for un-curated edges
  const s = DATA[source] || (GHOSTS.ghosts && GHOSTS.ghosts[source]);
  const t = DATA[target] || (GHOSTS.ghosts && GHOSTS.ghosts[target]);
  if (!s || !t) return null;
  const srcRole = s.info ? (s.info.role_in_chain || s.info.segment) : (s.role || s.segment);
  const tgtRole = t.info ? (t.info.role_in_chain || t.info.segment) : (t.role || t.segment);
  return {
    curated: false,
    source, target,
    what_flows: \`\${srcRole} → \${tgtRole}\`,
    importance: null,
    annual_usd_billions: null,
    single_source_risk: null,
    trend: null
  };
}

function showGhostTip(node, e) {
  const tip = document.getElementById("tip");
  const g = GHOSTS.ghosts[node.id];
  if (!g) return;
  let h = '<div class="tip-head" style="color:#97a3b6">' + g.name + ' <span style="font-size:10px; color:#7a8395">(' + (g.kind || 'private') + ')</span></div>';
  h += '<div style="margin-bottom:6px"><span class="pill" style="background:#15171c">' + g.tier + ' / ' + g.segment + '</span></div>';
  if (g.where) h += '<div class="tip-row"><span class="tip-label">Where:</span> ' + g.where + '</div>';
  h += '<div class="tip-section">' + g.role + '</div>';
  h += '<div class="tip-basis" style="margin-top:8px; font-style:italic">Not publicly investable — included for structural completeness only.</div>';
  tip.innerHTML = h;
  tip.style.display = "block";
  moveTip(e);
}

function showEdgeTip(source, target, e) {
  const data = findEdgeData(source, target);
  if (!data) return;
  const tip = document.getElementById("tip");
  const s = DATA[source]; const t = DATA[target];
  let h = '<div class="tip-head"><span class="tip-from">'+source+'</span>';
  h += '<span class="tip-arrow">→</span><span class="tip-to">'+target+'</span></div>';
  h += '<div class="meta" style="font-size:11px; margin-bottom:6px">';
  h += (s ? s.info.name : source) + ' &nbsp;&rarr;&nbsp; ' + (t ? t.info.name : target);
  h += '</div>';

  if (data.importance) {
    h += '<div class="tip-row"><span class="tip-label">Importance:</span> ';
    h += '<span class="tip-tag tag-'+data.importance+'">'+data.importance+'</span></div>';
  }
  if (data.single_source_risk) {
    h += '<div class="tip-row"><span class="tip-label">Single-source risk:</span> ';
    h += '<span class="tip-tag tag-risk-'+data.single_source_risk+'">'+data.single_source_risk+'</span></div>';
  }
  if (data.annual_usd_billions) {
    h += '<div class="tip-row"><span class="tip-label">Est. annual flow:</span> <b>$' + data.annual_usd_billions + 'B</b></div>';
  }
  if (data.trend) {
    h += '<div class="tip-row"><span class="tip-label">Trend:</span> ' + data.trend + '</div>';
  }

  h += '<div class="tip-section">' + data.what_flows + '</div>';

  if (data.alternatives) {
    h += '<div class="tip-row" style="margin-top:6px"><span class="tip-label">Alternatives:</span> ' + data.alternatives + '</div>';
  }
  if (data.deal_basis) {
    h += '<div class="tip-basis"><b>Basis:</b> ' + data.deal_basis + '</div>';
  }
  if (data.key_event) {
    h += '<div class="tip-event">⚑ ' + data.key_event + '</div>';
  }
  if (!data.curated) {
    h += '<div class="tip-basis" style="margin-top:6px; font-style:italic">No curated detail for this edge — synthesized from tier roles. See REPORT.md for full segment context.</div>';
  }

  tip.innerHTML = h;
  tip.style.display = "block";
  moveTip(e);
}

function moveTip(e) {
  const tip = document.getElementById("tip");
  if (tip.style.display === "none") return;
  const pad = 14;
  const w = tip.offsetWidth || 340;
  const h = tip.offsetHeight || 200;
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  if (x + w > window.innerWidth) x = e.clientX - w - pad;
  if (y + h > window.innerHeight) y = e.clientY - h - pad;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}

function hideTip() {
  document.getElementById("tip").style.display = "none";
}

function showDetail(ticker) {
  const d = DATA[ticker];
  if (!d) return;
  const info = d.info;
  // Build a Google Finance URL. Exchange "OTC" needs to become "OTCMKTS".
  const exch = info.exchange === "OTC" ? "OTCMKTS" : info.exchange;
  const gfUrl = exch
    ? \`https://www.google.com/finance/quote/\${ticker}:\${exch}\`
    : \`https://www.google.com/finance/quote/\${ticker}\`;
  let h = '<h1><a href="'+gfUrl+'" target="_blank" rel="noopener noreferrer" '
        + 'class="gf-link" title="Open in Google Finance">'+ticker+' <span class="gf-arrow">↗</span></a> '
        + '&mdash; '+info.name+'</h1>';
  h += '<p class="meta"><span class="pill">'+info.tier+' / '+info.segment+'</span>';
  if (d.mcap) {
    const mcapDisplay = d.mcap >= 1e6 ? '$' + (d.mcap/1e6).toFixed(2) + 'T'
                       : d.mcap >= 1e3 ? '$' + (d.mcap/1e3).toFixed(1) + 'B'
                       : '$' + d.mcap.toFixed(0) + 'M';
    h += ' &nbsp;<span class="pill" style="background:#15171c;color:#80e080">~' + mcapDisplay + ' mcap</span>';
  }
  h += '</p>';
  h += '<p style="font-size:13px">'+info.role_in_chain+'</p>';
  h += '<p><button class="gf-link" style="cursor:pointer; background:#1d2129; color:#8ab4f8; border:1px solid #2a2f38; padding:3px 10px; border-radius:4px; font-size:12px" onclick="toggleCompare(\\''+ticker+'\\')">'
     + (compareSet && compareSet.has(ticker) ? '− Remove from compare' : '+ Add to compare')
     + '</button></p>';

  const ghostMap = (GHOSTS && GHOSTS.ghosts) || {};
  const pillFor = (u) => {
    if (DATA[u]) {
      return '<span class="pill pill-link" onclick="selectTicker(\\''+u+'\\')">'+u+'</span>';
    }
    if (ghostMap[u]) {
      return '<span class="pill pill-extern" title="'+ghostMap[u].kind+' — '+ghostMap[u].where+'">'+ghostMap[u].name+' (ghost)</span>';
    }
    return '<span class="pill pill-extern" title="not in registry (private / foreign-only / categorical)">'+u+'</span>';
  };
  // Union of declared + reverse-declared (so LASR sees IONQ even though IONQ is the side declaring the edge)
  const upSet = new Set([...(info.key_upstream || []), ...reverseUpstreams(ticker)]);
  const dnSet = new Set([...(info.key_downstream || []), ...reverseDownstreams(ticker)]);
  h += '<h2>Upstream (depends on)</h2><p>';
  h += upSet.size ? [...upSet].map(pillFor).join(" ") : '<em class="meta">none in registry</em>';
  h += '</p><h2>Downstream (serves)</h2><p>';
  h += dnSet.size ? [...dnSet].map(pillFor).join(" ") : '<em class="meta">none in registry</em>';
  h += '</p>';

  if (d.f && d.f.yr && d.f.yr.length) {
    h += '<h2>Financials (5yr, native '+(d.f.ccy||'USD')+', millions)</h2>';
    h += '<table><tr><th>FY</th><th>FYE</th><th>Revenue</th><th>Net inc</th><th>EPS</th></tr>';
    for (const y of d.f.yr) {
      const niCls = (y.ni != null && y.ni < 0) ? 'neg' : 'pos';
      h += '<tr><td>'+y.fy+'</td><td>'+(y.fye||'')+'</td>';
      h += '<td>'+(y.rev != null ? y.rev.toLocaleString() : '—')+'</td>';
      h += '<td class="'+niCls+'">'+(y.ni != null ? y.ni.toLocaleString() : '—')+'</td>';
      h += '<td>'+(y.eps != null ? y.eps.toFixed(2) : '—')+'</td></tr>';
    }
    h += '</table>';
  }

  // Derived metrics block
  const m = deriveMetrics(ticker);
  const anyMetric = m.pe != null || m.ps != null || m.netMargin != null || m.peg != null || m.decoupling != null;
  if (anyMetric) {
    h += '<h2>Derived metrics</h2>';
    h += '<table><tr><th>Metric</th><th>Value</th><th>Interpretation</th></tr>';
    if (m.pe != null) {
      const peCls = m.pe > 40 ? 'neg' : (m.pe < 15 ? 'pos' : '');
      h += '<tr><td>P/E (trailing)</td><td class="'+peCls+'">'+fmtPe(m.pe)+'</td><td style="color:#7a8395; font-size:11px">' + (m.pe > 40 ? 'rich' : m.pe < 15 ? 'cheap by historic' : 'in-range') + '</td></tr>';
    }
    if (m.ps != null) {
      const psCls = m.ps > 15 ? 'neg' : (m.ps < 3 ? 'pos' : '');
      h += '<tr><td>P/S (mcap / revenue)</td><td class="'+psCls+'">'+fmtPs(m.ps)+'</td><td style="color:#7a8395; font-size:11px">' + (m.ps > 15 ? 'expensive' : m.ps < 3 ? 'cheap by historic' : '') + '</td></tr>';
    }
    if (m.peg != null) {
      const pegCls = m.peg > 3 ? 'neg' : (m.peg < 1 ? 'pos' : '');
      h += '<tr><td>PEG (P/E ÷ rev CAGR)</td><td class="'+pegCls+'">'+m.peg.toFixed(2)+'</td><td style="color:#7a8395; font-size:11px">' + (m.peg < 1 ? 'growth at value price' : m.peg > 3 ? 'growth fully baked in' : '') + '</td></tr>';
    }
    if (m.netMargin != null) {
      const nmCls = m.netMargin >= 20 ? 'pos' : (m.netMargin < 0 ? 'neg' : '');
      h += '<tr><td>Net margin</td><td class="'+nmCls+'">'+fmtPct1(m.netMargin)+'</td><td></td></tr>';
    }
    if (m.decoupling != null) {
      const lbl = decouplingLabel(m.decoupling);
      h += '<tr><td>Decoupling (5yr px ret ÷ rev CAGR)</td><td class="'+(lbl?lbl.cls:'')+'">'+m.decoupling.toFixed(2)+'×</td><td style="color:#7a8395; font-size:11px">'+(lbl?lbl.txt:'')+'</td></tr>';
    }
    if (m.ytdReturn != null) {
      const cls = m.ytdReturn >= 0 ? 'pos' : 'neg';
      h += '<tr><td>YTD price return</td><td class="'+cls+'">'+(m.ytdReturn>=0?'+':'')+m.ytdReturn.toFixed(1)+'%</td><td style="color:#7a8395; font-size:11px">since last Dec close</td></tr>';
    }
    h += '</table>';
  }

  // Quarterly data (if available — only top anchors have it)
  if (d.q && d.q.length) {
    h += '<h2>Recent quarters ('+d.q.length+' qtrs · '+(d.f && d.f.ccy || 'USD')+' millions)</h2>';
    h += '<table><tr><th>Quarter</th><th>Revenue</th><th>QoQ</th><th>YoY</th><th>Net inc</th><th>EPS</th></tr>';
    for (let i = 0; i < d.q.length; i++) {
      const cur = d.q[i];
      const prevQ = d.q[i+1];     // next index = previous quarter (descending order)
      const prevY = d.q[i+4];     // four quarters back
      const qoq = (prevQ && cur.rev != null && prevQ.rev > 0)
        ? ((cur.rev / prevQ.rev) - 1) * 100 : null;
      const yoy = (prevY && cur.rev != null && prevY.rev > 0)
        ? ((cur.rev / prevY.rev) - 1) * 100 : null;
      h += '<tr><td>'+cur.q.replace(/_/g, ' ')+'</td>';
      h += '<td>'+(cur.rev != null ? cur.rev.toLocaleString() : '—')+'</td>';
      h += '<td class="'+(qoq>=0?'pos':'neg')+'">'+(qoq != null ? (qoq>=0?'+':'')+qoq.toFixed(1)+'%' : '—')+'</td>';
      h += '<td class="'+(yoy>=0?'pos':'neg')+'">'+(yoy != null ? (yoy>=0?'+':'')+yoy.toFixed(1)+'%' : '—')+'</td>';
      h += '<td class="'+(cur.ni<0?'neg':'pos')+'">'+(cur.ni != null ? cur.ni.toLocaleString() : '—')+'</td>';
      h += '<td>'+(cur.eps != null ? cur.eps.toFixed(2) : '—')+'</td></tr>';
    }
    h += '</table>';
  }

  if (d.p && d.p.length) {
    h += '<h2>Monthly close ('+d.p.length+' months)</h2>';
    const first = d.p[0][1]; const last = d.p[d.p.length-1][1];
    const ret = first ? ((last/first - 1) * 100) : null;
    const retCls = (ret != null && ret < 0) ? 'neg' : 'pos';
    h += '<p>From '+d.p[0][0]+' ('+first.toFixed(2)+') to '+d.p[d.p.length-1][0]+' ('+last.toFixed(2)+') &mdash; ';
    h += '<span class="'+retCls+'">'+(ret>=0?'+':'')+ret.toFixed(0)+'%</span></p>';
    h += '<div id="chartbox" style="background:#1d2129; padding:8px 10px 4px; border-radius:4px; position:relative;">';
    h += '<div id="chart-readout" style="position:absolute; top:8px; right:14px; font-size:11px; color:#c5cad3; pointer-events:none; min-height:14px; font-variant-numeric: tabular-nums">Hover for value</div>';
    h += '<svg id="detail-chart" viewBox="0 0 600 200" preserveAspectRatio="none" style="display:block; width:100%; height:200px"></svg>';
    h += '</div>';
  }

  document.getElementById("detail").innerHTML = h;

  if (d.p && d.p.length) drawDetailChart(ticker);
}

function drawDetailChart(ticker) {
  const d = DATA[ticker];
  const svg = document.getElementById("detail-chart");
  const readout = document.getElementById("chart-readout");
  if (!svg || !d || !d.p || !d.p.length) return;
  const W = 600, H = 200, PL = 44, PR = 10, PT = 10, PB = 22;
  const prices = d.p.map(r => r[1]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const niceTicks = (lo, hi, count) => {
    const span = hi - lo;
    const step0 = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const start = Math.ceil(lo / step) * step;
    const out = [];
    for (let v = start; v <= hi; v += step) out.push(v);
    return out;
  };
  const yTicks = niceTicks(min, max, 5);
  const xCoord = (i) => PL + (W - PL - PR) * i / Math.max(1, d.p.length - 1);
  const yCoord = (v) => H - PB - (H - PT - PB) * (v - min) / range;

  let s = "";
  // Grid + Y labels
  for (const v of yTicks) {
    const y = yCoord(v);
    s += '<line x1="'+PL+'" y1="'+y.toFixed(1)+'" x2="'+(W-PR)+'" y2="'+y.toFixed(1)+'" stroke="#2a2f38" stroke-width="0.5"/>';
    s += '<text x="'+(PL-4)+'" y="'+(y+3).toFixed(1)+'" fill="#7a8395" font-size="10" text-anchor="end">$'+(v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(v < 10 ? 2 : 0))+'</text>';
  }
  // X labels (5 evenly spaced)
  const xLabelCount = Math.min(5, d.p.length);
  for (let i = 0; i < xLabelCount; i++) {
    const idx = Math.round(i * (d.p.length - 1) / (xLabelCount - 1));
    const x = xCoord(idx);
    s += '<text x="'+x.toFixed(1)+'" y="'+(H-5)+'" fill="#7a8395" font-size="10" text-anchor="middle">'+d.p[idx][0]+'</text>';
  }
  // Filled area + line
  const linePath = d.p.map((r, i) => (i === 0 ? "M" : "L") + xCoord(i).toFixed(1) + "," + yCoord(r[1]).toFixed(1)).join(" ");
  const fillPath = linePath + " L" + xCoord(d.p.length - 1).toFixed(1) + "," + yCoord(min).toFixed(1) + " L" + xCoord(0).toFixed(1) + "," + yCoord(min).toFixed(1) + " Z";
  s += '<path d="'+fillPath+'" fill="url(#chartgrad)" opacity="0.4"/>';
  s += '<path d="'+linePath+'" fill="none" stroke="#8ab4f8" stroke-width="1.5"/>';
  // Gradient defs
  s += '<defs><linearGradient id="chartgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8ab4f8" stop-opacity="0.6"/><stop offset="100%" stop-color="#8ab4f8" stop-opacity="0"/></linearGradient></defs>';
  // Crosshair + hover dot (initially hidden)
  s += '<line id="cx-line" x1="-1" y1="'+PT+'" x2="-1" y2="'+(H-PB)+'" stroke="#fff" stroke-width="0.5" stroke-dasharray="2 2" opacity="0" pointer-events="none"/>';
  s += '<circle id="cx-dot" cx="-1" cy="-1" r="4" fill="#8ab4f8" stroke="#fff" stroke-width="1.5" opacity="0" pointer-events="none"/>';
  // Hit area (transparent rect for mouse tracking)
  s += '<rect id="cx-hit" x="'+PL+'" y="'+PT+'" width="'+(W-PL-PR)+'" height="'+(H-PT-PB)+'" fill="transparent" style="cursor:crosshair"/>';
  svg.innerHTML = s;

  // Mouse tracking — find nearest data point + show crosshair + readout
  const hit = document.getElementById("cx-hit");
  const cxLine = document.getElementById("cx-line");
  const cxDot = document.getElementById("cx-dot");
  function nearest(svgX) {
    const innerW = W - PL - PR;
    const rel = (svgX - PL) / innerW;
    const idx = Math.round(rel * (d.p.length - 1));
    return Math.max(0, Math.min(d.p.length - 1, idx));
  }
  function updateHover(evt) {
    const rect = svg.getBoundingClientRect();
    const xPct = (evt.clientX - rect.left) / rect.width;
    const svgX = xPct * W;
    const idx = nearest(svgX);
    const [month, price] = d.p[idx];
    const x = xCoord(idx), y = yCoord(price);
    cxLine.setAttribute("x1", x.toFixed(1));
    cxLine.setAttribute("x2", x.toFixed(1));
    cxLine.setAttribute("opacity", "0.7");
    cxDot.setAttribute("cx", x.toFixed(1));
    cxDot.setAttribute("cy", y.toFixed(1));
    cxDot.setAttribute("opacity", "1");
    // Change from first price
    const baseP = d.p[0][1];
    const chg = baseP > 0 ? ((price/baseP - 1) * 100) : 0;
    const cls = chg >= 0 ? "pos" : "neg";
    readout.innerHTML = '<b>'+month+'</b>: $'+price.toFixed(2)+' &nbsp; <span class="'+cls+'">'+(chg>=0?'+':'')+chg.toFixed(1)+'% vs start</span>';
  }
  hit.addEventListener("mousemove", updateHover);
  hit.addEventListener("mouseleave", () => {
    cxLine.setAttribute("opacity", "0");
    cxDot.setAttribute("opacity", "0");
    readout.textContent = "Hover for value";
  });
}

// === Edge weight mode (uniform vs $-scaled, à la Sankey) ===
let edgeWeightMode = "uniform"; // "uniform" | "dollar"

// Parse strings like "30-40", "<0.1", "8-12", "5.5" → midpoint in USD billions
function parseAnnualB(s) {
  if (s == null) return null;
  const str = String(s).trim();
  const lt = str.match(/^<\s*([\d.]+)/);
  if (lt) return parseFloat(lt[1]) / 2;
  const range = str.match(/^([\d.]+)\s*-\s*([\d.]+)/);
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function edgeBaseWidth(source, target) {
  if (edgeWeightMode === "uniform") return 0.6;
  const edge = findEdgeData(source, target);
  const $$ = edge && edge.annual_usd_billions ? parseAnnualB(edge.annual_usd_billions) : null;
  if ($$ == null) return 0.35;          // uncurated edges very thin in $ mode
  return Math.max(0.5, Math.min(8, Math.sqrt($$)));
}

function toggleEdgeWeight() {
  edgeWeightMode = edgeWeightMode === "uniform" ? "dollar" : "uniform";
  document.getElementById("ew-toggle").textContent = "Edges: " + (edgeWeightMode === "dollar" ? "$-scaled" : "uniform");
  applyHighlight();   // re-applies widths
  updateUrl();
}

// === Screen / filter by metric ===
let activeScreen = null;

function toggleScreenPanel() {
  document.getElementById("screen-panel").classList.toggle("open");
  document.getElementById("screen-toggle").classList.toggle("active");
}
function readNum(id) {
  const v = document.getElementById(id).value;
  return v === "" ? null : Number(v);
}
function applyScreen() {
  const filter = {
    minMcap: readNum("f-minMcap"),
    maxMcap: readNum("f-maxMcap"),
    minCagr: readNum("f-minCagr"),
    maxCagr: readNum("f-maxCagr"),
    minRet:  readNum("f-minRet"),
    maxRet:  readNum("f-maxRet"),
    minYtd:  readNum("f-minYtd"),
    maxYtd:  readNum("f-maxYtd"),
    minPe:   readNum("f-minPe"),
    maxPe:   readNum("f-maxPe"),
    minPs:   readNum("f-minPs"),
    maxPs:   readNum("f-maxPs"),
    minPeg:  readNum("f-minPeg"),
    maxPeg:  readNum("f-maxPeg"),
    minNm:   readNum("f-minNm"),
    maxNm:   readNum("f-maxNm"),
    minDcp:  readNum("f-minDcp"),
    maxDcp:  readNum("f-maxDcp"),
    tier:    document.getElementById("f-tier").value || null,
  };
  const anyActive = Object.values(filter).some(v => v != null && v !== "");
  activeScreen = anyActive ? filter : null;
  const matches = matchingTickers();
  const status = activeScreen
    ? \`screening \${matches.size} of \${Object.keys(DATA).length} tickers\`
    : "";
  document.getElementById("screen-status").textContent = status;
  // Apply as highlight set (consistent with search/select UI)
  if (activeScreen) {
    highlightSet = matches;
    selectedTicker = null;
    applyHighlight();
  } else {
    clearSelection();
  }
  updateUrl();
}
function clearScreen() {
  ["f-minMcap","f-maxMcap","f-minCagr","f-maxCagr","f-minRet","f-maxRet","f-minYtd","f-maxYtd","f-minPe","f-maxPe","f-minPs","f-maxPs","f-minPeg","f-maxPeg","f-minNm","f-maxNm","f-minDcp","f-maxDcp","f-tier"].forEach(id => {
    document.getElementById(id).value = "";
  });
  activeScreen = null;
  document.getElementById("screen-status").textContent = "";
  document.querySelectorAll(".preset-chip").forEach(el => el.classList.remove("active"));
  clearSelection();
}
function matchingTickers() {
  if (!activeScreen) return new Set(Object.keys(DATA));
  const out = new Set();
  for (const t in DATA) {
    if (!screenMatch(t, activeScreen)) continue;
    out.add(t);
  }
  return out;
}
function screenMatch(t, f) {
  const d = DATA[t];
  const info = d.info;
  const m = deriveMetrics(t);
  if (f.minMcap != null && (!d.mcap || d.mcap / 1000 < f.minMcap)) return false;
  if (f.maxMcap != null && (!d.mcap || d.mcap / 1000 > f.maxMcap)) return false;
  if (f.minCagr != null && (m.revCagr == null || m.revCagr < f.minCagr)) return false;
  if (f.maxCagr != null && (m.revCagr == null || m.revCagr > f.maxCagr)) return false;
  if (f.minRet != null && (m.priceRet == null || m.priceRet < f.minRet)) return false;
  if (f.maxRet != null && (m.priceRet == null || m.priceRet > f.maxRet)) return false;
  if (f.minYtd != null && (m.ytdReturn == null || m.ytdReturn < f.minYtd)) return false;
  if (f.maxYtd != null && (m.ytdReturn == null || m.ytdReturn > f.maxYtd)) return false;
  if (f.minPe  != null && (m.pe == null || m.pe < f.minPe)) return false;
  if (f.maxPe  != null && (m.pe == null || m.pe > f.maxPe)) return false;
  if (f.minPs  != null && (m.ps == null || m.ps < f.minPs)) return false;
  if (f.maxPs  != null && (m.ps == null || m.ps > f.maxPs)) return false;
  if (f.minPeg != null && (m.peg == null || m.peg < f.minPeg)) return false;
  if (f.maxPeg != null && (m.peg == null || m.peg > f.maxPeg)) return false;
  if (f.minNm  != null && (m.netMargin == null || m.netMargin < f.minNm)) return false;
  if (f.maxNm  != null && (m.netMargin == null || m.netMargin > f.maxNm)) return false;
  if (f.minDcp != null && (m.decoupling == null || m.decoupling < f.minDcp)) return false;
  if (f.maxDcp != null && (m.decoupling == null || m.decoupling > f.maxDcp)) return false;
  if (f.tier && info.tier !== f.tier) return false;
  return true;
}

// One-click preset screens
function applyPreset(name) {
  clearScreen();
  const set = (id, v) => { document.getElementById(id).value = v; };
  if (name === "cheap")      { set("f-maxPe", 15); }
  if (name === "expensive")  { set("f-minPe", 40); }
  if (name === "garp")       { set("f-maxPeg", 1); set("f-minCagr", 10); }
  if (name === "hidden")     { set("f-minCagr", 25); set("f-maxPe", 25); set("f-minMcap", 5); }
  if (name === "quality")    { set("f-minNm", 25); set("f-maxPe", 30); }
  if (name === "cashcows")   { set("f-minNm", 25); set("f-maxCagr", 10); }
  if (name === "losers")     { set("f-maxNm", 0); }
  if (name === "bubble")     { set("f-minDcp", 15); }
  if (name === "aiwinners")  { set("f-minYtd", 40); set("f-minMcap", 10); }
  if (name === "big_losers") { set("f-maxYtd", -20); }
  if (name === "megacap")    { set("f-minMcap", 500); }
  if (name === "smallcap")   { set("f-maxMcap", 5); set("f-minCagr", 15); }
  if (name === "power")      { document.getElementById("f-tier").value = "D2"; set("f-minMcap", 5); }
  if (name === "quantum")    { document.getElementById("f-tier").value = "Q"; }
  // Toggle active visual on the clicked chip
  document.querySelectorAll(".preset-chip").forEach(el => el.classList.toggle("active", el.dataset.preset === name));
  applyScreen();
}

// === Compare mode ===
const compareSet = new Set();
const COMPARE_MAX = 5;

function toggleCompare(ticker) {
  if (compareSet.has(ticker)) compareSet.delete(ticker);
  else {
    if (compareSet.size >= COMPARE_MAX) return false;
    compareSet.add(ticker);
  }
  renderCompareBin();
  return true;
}
function renderCompareBin() {
  const bin = document.getElementById("compare-bin");
  const pills = document.getElementById("bin-pills");
  if (compareSet.size === 0) {
    bin.classList.remove("open");
    pills.innerHTML = "";
    updateUrl();
    return;
  }
  bin.classList.add("open");
  pills.innerHTML = [...compareSet].map(t =>
    '<span class="bin-pill" onclick="toggleCompare(\\''+t+'\\')" title="Remove">'+t+' ×</span>'
  ).join("");
  updateUrl();
}
function clearCompare() {
  compareSet.clear();
  renderCompareBin();
}
function openCompare() {
  if (compareSet.size === 0) return;
  showCompareDetail([...compareSet]);
}

// === Tier-level aggregates ===
function showTierDashboard() {
  // Aggregate by tier
  const tiers = ["U5","U4","U3","U2","U1","AI core","D1","D2","D3","D4","Q"];
  const labels = tierLabel;
  const groups = {};
  for (const t of tiers) groups[t] = { tickers: [], mcap: 0, mcapW: 0, cagrW: 0, retW: 0, ytdW: 0, nmW: 0, peW: 0, peCount: 0, peSum: 0 };
  for (const tk in DATA) {
    const info = DATA[tk].info;
    const m = deriveMetrics(tk);
    const g = groups[info.tier];
    if (!g) continue;
    g.tickers.push(tk);
    if (DATA[tk].mcap > 0) {
      g.mcap += DATA[tk].mcap;
      if (m.revCagr != null) { g.mcapW += DATA[tk].mcap; g.cagrW += m.revCagr * DATA[tk].mcap; }
      if (m.priceRet != null) g.retW += m.priceRet * DATA[tk].mcap;
      if (m.ytdReturn != null) g.ytdW += m.ytdReturn * DATA[tk].mcap;
      if (m.netMargin != null) g.nmW += m.netMargin * DATA[tk].mcap;
    }
    if (m.pe != null && m.pe > 0 && m.pe < 200) { g.peSum += m.pe; g.peCount++; }
  }
  const totalMcap = Object.values(groups).reduce((a,g) => a + g.mcap, 0);

  let h = '<h1 style="border:0">Tier dashboard</h1>';
  h += '<p class="meta">Aggregate metrics for each supply-chain tier. Means are <b>market-cap-weighted</b> (so NVDA pulls U1 much more than POWI).</p>';
  h += '<table style="font-size:12px"><tr><th>Tier</th><th>N</th><th>Total mcap</th><th>% chain</th><th>Wtd CAGR</th><th>Wtd 5y ret</th><th>Wtd YTD</th><th>Wtd NM</th><th>Avg P/E</th></tr>';

  for (const t of tiers) {
    const g = groups[t];
    if (g.tickers.length === 0) continue;
    const pct = totalMcap > 0 ? (g.mcap / totalMcap) * 100 : 0;
    const cagr = g.mcapW > 0 ? g.cagrW / g.mcapW : null;
    const ret  = g.mcapW > 0 ? g.retW  / g.mcapW : null;
    const ytd  = g.mcapW > 0 ? g.ytdW  / g.mcapW : null;
    const nm   = g.mcapW > 0 ? g.nmW   / g.mcapW : null;
    const avgPe = g.peCount > 0 ? g.peSum / g.peCount : null;
    const mcapStr = g.mcap >= 1e6 ? '$' + (g.mcap/1e6).toFixed(2) + 'T'
                   : g.mcap >= 1e3 ? '$' + (g.mcap/1e3).toFixed(0) + 'B'
                   : '$' + g.mcap.toFixed(0) + 'M';
    h += '<tr><td><b>'+t+'</b> '+labels[t]+'</td>';
    h += '<td>'+g.tickers.length+'</td>';
    h += '<td>'+mcapStr+'</td>';
    h += '<td>'+pct.toFixed(1)+'%</td>';
    h += '<td class="'+(cagr>=0?'pos':'neg')+'">'+(cagr!=null?(cagr>=0?'+':'')+cagr.toFixed(0)+'%':'—')+'</td>';
    h += '<td class="'+(ret>=0?'pos':'neg')+'">'+(ret!=null?(ret>=0?'+':'')+ret.toFixed(0)+'%':'—')+'</td>';
    h += '<td class="'+(ytd>=0?'pos':'neg')+'">'+(ytd!=null?(ytd>=0?'+':'')+ytd.toFixed(1)+'%':'—')+'</td>';
    h += '<td class="'+(nm>=0?'pos':'neg')+'">'+(nm!=null?(nm>=0?'+':'')+nm.toFixed(1)+'%':'—')+'</td>';
    h += '<td>'+(avgPe!=null?avgPe.toFixed(1)+'x':'—')+'</td>';
    h += '</tr>';
  }
  h += '</table>';

  // Mcap distribution bar (visual)
  h += '<h2>Market-cap distribution by tier</h2>';
  h += '<div style="display:flex; height:30px; width:100%; border-radius:3px; overflow:hidden">';
  for (const t of tiers) {
    const g = groups[t];
    if (g.mcap <= 0) continue;
    const pct = (g.mcap / totalMcap) * 100;
    h += '<div style="width:'+pct.toFixed(2)+'%; background:'+(tierColor[t]||'#888')+'" title="'+t+' '+labels[t]+': '+pct.toFixed(1)+'%"></div>';
  }
  h += '</div>';
  h += '<p class="meta" style="font-size:11px; margin-top:4px">Hover a band for tier name + %. Width = share of total chain market cap.</p>';

  // Top 5 by mcap per tier
  h += '<h2>Top 5 mcap by tier</h2>';
  h += '<table style="font-size:12px"><tr><th>Tier</th><th>Top tickers (by mcap)</th></tr>';
  for (const t of tiers) {
    const g = groups[t];
    if (g.tickers.length === 0) continue;
    const top = [...g.tickers]
      .filter(tk => DATA[tk].mcap > 0)
      .sort((a,b) => DATA[b].mcap - DATA[a].mcap)
      .slice(0, 5);
    h += '<tr><td><b>'+t+'</b></td><td>';
    h += top.map(tk => {
      const mc = DATA[tk].mcap;
      const ms = mc >= 1e6 ? (mc/1e6).toFixed(1)+'T' : mc >= 1e3 ? (mc/1e3).toFixed(0)+'B' : mc.toFixed(0)+'M';
      return '<span class="pill pill-link" onclick="selectTicker(\\''+tk+'\\')">'+tk+' $'+ms+'</span>';
    }).join(' ');
    h += '</td></tr>';
  }
  h += '</table>';
  document.getElementById("detail").innerHTML = h;
}

function showCompareDetail(tickers) {
  const d = (t) => DATA[t];
  let h = '<h1 style="border:0; padding:0">Comparing '+tickers.length+' tickers</h1>';
  h += '<p class="meta">'+tickers.map(t => '<span class="pill">'+t+'</span>').join(' ')+'</p>';

  // Headline metrics table
  h += '<h2>Headline financials (latest FY)</h2>';
  h += '<table><tr><th>Metric</th>';
  for (const t of tickers) h += '<th>'+t+'</th>';
  h += '</tr>';

  const rows = [
    { label: 'Name', getter: t => d(t).info.name },
    { label: 'Tier / segment', getter: t => d(t).info.tier+' · '+d(t).info.segment },
    { label: 'Market cap', getter: t => {
        const mc = d(t).mcap;
        return mc == null ? '—' : (mc >= 1e6 ? '$'+(mc/1e6).toFixed(1)+'T' : mc >= 1e3 ? '$'+(mc/1e3).toFixed(1)+'B' : '$'+mc.toFixed(0)+'M');
    }},
    { label: 'Latest revenue', getter: t => {
        const f = d(t).f, latest = f && f.yr && f.yr[0];
        return latest ? fmtNative(latest.rev, f.ccy) : '—';
    }},
    { label: 'Net income', getter: t => {
        const f = d(t).f, latest = f && f.yr && f.yr[0];
        return latest ? fmtNative(latest.ni, f.ccy) : '—';
    }},
    { label: 'EPS', getter: t => {
        const f = d(t).f, latest = f && f.yr && f.yr[0];
        return latest && latest.eps != null ? latest.eps.toFixed(2) : '—';
    }},
    { label: '5yr rev CAGR', getter: t => fmtPct1(deriveMetrics(t).revCagr) },
    { label: '5yr price return', getter: t => fmtPct1(deriveMetrics(t).priceRet) },
    { label: 'YTD price return', getter: t => fmtPct1(deriveMetrics(t).ytdReturn) },
    { label: 'Net margin', getter: t => fmtPct1(deriveMetrics(t).netMargin) },
    { label: 'P/E', getter: t => fmtPe(deriveMetrics(t).pe) },
    { label: 'P/S', getter: t => fmtPs(deriveMetrics(t).ps) },
    { label: 'PEG', getter: t => {const v=deriveMetrics(t).peg; return v==null?'—':v.toFixed(2);} },
    { label: 'Decoupling', getter: t => {const v=deriveMetrics(t).decoupling; return v==null?'—':v.toFixed(1)+'×';} },
  ];
  for (const row of rows) {
    h += '<tr><td><b>'+row.label+'</b></td>';
    for (const t of tickers) h += '<td>'+row.getter(t)+'</td>';
    h += '</tr>';
  }
  h += '</table>';

  // Sparkline comparison: normalize each ticker to its 2021-05 start = 100
  h += '<h2>Price (rebased to 100 at 2021-05)</h2>';
  h += '<div style="background:#1d2129; padding:10px; border-radius:4px"><svg id="cmpchart" width="100%" viewBox="0 0 600 200" preserveAspectRatio="none" style="display:block"></svg></div>';
  h += '<p class="meta" style="font-size:11px">Each ticker rebased to 100 on its first available month — lets you see relative performance.</p>';

  // Supplier-customer overlap
  const upstreamCounts = {}, downstreamCounts = {};
  for (const t of tickers) {
    for (const u of d(t).info.key_upstream || []) if (DATA[u]) upstreamCounts[u] = (upstreamCounts[u]||0) + 1;
    for (const dn of d(t).info.key_downstream || []) if (DATA[dn]) downstreamCounts[dn] = (downstreamCounts[dn]||0) + 1;
  }
  const sharedUp = Object.entries(upstreamCounts).filter(([,c]) => c >= 2).sort((a,b)=>b[1]-a[1]);
  const sharedDn = Object.entries(downstreamCounts).filter(([,c]) => c >= 2).sort((a,b)=>b[1]-a[1]);
  if (sharedUp.length || sharedDn.length) {
    h += '<h2>Shared supply-chain connections</h2>';
    if (sharedUp.length) {
      h += '<p><b>Common upstream suppliers</b> (used by 2+ of these): ';
      h += sharedUp.map(([t,c]) => '<span class="pill pill-link" onclick="selectTicker(\\''+t+'\\')">'+t+' ('+c+')</span>').join(' ');
      h += '</p>';
    }
    if (sharedDn.length) {
      h += '<p><b>Common downstream customers</b> (selling to 2+ of these): ';
      h += sharedDn.map(([t,c]) => '<span class="pill pill-link" onclick="selectTicker(\\''+t+'\\')">'+t+' ('+c+')</span>').join(' ');
      h += '</p>';
    }
  }

  document.getElementById("detail").innerHTML = h;

  // Render rebased chart
  drawCompareChart(tickers);
}

function drawCompareChart(tickers) {
  const svg = document.getElementById("cmpchart");
  if (!svg) return;
  const W = 600, H = 200, P = 14;
  const palette = ["#8ab4f8","#80e080","#e6b450","#67b5d8","#f08080"];
  // Build normalized series
  const series = tickers.map((t, i) => {
    const p = DATA[t] && DATA[t].p;
    if (!p || p.length === 0) return null;
    const base = p[0][1];
    return { t, color: palette[i % palette.length], data: p.map(([m, c]) => [m, (c/base)*100]) };
  }).filter(Boolean);
  if (series.length === 0) { svg.innerHTML = '<text x="20" y="100" fill="#7a8395">No price data</text>'; return; }
  // x: month index across longest series
  const maxLen = Math.max(...series.map(s => s.data.length));
  const allVals = series.flatMap(s => s.data.map(d => d[1]));
  const min = Math.min(...allVals), max = Math.max(...allVals);
  const range = max - min || 1;
  let svgInner = '';
  // y-axis gridlines at 100, peak, trough
  const grid = [100, Math.round(max), Math.round(min)];
  for (const yv of grid) {
    const y = H - P - (H - 2*P) * (yv - min) / range;
    svgInner += '<line x1="'+P+'" y1="'+y.toFixed(1)+'" x2="'+(W-P)+'" y2="'+y.toFixed(1)+'" stroke="#2a2f38" stroke-width="0.5"/>';
    svgInner += '<text x="'+(W-P-2)+'" y="'+(y-2)+'" fill="#7a8395" font-size="9" text-anchor="end">'+yv+'</text>';
  }
  // Series lines
  for (const s of series) {
    const pts = s.data.map((d, j) => {
      const x = P + (W - 2*P) * j / Math.max(1, maxLen - 1);
      const y = H - P - (H - 2*P) * (d[1] - min) / range;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    svgInner += '<polyline points="'+pts+'" fill="none" stroke="'+s.color+'" stroke-width="1.4" opacity="0.9"/>';
  }
  // Legend
  series.forEach((s, i) => {
    svgInner += '<rect x="'+(P+i*100)+'" y="4" width="10" height="10" fill="'+s.color+'"/>';
    svgInner += '<text x="'+(P+i*100+14)+'" y="12" fill="#e3e7ed" font-size="10">'+s.t+'</text>';
  });
  svg.innerHTML = svgInner;
}

// === URL state ===
// Mirrors viewer state into window.location.search so any view (selected
// ticker + screen + compare + segment + edge mode + search) is bookmarkable.
let restoringFromUrl = false;
function updateUrl() {
  if (restoringFromUrl) return;
  const p = new URLSearchParams();
  if (selectedTicker) p.set("t", selectedTicker);
  if (compareSet && compareSet.size > 0) p.set("cmp", [...compareSet].join(","));
  const activeChip = document.querySelector(".preset-chip.active");
  if (activeChip) p.set("preset", activeChip.dataset.preset);
  if (activeScreen && !activeChip) {
    const parts = [];
    for (const [k, v] of Object.entries(activeScreen)) {
      if (v != null && v !== "") parts.push(k + ":" + v);
    }
    if (parts.length) p.set("screen", parts.join(","));
  }
  if (edgeWeightMode !== "uniform") p.set("edges", edgeWeightMode);
  const q = document.getElementById("search").value;
  if (q) p.set("q", q);
  const seg = document.getElementById("filter").value;
  if (seg) p.set("seg", seg);
  const newQs = p.toString();
  const newUrl = window.location.pathname + (newQs ? "?" + newQs : "") + window.location.hash;
  history.replaceState(null, "", newUrl);
}

const SCREEN_FIELD_MAP = {
  minMcap: "f-minMcap", maxMcap: "f-maxMcap",
  minCagr: "f-minCagr", maxCagr: "f-maxCagr",
  minRet:  "f-minRet",  maxRet:  "f-maxRet",
  minYtd:  "f-minYtd",  maxYtd:  "f-maxYtd",
  minPe:   "f-minPe",   maxPe:   "f-maxPe",
  minPs:   "f-minPs",   maxPs:   "f-maxPs",
  minPeg:  "f-minPeg",  maxPeg:  "f-maxPeg",
  minNm:   "f-minNm",   maxNm:   "f-maxNm",
  minDcp:  "f-minDcp",  maxDcp:  "f-maxDcp",
  tier:    "f-tier",
};

function restoreFromUrl() {
  const p = new URLSearchParams(window.location.search);
  if ([...p.keys()].length === 0) return;
  restoringFromUrl = true;
  try {
    const seg = p.get("seg");
    if (seg) { document.getElementById("filter").value = seg; draw(seg); }

    if (p.get("edges") === "dollar") {
      edgeWeightMode = "dollar";
      document.getElementById("ew-toggle").textContent = "Edges: $-scaled";
    }

    const preset = p.get("preset");
    const screenStr = p.get("screen");
    if (preset) {
      applyPreset(preset);
    } else if (screenStr) {
      for (const part of screenStr.split(",")) {
        const [k, v] = part.split(":");
        const id = SCREEN_FIELD_MAP[k];
        if (id) document.getElementById(id).value = v;
      }
      document.getElementById("screen-panel").classList.add("open");
      document.getElementById("screen-toggle").classList.add("active");
      applyScreen();
    }

    const cmp = p.get("cmp");
    if (cmp) {
      for (const t of cmp.split(",")) if (DATA[t]) compareSet.add(t);
      renderCompareBin();
    }

    const q = p.get("q");
    if (q) { document.getElementById("search").value = q; highlightFromSearch(q); }

    const t = p.get("t");
    if (t && DATA[t]) selectTicker(t);
  } finally {
    restoringFromUrl = false;
  }
}

document.getElementById("filter").addEventListener("change", e => {
  clearSelection();
  draw(e.target.value);
  updateUrl();
});
document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value;
  highlightFromSearch(q);
  if (q) {
    const ql = q.toLowerCase();
    const matches = Object.entries(DATA).filter(([t, d]) =>
      t.toLowerCase().includes(ql) || (d.info.name||"").toLowerCase().includes(ql));
    if (matches.length === 1) {
      // Single match — also select it (highlights connections + opens detail panel)
      selectTicker(matches[0][0]);
    }
  } else {
    clearSelection();
  }
  updateUrl();
});

// Initial render + restore-from-URL on load
draw();
restoreFromUrl();
</script>
</body></html>`;

fs.writeFileSync(path.join(ROOT, "index.html"), html);
fs.writeFileSync(path.join(ROOT, "viewer.html"), html);
console.log(`index.html + viewer.html: ${(html.length/1024).toFixed(0)} KB written`);
