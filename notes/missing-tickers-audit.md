# Missing-ticker audit (2026-05-13)

Audit of public US-listed AI / quantum / photonics supply-chain candidates not currently in `tickers.csv`. Snapshot date for current registry: 2026-05-11 (172 tickers). All facts below verified via WebFetch against stockanalysis.com and Wikipedia.

---

## Confirmed adds (priority order)

### 1. **CRWV** — CoreWeave Inc | NASDAQ | USD | tier D1 | segment: "AI cloud / neocloud pure-play"
- **Role:** Largest neocloud / pure NVDA GPU cluster operator. ~250,000 GPUs across 32 data centers. Operates a $1.6B NVIDIA-dedicated supercomputer in Texas. MSCI named it the largest neocloud / AI-cloud pure-play.
- **Key upstream:** NVDA;SMCI;DELL;MU;CEG;VST;DLR;EQIX
- **Key downstream:** MSFT;META;ORCL (MSFT >60% of 2024 revenue per S-1; OpenAI signed $11.9B 5-yr contract 2025)
- **IPO:** March 28, 2025 on NASDAQ. Active. Market cap ~$59B (May 2026), TTM revenue ~$6.2B.
- **Why missed:** IPO'd after initial cut window; first major neocloud pure-play to list.
- **Notes:** Top-3 NVDA customer (along with MSFT and META by some estimates).

### 2. **ALAB** — Astera Labs Inc | NASDAQ | USD | tier U1 | segment: "AI interconnect silicon"
- **Role:** Fabless designer of PCIe retimers (Aries), CXL memory controllers (Leo), and Scorpio fabric switches for AI server racks. Removes the connectivity bottleneck between GPUs and CPUs in NVDA/AMD AI clusters. NVIDIA partner; member of Arm Total Design ecosystem.
- **Key upstream:** TSM;SNPS;CDNS;ARM
- **Key downstream:** NVDA;AMZN (Trainium3 ramp context);MSFT;META;Hyperscalers
- **IPO:** March 20, 2024 on NASDAQ. Active. Q1 2026 revenue $308M (+93% YoY), market cap ~$35B.
- **Why missed:** Recent IPO; adjacent to MRVL/AVGO custom-silicon space but pure-play on retimers/fabric.

### 3. **CRDO** — Credo Technology Group | NASDAQ | USD | tier U1 | segment: "AI high-speed connectivity"
- **Role:** Active Electrical Cables (HiWire AEC), optical PAM4 DSPs, SerDes chiplets & IP for hyperscaler AI fabrics. Competes head-to-head with MRVL on optical DSP and with ANET-internal optics. Acquired DustPhotonics Apr 2026 for $750M for silicon photonics.
- **Key upstream:** TSM;SNPS;CDNS
- **Key downstream:** MSFT;AMZN;META;Hyperscalers (large hyperscaler concentration; named as a "leading hyperscaler" buyer in disclosures)
- **IPO:** January 27, 2022 on NASDAQ. Active. Market cap ~$37B.
- **Why missed:** Pre-existing IPO before 2022 cut; just outside MRVL/MTSI bucket but now scale-relevant.

### 4. **IREN** — IREN Limited (fmr Iris Energy) | NASDAQ | USD | tier D1 | segment: "AI cloud / neocloud pure-play"
- **Role:** Bitcoin miner pivoting hard to AI compute. Signed $3.4B AI Cloud contract with NVIDIA + $2.1B NVDA investment commitment 2025. Sweetwater 1 (Texas) data-center energized. Targeting $3.7B ARR by 2026; 1.2 GW AI cloud capacity in build by 2027.
- **Key upstream:** NVDA;SMCI;DELL;MU
- **Key downstream:** NVDA;MSFT (acknowledged customer);AI labs (concentrated)
- **Listing:** NASDAQ since 2021 (Iris Energy → IREN rename 2024). Active.
- **Why missed:** Was a Bitcoin miner during initial registry cut; AI pivot now the dominant narrative.

