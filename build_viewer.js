// Build a single-file interactive viewer.html with all data embedded.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const tickers = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "tickers.json"), "utf-8"));
const relPath = path.join(ROOT, "data", "relationships.json");
const relationships = fs.existsSync(relPath)
  ? JSON.parse(fs.readFileSync(relPath, "utf-8"))
  : { edges: {} };

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
const embedded = {};
for (const t of Object.keys(tickers.tickers)) {
  const fin = path.join(ROOT, "data", "financials", t + ".json");
  const prx = path.join(ROOT, "data", "prices", t + ".json");
  let f = null, p = null, lastPrice = null, fd = null;
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
  embedded[t] = { f, p, mcap, info: tickers.tickers[t] };
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
  #controls { padding: 12px; border-bottom: 1px solid #2a2f38; background: #0a0d12; }
  input, select { background: #1d2129; color: #e3e7ed; border: 1px solid #2a2f38; padding: 4px 8px; border-radius: 4px; font: inherit; }
  .legend { font-size: 11px; padding: 8px 12px; background: #0a0d12; border-top: 1px solid #2a2f38; }
  .legend span { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
  #sparkbox { background: #1d2129; padding: 8px; border-radius: 4px; margin-top: 8px; }
  a { color: #8ab4f8; }
</style>
</head>
<body>
<div id="app">
  <div>
    <div id="controls">
      <input id="search" placeholder="search ticker or name..." style="width: 300px">
      &nbsp;&nbsp;
      <select id="filter">
        <option value="">All segments</option>
      </select>
      &nbsp;&nbsp;
      <button onclick="clearSelection(); document.getElementById('search').value=''; resetView()">Reset</button>
    </div>
    <div id="graph" style="height: calc(100vh - 84px)"></div>
    <div class="legend" id="legend"></div>
  </div>
  <div id="tip"></div>
  <div id="side">
    <div id="detail"><p class="meta"><em>Hover a ticker for a quick view, click for the full detail panel. Hover an edge for relationship context.</em></p></div>
    <div id="footer-meta">
      <h1>AI / Quantum / Photonics Supply Chain</h1>
      <p>Click a node to inspect. Drag to pan, scroll to zoom.</p>
      <p>Data as of 2026-05-11. <a href="REPORT.md">Full narrative report</a> &middot; <a href="tickers.csv">CSV</a></p>
    </div>
  </div>
</div>

<script>
const DATA = ${JSON.stringify(embedded)};
const RELATIONSHIPS = ${JSON.stringify(relationships)};
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
legendHtml += '<span style="color:#7a8395">&nbsp; | &nbsp; arrow points supplier → customer ($ flows opposite) &nbsp; · &nbsp; dot size ∝ √mcap</span>';
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
    });
    seen.add(t);
  }
  for (const t in DATA) {
    if (filter && DATA[t].info.segment !== filter) continue;
    const info = DATA[t].info;
    for (const u of info.key_upstream || []) {
      if (seen.has(u) || !filter) {
        // create up-link
        if (DATA[u]) {
          links.push({ source: u, target: t });
        }
      }
    }
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
svg.addEventListener("mousedown", e => { dragStart = { x: e.clientX, y: e.clientY, tx: viewState.tx, ty: viewState.ty }; });
svg.addEventListener("mouseup", () => dragStart = null);
svg.addEventListener("mouseleave", () => dragStart = null);
svg.addEventListener("mousemove", e => {
  if (!dragStart) return;
  viewState.tx = dragStart.tx + (e.clientX - dragStart.x);
  viewState.ty = dragStart.ty + (e.clientY - dragStart.y);
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
  for (const n of nodes) n.radius = nodeRadius(n.id);

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

  // Render nodes (radius reflects market cap)
  for (const n of nodes) {
    const r = n.radius;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", \`translate(\${n.x} \${n.y})\`);
    g.style.cursor = "pointer";
    g.style.transition = "opacity 0.15s";
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", r.toFixed(2));
    c.setAttribute("fill", n.color);
    c.setAttribute("stroke", "#fff");
    c.setAttribute("stroke-width", "0.5");
    g.appendChild(c);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", (r + 3).toFixed(1));
    txt.setAttribute("y", "3");
    txt.setAttribute("fill", "#e3e7ed");
    txt.setAttribute("font-size", "10");
    txt.textContent = n.id;
    g.appendChild(txt);
    const baseR = r;
    g.addEventListener("click", e => { e.stopPropagation(); selectTicker(n.id); });
    g.addEventListener("mouseenter", e => {
      c.setAttribute("r", (baseR + 3).toFixed(2));
      showNodeTip(n.id, e);
    });
    g.addEventListener("mousemove", e => moveTip(e));
    g.addEventListener("mouseleave", () => {
      c.setAttribute("r", baseR.toFixed(2));
      hideTip();
    });
    nodeG.appendChild(g);
    renderState.nodeEls[n.id] = { g, circle: c, text: txt, color: n.color, baseR };
  }
  // Re-apply current highlight after redraw
  applyHighlight();
}

// Click on background clears selection
svg.addEventListener("click", e => {
  if (e.target === svg) clearSelection();
});

function selectTicker(ticker) {
  if (!DATA[ticker]) return;
  selectedTicker = ticker;
  // Highlight set: this ticker + every up/down neighbor in registry
  const info = DATA[ticker].info;
  const set = new Set([ticker]);
  for (const u of info.key_upstream || []) if (DATA[u]) set.add(u);
  for (const d of info.key_downstream || []) if (DATA[d]) set.add(d);
  highlightSet = set;
  applyHighlight();
  showDetail(ticker);
}

function clearSelection() {
  selectedTicker = null;
  highlightSet = null;
  applyHighlight();
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
  // Links
  for (const { el, source, target } of renderState.linkEls) {
    if (!highlightSet) {
      el.setAttribute("stroke", "#3a4150");
      el.setAttribute("stroke-width", "0.6");
      el.setAttribute("opacity", "0.55");
      el.setAttribute("marker-end", "url(#arrow-dim)");
    } else if (highlightSet.has(source) && highlightSet.has(target)) {
      el.setAttribute("stroke", "#8ab4f8");
      el.setAttribute("stroke-width", "1.4");
      el.setAttribute("opacity", "0.95");
      el.setAttribute("marker-end", "url(#arrow-hi)");
    } else {
      el.setAttribute("stroke", "#1d2129");
      el.setAttribute("stroke-width", "0.4");
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
  }

  const up = (info.key_upstream || []).filter(u => DATA[u]).length;
  const dn = (info.key_downstream || []).filter(u => DATA[u]).length;
  if (up || dn) {
    h += '<div class="tip-row" style="margin-top:6px; color:#7a8395; font-size:11px">';
    h += up + ' upstream &middot; ' + dn + ' downstream (in registry)';
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
  const e = RELATIONSHIPS.edges && RELATIONSHIPS.edges[key];
  if (e) return { ...e, curated: true, source, target };
  // Synthesized fallback for un-curated edges
  const s = DATA[source], t = DATA[target];
  if (!s || !t) return null;
  return {
    curated: false,
    source, target,
    what_flows: \`\${s.info.role_in_chain || s.info.segment} → \${t.info.role_in_chain || t.info.segment}\`,
    importance: null,
    annual_usd_billions: null,
    single_source_risk: null,
    trend: null
  };
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
  let h = '<h1>'+ticker+' &mdash; '+info.name+'</h1>';
  h += '<p class="meta"><span class="pill">'+info.tier+' / '+info.segment+'</span>';
  if (d.mcap) {
    const mcapDisplay = d.mcap >= 1e6 ? '$' + (d.mcap/1e6).toFixed(2) + 'T'
                       : d.mcap >= 1e3 ? '$' + (d.mcap/1e3).toFixed(1) + 'B'
                       : '$' + d.mcap.toFixed(0) + 'M';
    h += ' &nbsp;<span class="pill" style="background:#15171c;color:#80e080">~' + mcapDisplay + ' mcap</span>';
  }
  h += '</p>';
  h += '<p style="font-size:13px">'+info.role_in_chain+'</p>';

  const pillFor = (u) => DATA[u]
    ? '<span class="pill pill-link" onclick="selectTicker(\\''+u+'\\')">'+u+'</span>'
    : '<span class="pill pill-extern" title="not in registry (private / foreign-only / categorical)">'+u+'</span>';
  h += '<h2>Upstream (depends on)</h2><p>';
  h += (info.key_upstream || []).map(pillFor).join(" ") || '<em class="meta">none in registry</em>';
  h += '</p><h2>Downstream (serves)</h2><p>';
  h += (info.key_downstream || []).map(pillFor).join(" ") || '<em class="meta">none in registry</em>';
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

  if (d.p && d.p.length) {
    h += '<h2>Monthly close ('+d.p.length+' months)</h2>';
    const first = d.p[0][1]; const last = d.p[d.p.length-1][1];
    const ret = first ? ((last/first - 1) * 100) : null;
    const retCls = (ret != null && ret < 0) ? 'neg' : 'pos';
    h += '<p>From '+d.p[0][0]+' ('+first.toFixed(2)+') to '+d.p[d.p.length-1][0]+' ('+last.toFixed(2)+') &mdash; ';
    h += '<span class="'+retCls+'">'+(ret>=0?'+':'')+ret.toFixed(0)+'%</span></p>';
    h += '<div id="sparkbox"><svg id="spark" width="380" height="100"></svg></div>';
  }

  document.getElementById("detail").innerHTML = h;

  if (d.p && d.p.length) {
    const spark = document.getElementById("spark");
    const W = 380, H = 100, P = 10;
    const min = Math.min(...d.p.map(x => x[1]));
    const max = Math.max(...d.p.map(x => x[1]));
    const range = max - min || 1;
    const pts = d.p.map((r, i) => {
      const x = P + (W - 2*P) * i / (d.p.length - 1);
      const y = H - P - (H - 2*P) * (r[1] - min) / range;
      return x+","+y;
    }).join(" ");
    spark.innerHTML = '<polyline points="'+pts+'" fill="none" stroke="#8ab4f8" stroke-width="1.5"/>';
  }
}

document.getElementById("filter").addEventListener("change", e => {
  clearSelection();
  draw(e.target.value);
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
});

draw();
</script>
</body></html>`;

fs.writeFileSync(path.join(ROOT, "viewer.html"), html);
console.log(`viewer.html: ${(html.length/1024).toFixed(0)} KB written`);
