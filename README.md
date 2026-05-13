# AI · Quantum · Photonics Buildout — Public Markets Supply Chain Dataset

**Snapshot date:** 2026-05-11
**Coverage:** 172 publicly traded tickers (US-listed including OTC ADRs)
**Built for:** mapping every investable link in the AI / quantum / photonics buildout — 2+ steps upstream (chips → wafers → gases → mining) and downstream (servers → cloud → power → cooling → real estate → recycling).

## What's in this folder

| File | Description |
|---|---|
| [REPORT.md](./REPORT.md) | Narrative report — supply chain map, per-segment tables, cross-cuts, gaps. **Start here.** |
| [tickers.csv](./tickers.csv) | Master registry: ticker, name, exchange, segment, tier (U5→U1, AI core, D1→D5, Q), role-in-chain, key upstream/downstream tickers. |
| [financials.csv](./financials.csv) | 5 fiscal years × ticker; columns: ticker, fiscal_year, fye_date, currency_native, fx_rate, revenue (native + USD), net_income (native + USD), EPS-diluted (native + USD), source_url. |
| [prices_monthly.csv](./prices_monthly.csv) | Monthly closes 2021-05 → 2026-04 (+ partial 2026-05) × ticker; columns: ticker, month_end, close (native + USD), fx_rate, source_url. |
| [data/tickers.json](./data/tickers.json) | Same registry as tickers.csv but with relationship arrays (upstream/downstream) for graph traversal. |
| [data/financials/](./data/financials/) | Per-ticker JSON with full FY detail; one file per ticker. |
| [data/prices/](./data/prices/) | Per-ticker JSON with monthly-closes array (CSV string for compactness); one file per ticker. |
| [notes/](./notes/) | Fetch log, missing-data flags, FX-rate table, dangling references. |
| [aggregate.js](./aggregate.js) | Node.js script that built `financials.csv`, `prices_monthly.csv`, `data/tickers.json` from per-ticker files. Re-runnable. |
| [report.js](./report.js) | Node.js script that generated `REPORT.md` from the JSON files. Re-runnable. |

## Methodology

### Ticker selection (172 unique tickers)

Curated to cover every publicly investable layer of the AI / quantum / photonics chain:

- **Upstream:** mining, gases, wafers, WFE (wafer fab equipment), EDA, foundries, memory, OSAT, chip designers, networking/photonics
- **AI core:** rack-scale server builders (SMCI, DELL, HPE, LNVGY)
- **Downstream:** hyperscalers, AI software, data-center REITs, power equipment, utilities, SMR/nuclear, gas/LNG, cooling/HVAC, EPC/construction, fiber/glass, waste/recycling
- **Quantum-specific:** 5 pure-plays (IONQ, RGTI, QUBT, QBTS, ARQQ) + HON (Quantinuum)
- **Photonics-specific:** COHR, LITE, IPGP, LASR, POET, VECO, AOSL, MTSI, RMBS

US-listed only: NYSE, NASDAQ, and OTC ADRs (sponsored + unsponsored). Foreign-only listings (SK Hynix, Tokyo Electron, Disco, SMIC, A-shares) and private firms (xAI, OpenAI, Anthropic, BlueFors) are excluded but flagged in REPORT.md as gaps.

### Data sources

| Field | Primary source | Fallback |
|---|---|---|
| 5yr annual revenue, net income, EPS | [stockanalysis.com](https://stockanalysis.com) `/stocks/<ticker>/financials/` | OTC pages `/quote/otc/<TICKER>/`, then native-listing pages (e.g., VIE.PA for Veolia) |
| Monthly closing prices | [finance.yahoo.com](https://finance.yahoo.com) `/quote/<TICKER>/history/` (via headless Playwright in MCP_DOCKER browser) | None — failed tickers flagged in `notes/prices-missing.json` |
| FX rates (year-end) | Public reference (see `notes/caveats.md`) | — |

### Currency handling

- All revenue / net-income figures normalized to USD at **fiscal-year-end FX rate**.
- Monthly prices converted at **year-end FX rate of the same calendar year** as the month.
- Both native and USD columns are retained — caller can re-convert with their own rate source if higher precision needed.

### Fiscal-year handling

Non-calendar FYs are common: NVDA (Jan), MSFT (Jun), AAPL (Sep), AVGO (Oct/Nov), DELL/SMCI (Jan/Feb/Jun), CSCO (Jul), ORCL (May), HPE (Oct), ANET (Dec). Use `fiscal_year_end_date` in financials.csv for any cross-firm comparison.

### Re-running

```bash
# Re-aggregate from the per-ticker JSON files (no network needed)
node aggregate.js

# Regenerate REPORT.md from the JSON files
node report.js
```

To refresh data, you would need to re-fetch the per-ticker JSON files from source. This dataset is a **static snapshot** — no automated refresh.

## Known limitations

1. **Single-source revenue/NI:** stockanalysis.com is the sole source for financials. For high-stakes use, cross-check against SEC EDGAR 10-K filings or company IR pages.
2. **Approximate FX rates:** year-end rates are public-reference approximations; precise broker-quality rates may differ ±1-2%.
3. **OTC unsponsored ADRs are illiquid** — pricing can lag or gap; volumes too small for meaningful price discovery. Use the native listing for serious analysis. Affected: SSNLF, SHECY, SUOPY, SOIGY, AIQUY, AKZOY, LYSDY, VEOEY, SMSMY, ASMIY, BESIY, SBGSY, ABBNY, LNVGY.
4. **Quantum pure-plays are pre-revenue or barely revenue-bearing.** Financials show structural losses; values are TAM-optionality based.
5. **GEV (GE Vernova) spun off April 2024** — only 1-2 standalone fiscal years exist.
6. **Categorical downstream labels** (e.g., "Enterprise", "Hyperscalers", "Industrial") in tickers.csv are intentional generic destinations, not tickers. The cross-reference check flags them as "dangling" — see `notes/dangling-refs.json` for the full list.

## License / use

Public-source data only. No proprietary information. Not investment advice — this is a structural map, not a stock recommendation.