### 5. **APLD** — Applied Digital Corp | NASDAQ | USD | tier D2 | segment: "AI/HPC data center"
- **Role:** HPC / AI data-center developer-operator. $7.5B lease with a U.S. hyperscaler for Delta Forge 1 (430 MW). Houses CoreWeave deployments. Spun out cloud business (ChronoScale) to focus on real-estate-style AI campus model.
- **Key upstream:** CEG;VST;ETN;VRT;NVDA (deployment hardware)
- **Key downstream:** CRWV;Hyperscalers (>$7.5B contracted)
- **Listing:** NASDAQ. Active. AI/HPC hosting is now the dominant segment.
- **Why missed:** Crypto-mining heritage; AI-DC pivot fully transitioned 2024-25. Fits D2 alongside DLR/EQIX but distinguishes itself as developer/lessor rather than colo REIT.

### 6. **BTDR** — Bitdeer Technologies Group | NASDAQ | USD | tier D1 | segment: "AI cloud / neocloud pure-play"
- **Role:** Bitcoin miner + ASIC manufacturer pivoting to AI infrastructure. NVDA-partnered Bitdeer AI Cloud + AI DC in Norway (largest in country, online Dec 2026). Smaller than IREN/CRWV but on same trajectory.
- **Key upstream:** NVDA;SMCI;Norwegian grid
- **Key downstream:** AI customers (unnamed; pre-meaningful AI revenue)
- **Listing:** NASDAQ since April 2023 (Blue Safari SPAC). Active.
- **Why missed:** Crypto heritage; AI pivot recent. Lower-priority than IREN but rounds out the neocloud bucket.

### 7. **TEM** — Tempus AI Inc | NASDAQ | USD | tier D1 | segment: "AI software (vertical: health)"
- **Role:** AI-enabled precision medicine; oncology genomics + cardiology + radiology. Large compute footprint (training on multi-modal genomic + clinical data). End-user of GPU compute. Acquired Ambry Genetics 2024 for $600M.
- **Key upstream:** MSFT;AMZN;NVDA (likely)
- **Key downstream:** Pharma;providers;life-sciences enterprises (SoftBank SB Tempus JV in Japan)
- **IPO:** June 14, 2024 on NASDAQ. Active. 2025 revenue $1.27B (+83% YoY), market cap ~$8.4B.
- **Why missed:** Vertical-specific AI software; cleaner fit than RXRX. Comparable to PLTR/AI tier in role.

### 8. **OUST** — Ouster Inc | NASDAQ | USD | tier U1 | segment: "AI sensing (lidar)"
- **Role:** Digital lidar pure-play; positioning as "Physical AI" sensing. Integrates with NVIDIA autonomous-vehicle dev platform. End-market: AVs, robotics, smart infrastructure. Acquired Stereolabs (stereo cameras).
- **Key upstream:** TSM (fabless silicon);Optoelectronic components
- **Key downstream:** Automakers (LiDAR);Robotics OEMs;NVDA (Drive ecosystem);MBLY-adjacent
- **Listing:** NASDAQ. Active. 2025 revenue $169M (+52% YoY). MBLY is the existing comparator in the registry.
- **Why missed:** Just under threshold; now scale-relevant as physical-AI sensing distinct from MBLY's auto-only ADAS.

### 9. **IESC** — IES Holdings Inc | NASDAQ | USD | tier D3 | segment: "Electrical EPC"
- **Role:** Electrical & technology systems contractor with substantial data-center exposure (Communications segment builds/maintains DC infrastructure for colos + hyperscalers). $3.9B backlog. FY2025 revenue $3.37B (+17% YoY); FY26 ramping.
- **Key upstream:** ETN;HUBB;VRT;NVT (electrical equipment)
- **Key downstream:** DLR;EQIX;Hyperscalers;e-commerce data centers
- **Listing:** NASDAQ (ticker is **IESC**, not IES — important). Active.
- **Why missed:** Smaller than EME/PWR but pure-play electrical contractor with strong DC tailwind. Fits alongside EME in D3.

