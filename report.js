// Generate REPORT.md from the per-ticker JSON files + tickers.csv registry.
// Run after aggregate.js: node report.js

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const FIN_DIR = path.join(ROOT, "data", "financials");
const PRICE_DIR = path.join(ROOT, "data", "prices");

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf-8");
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ""; });
    return obj;
  });
}

function parseCsvLine(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else {
      if (ch === ",") { out.push(cur); cur = ""; }
      else if (ch === '"') q = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

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

function loadFinancials(ticker) {
  const f = path.join(FIN_DIR, ticker + ".json");
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, "utf-8")); } catch (e) { return null; }
}

function loadPrices(ticker) {
  const f = path.join(PRICE_DIR, ticker + ".json");
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, "utf-8")); } catch (e) { return null; }
}

function getPriceSummary(ticker) {
  const p = loadPrices(ticker);
  if (!p || p.status === "no_data") return null;
  let pairs = [];
  if (Array.isArray(p.monthly_closes)) {
    pairs = p.monthly_closes.map(r => [r.month, r.close]);
  } else if (typeof p.monthly_closes_csv === "string") {
    pairs = p.monthly_closes_csv.split("|").filter(c => c.includes(":")).map(c => {
      const [m, v] = c.split(":"); return [m, parseFloat(v)];
    });
  }
  if (pairs.length === 0) return null;
  // First, last, and key year-end snapshots
  const first = pairs[0];
  const last = pairs[pairs.length - 1];
  const find = (mp) => {
    const r = pairs.find(([m]) => m === mp);
    return r ? r[1] : null;
  };
  const ret5y = first[1] > 0 ? ((last[1] / first[1]) - 1) * 100 : null;
  return {
    first_month: first[0],
    first_close: first[1],
    last_month: last[0],
    last_close: last[1],
    ret_5y_pct: ret5y,
    eoy_2021: find("2021-12"),
    eoy_2022: find("2022-12"),
    eoy_2023: find("2023-12"),
    eoy_2024: find("2024-12"),
    eoy_2025: find("2025-12"),
    currency: p.currency_native || "USD",
    count: pairs.length,
  };
}

