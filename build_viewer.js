// Build a single-file interactive viewer.html with all data embedded.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const tickers = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "tickers.json"), "utf-8"));

// Embed per-ticker financials + prices summary (compact form to keep HTML reasonable)
const embedded = {};
for (const t of Object.keys(tickers.tickers)) {
  const fin = path.join(ROOT, "data", "financials", t + ".json");
  const prx = path.join(ROOT, "data", "prices", t + ".json");
  let f = null, p = null;
  if (fs.existsSync(fin)) {
    try {
      const fd = JSON.parse(fs.readFileSync(fin, "utf-8"));
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
      }
    } catch (e) {}
  }
  embedded[t] = { f, p, info: tickers.tickers[t] };
}

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<title>AI Supply Chain Explorer</title>
<style>
  body { font: 14px/1.4 -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; background: #0e1116; color: #e3e7ed; }
  #app { display: grid; grid-template-columns: 1fr 420px; height: 100vh; }
  #graph { background: #0a0d12; }
  #side { padding: 20px; overflow-y: auto; border-left: 1px solid #2a2f38; }
  h1 { font-size: 16px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid #2a2f38; }
  h2 { font-size: 13px; margin: 16px 0 6px; color: #8ab4f8; }
  .meta { color: #97a3b6; font-size: 12px; }
  .pill { display: inline-block; background: #1d2129; color: #8ab4f8; padding: 1px 7px; border-radius: 10px; font-size: 11px; margin-right: 4px; margin-bottom: 4px; }
  .pill-link { cursor: pointer; }
  .pill-link:hover { background: #2a3a55; }
  .pill-extern { color: #97a3b6; background: #15171c; }
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
  <div id="side">
    <h1>AI / Quantum / Photonics Supply Chain</h1>
    <p class="meta">Click a node to inspect. Drag to pan, scroll to zoom.<br>
    Data as of 2026-05-11. <a href="REPORT.md">Full narrative report</a> &middot; <a href="tickers.csv">CSV</a></p>
    <div id="detail"><p class="meta"><em>Click a ticker on the graph to see details.</em></p></div>
  </div>
</div>

<script>
const DATA = ${JSON.stringify(embedded)};
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
for (const t in tierColor) {
  legendEl.innerHTML += '<span style="background:'+tierColor[t]+'"></span>'+tierLabel[t]+' &nbsp; ';
}

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
const linkG = document.createElementNS("http://www.w3.org/2000/svg", "g"); svg.appendChild(linkG);
const nodeG = document.createElementNS("http://www.w3.org/2000/svg", "g"); svg.appendChild(nodeG);

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

  // Render links
  for (const l of links) {
    const s = nodeMap[l.source]; const t = nodeMap[l.target];
    if (!s || !t) continue;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const mid = (s.x + t.x) / 2;
    line.setAttribute("d", \`M\${s.x},\${s.y} C\${mid},\${s.y} \${mid},\${t.y} \${t.x},\${t.y}\`);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "#2a2f38");
    line.setAttribute("stroke-width", "0.6");
    line.setAttribute("opacity", "0.5");
    linkG.appendChild(line);
    renderState.linkEls.push({ el: line, source: l.source, target: l.target });
  }
  // Render nodes
  for (const n of nodes) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", \`translate(\${n.x} \${n.y})\`);
    g.style.cursor = "pointer";
    g.style.transition = "opacity 0.15s";
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", "6");
    c.setAttribute("fill", n.color);
    c.setAttribute("stroke", "#fff");
    c.setAttribute("stroke-width", "0.5");
    g.appendChild(c);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", "9");
    txt.setAttribute("y", "3");
    txt.setAttribute("fill", "#e3e7ed");
    txt.setAttribute("font-size", "10");
    txt.textContent = n.id;
    g.appendChild(txt);
    g.addEventListener("click", e => { e.stopPropagation(); selectTicker(n.id); });
    g.addEventListener("mouseenter", () => { c.setAttribute("r", "9"); });
    g.addEventListener("mouseleave", () => { c.setAttribute("r", "6"); });
    nodeG.appendChild(g);
    renderState.nodeEls[n.id] = { g, circle: c, text: txt, color: n.color };
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
      el.setAttribute("stroke", "#2a2f38");
      el.setAttribute("stroke-width", "0.6");
      el.setAttribute("opacity", "0.5");
    } else if (highlightSet.has(source) && highlightSet.has(target)) {
      el.setAttribute("stroke", "#8ab4f8");
      el.setAttribute("stroke-width", "1.4");
      el.setAttribute("opacity", "0.9");
    } else {
      el.setAttribute("stroke", "#1d2129");
      el.setAttribute("stroke-width", "0.4");
      el.setAttribute("opacity", "0.15");
    }
  }
}

function showDetail(ticker) {
  const d = DATA[ticker];
  if (!d) return;
  const info = d.info;
  let h = '<h1>'+ticker+' &mdash; '+info.name+'</h1>';
  h += '<p class="meta"><span class="pill">'+info.tier+' / '+info.segment+'</span></p>';
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