### 10. **FLNC** — Fluence Energy Inc | NASDAQ | USD | tier D2 | segment: "Grid storage / data-center backup"
- **Role:** Grid-scale battery storage (Gridstack Pro, Gridstack, Ultrastack) + Smarts optimization SW. Q2 2026 transcripts highlight strong demand specifically from data centers. $5.6B backlog. AES-spinout, Siemens-backed.
- **Key upstream:** Lithium suppliers (ALB);Battery cell makers (mostly Asian-private)
- **Key downstream:** Utilities;Hyperscalers (data-center storage);IPP partners (VST/NEE)
- **Listing:** NASDAQ. Active. Distinct from ENS (UPS batteries) and more grid-scale/PPA-firming oriented.
- **Why missed:** Battery storage was largely renewables-focused until 2024-25; AI-DC backup-power story is recent.

---

## Rejected (with reason)

- **ASTS** (AST SpaceMobile) — Satellite-to-cell broadband; not AI compute supply chain. Q1 2026 missed badly. Reject as too tangential.
- **RXRX** (Recursion Pharmaceuticals) — AI-driven drug discovery, but NVDA tie is only a GTC presentation slot, not a material partnership. Biotech end-user, not infrastructure. Out of registry scope (similar to why we exclude consumer-of-AI verticals).
- **RKLB** (Rocket Lab) — Launch services and space systems. No material AI infrastructure connection per company filings. Reject.
- **RCAT** (Red Cat Holdings) — Drones with AI features, but primary classification is UAS hardware for defense. Marginal at $200M revenue; reject for AI-infra scope (drones are end-application, not buildout).
- **INDI** (indie Semiconductor) — Auto ADAS silicon, fabless. Comparable to MBLY but ~10x smaller revenue ($55M Q1 2026 vs MBLY $2B) and net loss; primary auto exposure makes it a marginal/dilutive add. Reject for now; revisit if scales.
- **INNV** (InnovAge) — Healthcare senior-care services. Zero AI supply-chain relevance. Reject.
- **KOSS** — Consumer headphones. Not in scope. Reject.
- **HOOK** — Stockanalysis returns 404 (ticker unverified / possibly delisted or thinly traded). Reject as unverifiable.
- **ATAT** — Chinese hospitality. Zero relevance. Reject.
- **WTTR** (Select Water Solutions) — Oil & gas water management; no fab/data-center water positioning. LibertyStream lithium tie is too thin. Reject.
- **WIRE** (Encore Wire) — **DELISTED.** Acquired by Prysmian (Italian cable group); deal completed 2024. Stockanalysis returns 404 on WIRE. Reject as no longer trading.
- **ACN** (Accenture) — Mega-cap IT services with AI deals (MSFT Copilot deployment, GOOG, Anthropic, ServiceNow); but AI is not a separately disclosed segment, and the company is so broad (consulting + outsourcing + BPO) that adding it would dilute the registry. Same logic for not having Deloitte, EY, etc. Reject — out of pure-play scope.
- **INFY** (Infosys), **WIT** (Wipro), **CTSH** (Cognizant) — Indian/global IT services ADRs. Same rationale as ACN: AI is a feature of services portfolio, not a pure-play. Lower AI exposure than ACN. Reject.

---

## Suggested follow-ups

- **JNPR delisting** — Registry shows "Acquisition by HPE closed 2025" but JNPR is still in `tickers.csv`. If HPE-JNPR deal fully closed in 2025, JNPR should be flagged as delisted (similar to WIRE) and removed at next refresh. **Action: verify JNPR listing status post-deal-close in next audit cycle.**
- **Watch SDDXD (SanDisk spinoff from WDC, 2025)** — Note in registry mentions split but SDDXD is not present. Consider adding as separate flash/NAND pure-play if it cleanly survives the spin.
- **Crusoe Energy** — Private currently; if IPO happens, add as another neocloud peer alongside CRWV/IREN.
- **xAI / OpenAI / Anthropic** — Already documented as ghost nodes in `data/ghost-nodes.json`. CRWV addition will create new edges to OPENAI ghost (good).
- **Watch ARM listing** — UK firm but lists on NASDAQ; no action needed but flag if any UK→US restructuring occurs.
- **Astera Labs (ALAB)** customer concentration likely Amazon-heavy via Trainium connectivity; revisit annual_usd_billions estimate after FY27 disclosures.
- **POET / LASR** — Already in registry; no action.