function fmtUsd(v) {
  if (v == null || v === "") return "—";
  if (Math.abs(v) >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
  if (Math.abs(v) >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  if (Math.abs(v) >= 1e3) return "$" + (v / 1e3).toFixed(0) + "K";
  return "$" + v.toFixed(2);
}

function fmtPct(v) {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(0) + "%";
}

function fmtNumber(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "string") v = parseFloat(v);
  if (isNaN(v)) return "—";
  return v.toFixed(2);
}

function unitsMult(units) {
  if (!units) return 1_000_000;
  const u = String(units).toLowerCase();
  if (u.includes("million")) return 1_000_000;
  if (u.includes("thousand")) return 1_000;
  if (u.includes("billion")) return 1_000_000_000;
  return 1;
}

function getFinancialSummary(ticker) {
  const data = loadFinancials(ticker);
  if (!data || data.status === "no_data") return null;
  const ccy = data.currency_native || "USD";
  const mult = unitsMult(data.units_fetched);
  const fxFor = (fy) => (FX[ccy] && FX[ccy][fy] != null) ? FX[ccy][fy] : null;
  const years = (data.fiscal_years || []).map(fy => {
    const fx = fxFor(fy.fy);
    const rev_full = typeof fy.revenue_native === "number" ? fy.revenue_native * mult : null;
    const ni_full = typeof fy.net_income_native === "number" ? fy.net_income_native * mult : null;
    return {
      fy: fy.fy,
      fye: fy.fye || fy.fye_date,
      revenue_usd: (rev_full != null && fx != null) ? rev_full * fx : null,
      net_income_usd: (ni_full != null && fx != null) ? ni_full * fx : null,
      eps: fy.eps_diluted_native ?? fy.eps_diluted,
      eps_usd: (typeof fy.eps_diluted_native === "number" && fx != null) ? fy.eps_diluted_native * fx : null,
    };
  });
  // Compute 5y revenue CAGR
  if (years.length >= 2) {
    const sorted = [...years].sort((a, b) => a.fy - b.fy);
    const first = sorted[0].revenue_usd;
    const last = sorted[sorted.length - 1].revenue_usd;
    const n = sorted[sorted.length - 1].fy - sorted[0].fy;
    if (first && last && n > 0) {
      years.cagr_pct = (Math.pow(last / first, 1 / n) - 1) * 100;
    }
  }
  return { ccy, years };
}

function rowForCompany(t, info) {
  const fin = getFinancialSummary(t);
  const px = getPriceSummary(t);
  const latestRev = fin?.years?.[0]?.revenue_usd;
  const latestNi = fin?.years?.[0]?.net_income_usd;
  const latestEps = fin?.years?.[0]?.eps_usd ?? fin?.years?.[0]?.eps;
  const cagr = fin?.years?.cagr_pct;
  const ret5y = px?.ret_5y_pct;
  return {
    ticker: t,
    name: info.name,
    segment: info.segment,
    tier: info.tier,
    revenue_usd: latestRev,
    net_income_usd: latestNi,
    eps: latestEps,
    cagr_pct: cagr,
    px_5y_ret_pct: ret5y,
    px_last: px?.last_close,
  };
}

// =====================
// MAIN
// =====================

const tickersData = readCsv(path.join(ROOT, "tickers.csv"));
const byTicker = {};
for (const row of tickersData) byTicker[row.ticker] = row;

// Map raw segment strings to broader categories
function broadCategory(tier, segment) {
  const s = (segment || "").toLowerCase();
  if (tier === "U5") return "Mining & raw materials";
  if (tier === "U4" && (s.includes("wafer") || s.includes("substrate") || s.includes("sic") || s.includes("soi"))) return "Wafer materials & substrates";
  if (tier === "U4") return "Specialty gases & chemicals";
  if (tier === "U3" && (s.includes("wfe") || s.includes("mocvd") || s.includes("ald") || s.includes("bonding"))) return "Wafer fab equipment (WFE)";
  if (tier === "U3" && (s.includes("eda") || s.includes("simulation") || s.includes("test") || s.includes("measurement") || s.includes("ip") || s.includes("chip ip") || s.includes("memory ip"))) return "EDA, chip IP, test & measurement";
  if (tier === "U3") return "WFE / EDA other";
  if (tier === "U2" && (s.includes("memory") || s.includes("storage"))) return "Memory & storage";
  if (tier === "U2" && (s.includes("foundry") || s.includes("osat"))) return "Foundry & OSAT";
  if (tier === "U2") return "Foundry & OSAT";
  if (tier === "U1" && (s.includes("networking") || s.includes("photonic") || s.includes("optical") || s.includes("laser") || s.includes("mocvd"))) return "Networking & photonics";
  if (tier === "U1") return "AI chip design + adjacent semis";
  if (tier === "AI core") return "AI server builders";
  if (tier === "D1" && (s.includes("software") || s.includes("saas") || s.includes("crm") || s.includes("erp") || s.includes("security") || s.includes("data") || s.includes("observ") || s.includes("engagement") || s.includes("creative") || s.includes("connected") || s.includes("edge") || s.includes("search") || s === "automation")) return "AI software, MLOps & security";
  if (tier === "D1") return "Hyperscalers & end-users";
  if (tier === "D2" && (s.includes("reit") || s.includes("data-center"))) return "Data-center REITs";
  if (tier === "D2" && (s.includes("power") || s.includes("electrical") || s.includes("ups") || s.includes("switchgear") || s.includes("battery") || s.includes("automation"))) return "Power & electrical equipment";
  if (tier === "D2" && (s.includes("cooling") || s.includes("hvac") || s.includes("thermal") || s.includes("water"))) return "Cooling / HVAC";
  if (tier === "D2" && (s.includes("nuclear") || s.includes("utility") || s.includes("ipp") || s.includes("smr") || s.includes("micro-reactor") || s.includes("renewable") || s.includes("fuel"))) return "Utilities / IPP / SMR / nuclear";
  if (tier === "D2" && (s.includes("lng") || s.includes("gas pipe") || s.includes("midstream"))) return "Gas / LNG midstream";
  if (tier === "D2") return "Power & electrical equipment";
  if (tier === "D3" && (s.includes("fiber") || s.includes("cabling") || s.includes("glass"))) return "Fiber / cabling / glass";
  if (tier === "D3") return "Construction / EPC / infra";
  if (tier === "D4") return "Waste / recycling";
  if (tier === "Q") return "Quantum (pure-plays & diversified)";
  return "Other";
}

const segments = {};
for (const row of tickersData) {
  const cat = broadCategory(row.tier, row.segment);
  if (!segments[cat]) segments[cat] = [];
  segments[cat].push(row);
}

const categoryOrder = [
  "Mining & raw materials",
  "Specialty gases & chemicals",
  "Wafer materials & substrates",
  "Wafer fab equipment (WFE)",
  "EDA, chip IP, test & measurement",
  "Foundry & OSAT",
  "Memory & storage",
  "AI chip design + adjacent semis",
  "Networking & photonics",
  "AI server builders",
  "Hyperscalers & end-users",
  "AI software, MLOps & security",
  "Data-center REITs",
  "Power & electrical equipment",
  "Utilities / IPP / SMR / nuclear",
  "Gas / LNG midstream",
  "Cooling / HVAC",
  "Construction / EPC / infra",
  "Fiber / cabling / glass",
  "Waste / recycling",
  "Quantum (pure-plays & diversified)",
];

// Helpers
function table(rows, columns) {
  const header = "| " + columns.map(c => c.title).join(" | ") + " |";
  const sep = "| " + columns.map(() => "---").join(" | ") + " |";
  const body = rows.map(r => "| " + columns.map(c => c.fmt(r[c.key], r)).join(" | ") + " |");
  return [header, sep, ...body].join("\n");
}

const columnsSegment = [
  { key: "ticker", title: "Ticker", fmt: (v, r) => `[${v}](https://stockanalysis.com/stocks/${v.toLowerCase()}/)` },
  { key: "name", title: "Name", fmt: v => v || "—" },
  { key: "revenue_usd", title: "Rev (FY-latest)", fmt: fmtUsd },
  { key: "net_income_usd", title: "Net inc", fmt: fmtUsd },
  { key: "eps", title: "EPS", fmt: fmtNumber },
  { key: "cagr_pct", title: "5y Rev CAGR", fmt: v => v == null ? "—" : fmtPct(v) },
  { key: "px_5y_ret_pct", title: "5y px return", fmt: v => v == null ? "—" : fmtPct(v) },
];

// =====================
// Build report
// =====================

const lines = [];

lines.push("# AI · Quantum · Photonics Buildout Supply Chain — Public Markets Map");
lines.push("");
lines.push(`**Snapshot date:** 2026-05-11 · **Coverage:** ${Object.keys(byTicker).length} publicly traded tickers (US-listed including OTC ADRs) · **Financial window:** 5 most recent fiscal years per filer · **Price window:** monthly closes 2021-05 → 2026-04 (+ partial 2026-05)`);
lines.push("");

// Executive summary
lines.push("## Executive summary");
lines.push("");
lines.push("This dataset traces every publicly investable link in the chain that turns mined raw materials into deployed AI compute, quantum hardware, and photonic interconnect — covering 2+ steps both upstream (silicon → wafers → gases → mining) and downstream (server → cloud → power → cooling → real estate → construction → recycling).");
lines.push("");
lines.push("**Anchor stack (illustrative):** SMCI builds rack-scale AI servers using NVDA GPUs → NVDA chips are fabbed by TSM → TSM uses ASML EUV scanners + AMAT/LRCX/KLAC tools + Shin-Etsu/SUMCO wafers + LIN/APD specialty gases → those gases trace back to FCX copper, MP rare earths, BHP/RIO industrial metals. Downstream: SMCI servers ship to MSFT/META/xAI clusters → housed in DLR/EQIX data centers → powered by CEG/VST/TLN PPAs → cooled by VRT/JCI/MOD → built by PWR/MTZ EPCs → fed by GLW fiber → and ultimately decommissioned by WM/SMSMY.");
lines.push("");
lines.push("**Cross-cuts:** Photonics names (COHR, LITE, IPGP, LASR) show up in three places — AI optical interconnect, EUV light sources for ASML, and trapped-ion lasers for quantum (IONQ, HON/Quantinuum). Power & nuclear (CEG, VST, TLN, GEV, OKLO, BWX) are the most leveraged downstream beneficiaries of the AI capex wave. Materials chokepoints (rare earths via MP/LYSDY, neon/helium via LIN/APD/AIQUY, silicon wafers via SHECY/SUOPY) are quietly the most concentrated parts of the chain.");
lines.push("");
lines.push("**Known gaps (private / not US-listed):** xAI, OpenAI, Anthropic, Mistral, Groq, Cerebras (AI labs); BlueFors, Oxford Instruments (quantum cryogenics); SK Hynix, Tokyo Electron, Disco (foreign-listed only); Big Law (partnerships).");
lines.push("");

// Supply chain map
lines.push("## Supply chain map (tier flow)");
lines.push("");
lines.push("```");
lines.push("Mining/raw materials  →  Gases/chemicals    →  Wafers/substrates");
lines.push("  FCX SCCO MP LYSDY        LIN APD AIQUY          WOLF SHECY SUOPY SOIGY");
lines.push("  UUUU BHP RIO ALB         DD DOW ECL CE IFF      (Coherent COHR also fits)");
lines.push("                                  ↓");
lines.push("                       WFE + EDA + IP");
lines.push("            ASML AMAT LRCX KLAC TER ONTO ENTG ICHR UCTT");
lines.push("            ACMR KLIC AEHR ASMIY BESIY VECO  |  SNPS CDNS ANSS KEYS  |  ARM RMBS");
lines.push("                                  ↓");
lines.push("                       Foundry + Memory + OSAT");
lines.push("              TSM GFS UMC INTC SSNLF  |  MU WDC STX  |  ASX AMKR");
lines.push("                                  ↓");
lines.push("                       AI silicon design");
lines.push("       NVDA AMD AVGO MRVL QCOM ARM MBLY LSCC MPWR ON ADI TXN MCHP MTSI POWI VICR NVTS AOSL");
lines.push("                                  ↓");
lines.push("                       Networking + Photonics");
lines.push("         ANET CSCO JNPR CIEN  |  COHR LITE IPGP LASR POET VECO");
lines.push("                                  ↓");
lines.push("                ┌─────────  AI SERVER BUILDERS  ─────────┐");
lines.push("                │       SMCI  DELL  HPE  LNVGY            │");
lines.push("                └────────────────────────────────────────┘");
lines.push("                                  ↓");
lines.push("                       Hyperscaler / enterprise compute");
lines.push("              MSFT GOOGL AMZN META ORCL AAPL TSLA IBM PLTR");
lines.push("                                  ↓");
lines.push("    Data-center real estate         Power / utilities          Cooling / HVAC");
lines.push("        DLR EQIX IRM                CEG VST TLN NEE ETR        VRT JCI TT MOD AAON");
lines.push("                                    SO DUK D AEP GEV ETN       LII WTS ROK NVT");
lines.push("                                    HUBB SBGSY ABBNY ENS");
lines.push("                                    POWL OKLO SMR NNE BWX");
lines.push("                                    LNG KMI OKE WMB TRGP");
lines.push("                                  ↓");
lines.push("                       Construction / EPC / fiber");
lines.push("          PWR MTZ KBR FLR J ACM EME DY PRIM STRL AGX VMI  |  GLW COMM BEL");
lines.push("                                  ↓");
lines.push("                       AI software / MLOps / security");
lines.push("       PLTR AI SNOW DDOG MDB ESTC NET NOW CRM ADBE SAP CRWD PANW ZS IOT PATH BRZE");
lines.push("                                  ↓");
lines.push("                       Waste / recycling / e-waste");
lines.push("              WM RSG WCN CWST GFL VEOEY SMSMY");
lines.push("");
lines.push("Cross-cuts:  COHR  →  ASML lasers + AI optics + quantum lasers");
lines.push("             IPGP/LASR  →  industrial + defense + quantum");
lines.push("             LIN/APD/AIQUY  →  fab gases + helium for dilution refrigerators (quantum)");
lines.push("             MP/LYSDY/UUUU  →  rare-earth magnets in servers + EVs + defense");
lines.push("");
lines.push("Quantum stack:  IONQ RGTI QUBT QBTS ARQQ  +  HON IBM GOOG MSFT INTC (diversified)");
lines.push("```");
lines.push("");

// Per-segment commentary
lines.push("## Per-segment commentary + financial tables");
lines.push("");
lines.push("All revenue/net-income figures USD, converted from native at fiscal-year-end FX rates. EPS shown in **native currency per share** (ADR ratios noted in tickers.csv). 5y revenue CAGR computed across the 5 fiscal years on file. 5y price return computed from 2021-05 close to latest close (currency_native).");
lines.push("");

// Category narratives
const catBlurb = {
  "Mining & raw materials": "The most upstream public exposure: copper for cabling/transformers, rare earths for magnets in servers & EVs, lithium for grid storage. China dominates rare-earth processing; MP & LYSDY are the only meaningful non-China public players.",
  "Specialty gases & chemicals": "Fabs run on industrial gases (LIN/APD/AIQUY) — neon for excimer lasers, ultra-pure H2/N2/O2, helium for cooling. Photoresist + advanced materials from DD/DOW/IFF. Single-source choke points abound (helium-3 for quantum dilution refrigerators).",
  "Wafer materials & substrates": "Silicon wafers are a Japan duopoly (Shin-Etsu SHECY + SUMCO SUOPY). Soitec (SOIGY) leads SOI for RF/photonics. Wolfspeed (WOLF) is the only public SiC wafer pure-play — restructuring 2025.",
  "Wafer fab equipment (WFE)": "ASML's EUV monopoly enables sub-7nm. AMAT/LRCX/KLAC cover deposition/etch/inspection. Hybrid bonding for HBM is BESI (BESIY) + ASMI (ASMIY). Subsystem layer (ICHR/UCTT/ENTG) sits underneath.",
  "EDA, chip IP, test & measurement": "Chip design impossible without SNPS/CDNS tools + ARM cores. ANSS being absorbed by SNPS. KEYS + TER provide RF and ATE test instruments.",
  "Foundry & OSAT": "TSM ~62% of foundry; GFS/UMC mature nodes; INTC pivoting to external foundry. OSAT (ASX/AMKR) does the back-end packaging — increasingly value-additive with CoWoS/advanced packaging.",
  "Memory & storage": "HBM is the new gold: MU + Samsung (SSNLF) + SK Hynix (KRX-only) supply NVDA. WDC split off SanDisk (now SDDXD) in 2025. STX rides HAMR upgrade cycle for hyperscaler nearline.",
  "AI chip design + adjacent semis": "NVDA's ~90% AI training GPU share + AMD MI300/350 + AVGO/MRVL custom AI ASICs for hyperscalers. Power-management long tail (MPWR/VICR/NVTS/MPWR) is the most NVDA-coupled.",
  "Networking & photonics": "AI fabrics (ANET, AVGO/MRVL/CSCO silicon) + optical interconnect (COHR/LITE) + lasers (IPGP/LASR/COHR). Photonics shows up here, in EUV light sources, and in trapped-ion quantum.",
  "AI server builders": "Where it all ends up: SMCI/DELL/HPE/LNVGY assemble the rack-scale GPU clusters. Margins thin; volume is everything.",
  "Hyperscalers & end-users": "The buyers: MSFT/META/AMZN/GOOG dominate. ORCL/TSLA/AAPL/IBM/PLTR are large but distant followers. xAI/OpenAI/Anthropic are private; closest proxy is MSFT (OpenAI investor).",
  "AI software, MLOps & security": "Software layer riding inferencing demand: PLTR (highest growth), SNOW/MDB/DDOG (data + observability), CRWD/PANW/ZS (security for AI workloads).",
  "Data-center REITs": "Capacity is the bottleneck. DLR + EQIX dominate. IRM moving fast into data-center build.",
  "Power & electrical equipment": "Grid + UPS + transformers + switchgear. GEV (just-spun-off) the biggest. VRT/ETN/ENS/HUBB are NVDA-coupled.",
  "Utilities / IPP / SMR / nuclear": "Power generation is the AI build-out's bottleneck. CEG/VST/TLN signing 10-20yr nuclear PPAs with hyperscalers. SMR pure-plays OKLO/SMR/NNE pre-revenue but speculative. BWX fuels everything.",
  "Gas / LNG midstream": "Gas turbines power most new data-center additions. LNG/KMI/OKE/WMB/TRGP are the fuel-delivery layer.",
  "Cooling / HVAC": "Liquid cooling is forced by NVDA GB200/GB300. VRT + MOD + NVT + JCI are the picks-and-shovels here.",
  "Construction / EPC / infra": "Building the data centers + the power that feeds them. PWR + MTZ dominate utility transmission build; STRL + AGX + EME the site / mechanical layer.",
  "Fiber / cabling / glass": "GLW (Corning) for optical fiber + display glass; COMM + BEL for cabling. Quietly enabled by hyperscaler capex.",
  "Waste / recycling": "End-of-life: WM/RSG/WCN/CWST/GFL handle the waste streams; SMSMY/VEOEY specifically target e-waste / metal recovery from decommissioned servers.",
  "Quantum (pure-plays & diversified)": "5 pure-plays mostly pre-revenue (IONQ trapped ion most advanced commercially; QBTS only one with material commercial revenue). HON owns majority of Quantinuum. IBM + GOOG + MSFT + INTC have research-grade systems via internal labs.",
};

for (const cat of categoryOrder) {
  const members = segments[cat];
  if (!members || members.length === 0) continue;
  const rows = members.map(m => rowForCompany(m.ticker, m));
  rows.sort((a, b) => (b.revenue_usd || 0) - (a.revenue_usd || 0));
  lines.push(`### ${cat} (${members.length} tickers)`);
  if (catBlurb[cat]) {
    lines.push("");
    lines.push(catBlurb[cat]);
  }
  lines.push("");
  lines.push(table(rows, columnsSegment));
  lines.push("");
}

// Cross-cuts
lines.push("## Cross-cuts");
lines.push("");
lines.push("**Photonics players spanning AI + quantum:**");
lines.push("- **COHR (Coherent):** EUV CO2 lasers for ASML lithography, 800G/1.6T optical transceivers for AI fabrics, lasers for trapped-ion quantum. Three structural growth drivers in one company.");
lines.push("- **LITE (Lumentum):** Optical transceivers for AI + iPhone VCSELs + quantum-adjacent lasers.");
lines.push("- **IPGP, LASR:** Industrial + defense + quantum (cooling laser systems).");
lines.push("");
lines.push("**Power names with the biggest AI-PPA leverage:**");
lines.push("- **CEG (Constellation):** Three Mile Island restart for 20-yr Microsoft PPA — first dedicated nuclear-AI deal.");
lines.push("- **VST (Vistra):** Texas + Comanche Peak nuclear; large hyperscaler pipeline.");
lines.push("- **TLN (Talen):** Susquehanna nuclear + Cumulus AI campus sold to Amazon.");
lines.push("- **GEV (GE Vernova):** Gas turbines + grid + BWRX-300 SMR; AI capex backlog through 2027.");
lines.push("- **OKLO, SMR, NNE, BWX:** Pre-revenue SMR plays + BWX as fuel monopolist.");
lines.push("");
lines.push("**Materials chokepoints (single points of failure):**");
lines.push("- Rare-earth magnets: MP (only operating US mine) + LYSDY (sole non-China processor at scale).");
lines.push("- Helium-3 (dilution refrigerators for quantum): LIN + APD + AIQUY tightly controlled.");
lines.push("- EUV pellicles + photoresist: mostly Japan (Shin-Etsu SHECY, JSR private).");
lines.push("- Silicon wafers: Shin-Etsu (SHECY) + SUMCO (SUOPY) duopoly.");
lines.push("- Neon gas (excimer laser fuel): historically Ukraine-concentrated; now diversified to LIN/APD on-site at fabs.");
lines.push("");
lines.push("**Liquid-cooling beneficiaries (NVDA GB200/GB300 wave):**");
lines.push("- **VRT (Vertiv):** Coolant Distribution Units (CDUs) for rack-level liquid cooling.");
lines.push("- **MOD (Modine):** Airedale heat rejection + CDUs for AI servers.");
lines.push("- **NVT (nVent):** Trachte enclosures + busbars + liquid-cooled cabinets.");
lines.push("- **JCI (Johnson Controls):** Silent-Aire / YORK chillers.");
lines.push("");

// Gaps & caveats
lines.push("## Gaps & caveats");
lines.push("");
lines.push("**Private companies (no public investable proxy):**");
lines.push("- AI foundation-model labs: xAI, OpenAI (MSFT-aligned), Anthropic (AMZN/GOOGL-aligned), Mistral, Cohere, Groq, Cerebras, Tenstorrent.");
lines.push("- AI infra/cloud: CoreWeave (IPO'd 2025 as CRWV — added in v2; not in this snapshot), Lambda Labs.");
lines.push("- Quantum cryogenics: BlueFors (Finland, private); Oxford Instruments (UK only OXIG.L).");
lines.push("- Specialty subsystems: Zeiss SMT (EUV optics, owned by Carl Zeiss AG private), TRUMPF (EUV CO2 laser source, German private).");
lines.push("- EUV photoresist: JSR (taken private 2024), Tokyo Ohka Kogyo (Japan only TOOCY OTC).");
lines.push("");
lines.push("**Excluded foreign-only listings (user choice):**");
lines.push("- SK Hynix (#2 DRAM, dominant HBM supplier) — only KRX 000660.");
lines.push("- Tokyo Electron (TEL) — only TSE 8035.T (OTC TOELY unsponsored).");
lines.push("- Disco Corp (semiconductor dicing) — only TSE 6146.T.");
lines.push("- SMIC, NAURA, AMEC (China semi/equipment) — A-shares + HK; under US entity list.");
lines.push("");
lines.push("**Data caveats:**");
lines.push("- FX conversions use approximate fiscal-year-end rates from public references (full table in `notes/caveats.md`); precise FY-end rates may differ ±1-2% vs. broker-quality data.");
lines.push("- For ADRs of foreign reporters (TSM, ASML, SAP, etc.), revenue/NI are company-wide native then converted; EPS may reflect per-ADR vs per-ordinary depending on stockanalysis.com normalization — see per-ticker JSON `notes` field.");
lines.push("- OTC unsponsored ADRs (SSNLF Samsung, SHECY Shin-Etsu, SUOPY SUMCO, SOIGY Soitec, AIQUY Air Liquide, AKZOY Akzo, LYSDY Lynas, VEOEY Veolia, SMSMY Sims, ASMIY ASM Intl, BESIY BESI, SBGSY Schneider, ABBNY ABB, LNVGY Lenovo) — pricing on US exchanges may be illiquid; native-listing financials used and converted.");
lines.push("- GE Vernova (GEV) spun off Apr 2024 — only 1-2 standalone fiscal years exist.");
lines.push("- Pre-revenue / emerging: IONQ, RGTI, QUBT, QBTS, ARQQ, OKLO, SMR, NNE, POET — financials show losses, valued on TAM optionality.");
lines.push("- Non-calendar fiscal years (NVDA Jan, MSFT Jun, AVGO Oct/Nov, DELL Jan, HPE Oct, CSCO Jul, ORCL May, SMCI Jun, AAPL Sep) — when comparing across companies, use fiscal_year_end_date column, not raw fy.");
lines.push("- Price agent in some cases produced partial monthly windows (<60 closes) for thinly-traded OTC ADRs; flagged in per-ticker JSON.");
lines.push("");

lines.push("## Files in this dataset");
lines.push("");
lines.push("- `REPORT.md` — this narrative");
lines.push("- `README.md` — methodology + how to read");
lines.push("- `tickers.csv` — master registry (172 tickers; segment / tier / role / upstream-downstream)");
lines.push("- `financials.csv` — 5yr annual financials, native + USD, 1 row per ticker × FY");
lines.push("- `prices_monthly.csv` — monthly closes 2021-05 → 2026-04, native + USD");
lines.push("- `data/tickers.json` — structured registry + relationship graph");
lines.push("- `data/financials/<TICKER>.json` — per-ticker income-statement detail");
lines.push("- `data/prices/<TICKER>.json` — per-ticker monthly price array");
lines.push("- `notes/` — fetch log, caveats, missing-data registry");
lines.push("");

fs.writeFileSync(path.join(ROOT, "REPORT.md"), lines.join("\n"));
console.log(`REPORT.md: ${lines.length} lines written`);