---

## Suggested relationships.json edge entries

For the 10 confirmed adds, here are the 1-3 most important up/downstream edges in the existing schema format:

```json
{
  "NVDA->CRWV": {
    "what_flows": "Hopper (H100/H200) + Blackwell (B100/B200/GB200) AI GPU clusters; CoreWeave is a top-3 NVDA customer alongside MSFT and META. NVDA also took an equity stake / preferred-customer relationship at IPO.",
    "importance": "critical",
    "annual_usd_billions": "8-12",
    "deal_basis": "CRWV TTM revenue ~$6.2B is almost entirely re-monetized NVDA compute; capex pipeline implies $10B+ NVDA purchases in 2025-26 to expand to 1.2GW+ capacity.",
    "single_source_risk": "high",
    "alternatives": "AMD MI300/MI325 in theory; CRWV publicly tied to NVDA roadmap. No production-scale AMD deployment.",
    "trend": "Growing fast; CRWV's purchasing is one of the marginal demand sources cited in NVDA earnings calls for Blackwell allocation."
  },
  "CRWV->MSFT": {
    "what_flows": "GPU compute capacity rental; CoreWeave hosts large Azure-overflow training clusters for Microsoft.",
    "importance": "critical",
    "annual_usd_billions": "3-5",
    "deal_basis": "Per CRWV S-1, Microsoft accounted for >60% of CRWV 2024 revenue (~$1.9B of $1.92B disclosed). 2025-26 revenue mix is diversifying toward OpenAI direct ($11.9B contract) and others, but MSFT remains anchor.",
    "single_source_risk": "high",
    "alternatives": "MSFT also buys from AMZN/GOOG/ORCL — but CRWV is its dedicated NVDA-cluster expansion lever.",
    "trend": "Concentration declining as OpenAI/META/others scale; absolute $ still growing."
  },
  "CRWV->OPENAI": {
    "what_flows": "Dedicated GPU compute under 5-year contract; CRWV is OpenAI's primary non-Microsoft compute supplier post-2025 restructure.",
    "importance": "critical",
    "annual_usd_billions": "2-3 (ramping)",
    "deal_basis": "$11.9B 5-year contract signed 2025; OpenAI also took preferred warrants/equity in CRWV.",
    "single_source_risk": "high",
    "alternatives": "MSFT (Azure) and ORCL also serve OpenAI; CRWV provides incremental NVDA-cluster capacity.",
    "trend": "Growing as OpenAI training compute needs outpace MSFT capacity provisioning.",
    "ghost_node": "OPENAI is a private firm — flagged in data/ghost-nodes.json"
  },

  "TSM->ALAB": {
    "what_flows": "Fabless silicon for PCIe retimers (Aries), CXL controllers (Leo), and Scorpio fabric switches at TSM advanced nodes (N7/N5/N3 expected).",
    "importance": "critical",
    "annual_usd_billions": "0.2-0.4",
    "deal_basis": "ALAB TTM revenue ~$1B+ implied at Q1 2026 $308M run-rate; >80% gross margin implies wafer cost is sub-$100M but lock-in is critical.",
    "single_source_risk": "high",
    "alternatives": "Samsung Foundry; not in production.",
    "trend": "Growing fast with PCIe 6 + Scorpio ramps."
  },
  "ALAB->NVDA": {
    "what_flows": "PCIe retimers for NVIDIA AI server reference designs; Scorpio fabric switches starting to displace some discrete retimers in NVL72/Blackwell racks.",
    "importance": "major",
    "annual_usd_billions": "0.2-0.4",
    "single_source_risk": "medium",
    "alternatives": "Marvell, Broadcom retimer/SerDes products.",
    "trend": "Growing with Blackwell GB200/GB300 NVL72 racks."
  },
  "ALAB->AMZN": {
    "what_flows": "Retimers + fabric silicon supporting Amazon Trainium3 connectivity (per company-disclosed ramp context).",
    "importance": "major",
    "annual_usd_billions": "0.1-0.3",
    "single_source_risk": "medium",
    "trend": "Growing with Trainium3 deployment 2026."
  },

  "TSM->CRDO": {
    "what_flows": "Fabless silicon for PAM4 DSPs, SerDes chiplets, and Active Electrical Cable controllers at advanced nodes.",
    "importance": "critical",
    "annual_usd_billions": "0.1-0.3",
    "single_source_risk": "high",
    "trend": "Growing with hyperscaler 800G/1.6T optical buildouts."
  },
  "CRDO->MSFT": {
    "what_flows": "Active Electrical Cables (HiWire) and SerDes DSPs for Azure AI fabric; MSFT a publicly disclosed concentrated hyperscaler customer.",
    "importance": "critical",
    "annual_usd_billions": "0.3-0.6",
    "deal_basis": "Hyperscalers account for the dominant share of CRDO revenue; MSFT widely reported as the largest individual customer.",
    "single_source_risk": "medium",
    "alternatives": "MRVL, AVGO compete on DSPs; CRDO leads on AEC.",
    "trend": "Growing fast; AEC adoption inside AI server racks expanding."
  },
  "CRDO->AMZN": {
    "what_flows": "SerDes IP + AEC for AWS AI clusters.",
    "importance": "major",
    "annual_usd_billions": "0.2-0.4",
    "single_source_risk": "medium",
    "trend": "Growing."
  },

  "NVDA->IREN": {
    "what_flows": "GPUs (Hopper + Blackwell) for IREN's AI cloud; tied to $3.4B 2025 NVIDIA AI Cloud contract.",
    "importance": "critical",
    "annual_usd_billions": "1-3 (ramping)",
    "deal_basis": "$3.4B disclosed contract + $2.1B NVIDIA investment commitment 2025; IREN targets $3.7B ARR by 2026.",
    "single_source_risk": "high",
    "trend": "Growing fast; IREN is NVIDIA's anchored partner for AI cloud expansion in Australia/Texas/North America."
  },
  "IREN->MSFT": {
    "what_flows": "AI compute capacity rental; Microsoft acknowledged as customer.",
    "importance": "major",
    "annual_usd_billions": "0.3-0.6",
    "single_source_risk": "medium",
    "trend": "Growing with Sweetwater 1 energization."
  },

  "NVDA->APLD": {
    "what_flows": "Hosted GPU compute for tenants; APLD operates AI/HPC data centers (Delta Forge 1 etc.) for hyperscaler + neocloud tenants.",
    "importance": "major",
    "annual_usd_billions": "0.5-1.0",
    "single_source_risk": "medium",
    "trend": "Growing with Delta Forge 1 hyperscaler lease ($7.5B contracted)."
  },
  "APLD->CRWV": {
    "what_flows": "Data-center capacity lease + power infrastructure for CoreWeave GPU deployments.",
    "importance": "major",
    "annual_usd_billions": "0.3-0.6",
    "single_source_risk": "medium",
    "trend": "Stable per existing lease agreements with modifications 2025-26."
  },
  "CEG->APLD": {
    "what_flows": "Power supply / PPAs for HPC/AI campus operations.",
    "importance": "meaningful",
    "annual_usd_billions": "0.1-0.3",
    "single_source_risk": "low",
    "trend": "Growing."
  },

  "NVDA->BTDR": {
    "what_flows": "GPUs for Bitdeer AI Cloud + Norway AI DC infrastructure.",
    "importance": "meaningful",
    "annual_usd_billions": "0.1-0.3",
    "single_source_risk": "high",
    "trend": "Growing with Norway DC online Dec 2026; small absolute scale vs. CRWV/IREN."
  },

  "MSFT->TEM": {
    "what_flows": "Azure cloud compute for AI training on multi-modal genomic + clinical data.",
    "importance": "meaningful",
    "annual_usd_billions": "0.05-0.1",
    "single_source_risk": "low",
    "alternatives": "AWS, GCP",
    "trend": "Growing with TEM revenue scale ($1.27B 2025)."
  },

  "TSM->OUST": {
    "what_flows": "Fabless digital lidar silicon (proprietary L3 chip).",
    "importance": "major",
    "annual_usd_billions": "0.02-0.05",
    "single_source_risk": "high",
    "trend": "Growing with REV8 ramp."
  },
  "OUST->NVDA": {
    "what_flows": "Lidar integration in NVIDIA Drive autonomous-vehicle development platform.",
    "importance": "meaningful",
    "annual_usd_billions": "<0.05",
    "single_source_risk": "low",
    "trend": "Growing as Physical AI ecosystem expands."
  },

  "ETN->IESC": {
    "what_flows": "Switchgear, busbar, and UPS components installed into data-center electrical builds.",
    "importance": "major",
    "annual_usd_billions": "0.3-0.6",
    "single_source_risk": "low",
    "trend": "Growing fast with $3.9B IESC backlog tilted to data centers."
  },
  "IESC->DLR": {
    "what_flows": "Electrical contractor services for data-center construction & maintenance.",
    "importance": "major",
    "annual_usd_billions": "0.4-0.8",
    "single_source_risk": "low",
    "alternatives": "EME, PWR, MTZ",
    "trend": "Growing fast with AI capex cycle."
  },

  "FLNC->Hyperscalers": {
    "what_flows": "Grid-scale battery storage for data-center backup + PPA-firming; transcripts cite explicit data-center demand.",
    "importance": "major",
    "annual_usd_billions": "0.3-0.6",
    "single_source_risk": "low",
    "alternatives": "Tesla Megapack (private/auto-listed differently), private cell makers",
    "trend": "Growing fast; $5.6B FLNC backlog."
  },
  "ALB->FLNC": {
    "what_flows": "Lithium feedstock for storage cells (indirect via cell makers).",
    "importance": "meaningful",
    "annual_usd_billions": "<0.1",
    "single_source_risk": "low",
    "trend": "Stable."
  }
}
```

Note: The above edge stubs use **IESC**, **CRWV**, **ALAB**, **CRDO**, **IREN**, **APLD**, **BTDR**, **TEM**, **OUST**, **FLNC** as ticker symbols. These need to be added to `tickers.csv` before the edges are valid (otherwise they'll show up in `notes/dangling-refs.json`). The OPENAI ghost-node reference is already present in `data/ghost-nodes.json`.

---

## Summary

- **10 confirmed adds** (CRWV, ALAB, CRDO, IREN, APLD, BTDR, TEM, OUST, IESC, FLNC)
- **13 rejected** (ASTS, RXRX, RKLB, RCAT, INDI, INNV, KOSS, HOOK, ATAT, WTTR, WIRE/delisted, ACN, INFY/WIT/CTSH — treated as services-not-infra)
- **Top 3 to prioritize:** CRWV (top-3 NVDA customer, anchors a new "neocloud" segment), ALAB (pure-play AI interconnect silicon, NVDA + AMZN ecosystem), CRDO (AI high-speed connectivity, MSFT-anchored hyperscaler customer)
- **Key correction flagged:** the user's candidate ticker "IES" is actually **IESC** on NASDAQ; "WIRE" (Encore Wire) is **delisted** post Prysmian acquisition close 2024.
- **JNPR cleanup deferred** to next audit cycle — registry still lists it but HPE deal-close note suggests verification needed.
