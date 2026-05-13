# Data caveats & methodology notes

## FX rates used (year-end, 1 unit native = X USD)

These are public-reference approximations. Cross-check against broker / WSJ / Bloomberg rates for high-precision use.

| Currency | 2021-12-31 | 2022-12-31 | 2023-12-31 | 2024-12-31 | 2025-12-31 | 2026 (mid-year, approx) |
|---|---|---|---|---|---|---|
| USD | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| EUR | 1.1370 | 1.0666 | 1.1039 | 1.0354 | 1.0463 | 1.05 |
| TWD | 0.03612 | 0.03263 | 0.03269 | 0.03050 | 0.03079 | 0.031 |
| JPY | 0.00868 | 0.00763 | 0.00709 | 0.00637 | 0.00643 | 0.0065 |
| KRW | 0.000843 | 0.000790 | 0.000776 | 0.000680 | 0.000683 | 0.00069 |
| AUD | 0.7260 | 0.6810 | 0.6810 | 0.6206 | 0.6213 | 0.63 |
| GBP | 1.350 | 1.210 | 1.275 | 1.252 | 1.305 | 1.30 |
| CNY | 0.1568 | 0.1450 | 0.1408 | 0.1370 | 0.1390 | 0.140 |
| CHF | 1.094 | 1.080 | 1.189 | 1.102 | 1.205 | 1.20 |

## Tickers with OTC unsponsored ADR (illiquid, price discovery weak on US exchange)

| Ticker | Name | Native listing | Native currency |
|---|---|---|---|
| SSNLF | Samsung Electronics | KRX 005930 | KRW |
| LNVGY | Lenovo Group | HKEX 0992 | USD (reports) / HKD trades |
| SHECY | Shin-Etsu Chemical | TSE 4063.T | JPY |
| SUOPY | SUMCO Corp | TSE 3436.T | JPY |
| SOIGY | Soitec SA | EPA SOI | EUR |
| AIQUY | Air Liquide | EPA AI | EUR |
| AKZOY | Akzo Nobel | AMS AKZA | EUR |
| LYSDY | Lynas Rare Earths | ASX LYC | AUD |
| VEOEY | Veolia Environnement | EPA VIE | EUR |
| SMSMY | Sims Metal Management | ASX SGM | AUD |
| ASMIY | ASM International | AMS ASM | EUR |
| BESIY | BE Semiconductor | AMS BESI | EUR |
| SBGSY | Schneider Electric | EPA SU | EUR |
| ABBNY | ABB Ltd | SIX ABBN | USD (reports) |

For serious analysis use the native listing. Yahoo + stockanalysis.com data here reflects the native-company-level numbers translated to USD.

## OTC tickers where stockanalysis.com had no coverage (financials are missing)

Sub-agent fetch failed on these — usually because OTC tier of stockanalysis.com isn't populated. Some were recovered by switching to `/quote/otc/<TICKER>/` or to the native listing URL during fetch.

Expected stubs (file present but `status:"no_data"`): see `notes/financials-missing.json` if present.

## Fiscal year ends (non-calendar)

| Ticker | FY end | Note |
|---|---|---|
| NVDA | Last Sunday of January | FY2026 ended Jan 25, 2026 |
| AMD | Late December | Slight drift due to 52/53-week year |
| INTC | Late December | Same |
| AVGO | Late October / early November | FY2025 ended Nov 2, 2025 |
| MSFT | June 30 | |
| ORCL | May 31 | |
| AAPL | Last Saturday of September | |
| DELL | Late January / early February | |
| SMCI | June 30 | |
| HPE | October 31 | |
| CSCO | Late July | |
| ANET | December 31 | |
| MRVL | Late January / early February | |
| QCOM | Last Sunday of September | |
| HON | December 31 | |
| AMAT | Late October | |
| LRCX | Late June | |
| SNPS | Late October | |
| ADBE | Late November / early December | |
| NOW | December 31 | |
| CRM | January 31 | |
| ESTC | April 30 | |
| AI (C3.ai) | April 30 | |
| ROK | September 30 | |
| JCI | September 30 | |
| BRZE | January 31 | |
| MDB | January 31 | |
| SNOW | January 31 | |
| MOD | March 31 | |
| ENS | March 31 | |
| LNVGY | March 31 | |
| KLIC | Late September | |
| AEHR | May 31 | |
| JNPR | December 31 (but acquisition by HPE complicates fy26) | |

Use `fiscal_year_end_date` column for any cross-firm comparison.

## ADR ratios (where 1 ADR ≠ 1 ordinary share)

| Ticker | ADR : ordinary ratio | Effect |
|---|---|---|
| TSM | 1 ADR = 5 ordinary | EPS shown is per-ADR-equivalent in TWD |
| SAP | 1 ADR = 1 ordinary | No conversion |
| ASML | 1 ADR = 1 ordinary | No conversion |
| BHP | 1 ADR = 1 ordinary | No conversion |
| RIO | 1 ADR = 1 ordinary | No conversion |
| ARM | 1 ADR = 1 ordinary | UK-domiciled but US-listed; reports USD |
| SBGSY | 1 ADR = 0.2 ordinary | Per-ADR EPS lower than per-ordinary |
| ABBNY | 1 ADR = 1 ordinary | Reports in USD already |
| LYSDY | 1 ADR = 5 ordinary | |
| SMSMY | 1 ADR = 2 ordinary | |
| AKZOY | 1 ADR = 0.5 ordinary | |
| AIQUY | 1 ADR = 0.2 ordinary | |
| VEOEY | 1 ADR = 0.5 ordinary | |
| SHECY | 1 ADR = 0.5 ordinary | |
| SUOPY | 1 ADR = 0.5 ordinary | |
| SOIGY | 1 ADR = 0.5 ordinary | |
| ASMIY | 1 ADR = 0.05 ordinary | |
| BESIY | 1 ADR = 0.5 ordinary | |
| LNVGY | 1 ADR = 20 ordinary | |

If EPS-per-ADR ÷ price-per-ADR doesn't match published P/E for foreign ADRs, ratio is likely the cause.

## Dangling cross-references (intentional)

Generic destination labels in tickers.csv `key_downstream` field — these are descriptive categories, not tickers:

- **Enterprise / Hyperscalers / Industrial / Automakers / Commercial / Government / Defense / Telcos / Municipal**
- **Research / DOE / DOD / Navy / Aerospace**
- **Auto OEMs / EV OEMs / SMR builders / Quantum / Magnets / data centers / fabs**

Plus references to private / foreign-only entities:
- **SK Hynix** — KRX only (#2 DRAM, dominant HBM supplier)
- **Zeiss / TRUMPF** — German private (EUV optics + CO2 source)
- **xAI / CoreWeave / Vistra-Energy** — private or post-snapshot
- **SMIC / YMTC / CXMT** — Chinese, excluded by user
- **STMicro / ST** — only EPA STMPA (excluded by US-only scope)

Full machine-readable list in `notes/dangling-refs.json`.

## TTM-labelled "FY2026" rows

stockanalysis.com surfaces the most-recent trailing-twelve-months (TTM) as if it were a completed annual filing for several companies. Where the `fiscal_year_end_date` doesn't match the company's actual FY end month, treat that row as **TTM as of that date**, not a fully-reported annual:

| Ticker | Actual FY ends | TTM date shown | Treatment |
|---|---|---|---|
| MSFT | Jun | 2026-03-31 | TTM through Q3 FY26 |
| AAPL | Sep | 2026-03-28 | TTM through Q2 FY26 |
| SMCI | Jun | 2026-03-31 | TTM through Q3 FY26 |
| AVGO | Oct/Nov | 2026-02-01 | TTM through Q1 FY26 |
| MU | Aug | 2026-02-26 | TTM through Q2 FY26 |
| ORCL | May | 2026 row may be TTM | check FYE date |
| ANET | Dec | 2025-12-31 normal | calendar FY OK |
| CRM | Jan | 2026-01-31 | TTM near actual FY |

For the prior 4 years (FY2021-FY2024 or FY2022-FY2025), values ARE fully reported annual.

## Fetch run notes (2026-05-11)

- 4 parallel sub-agents fetched financials via WebFetch on stockanalysis.com between 13:46 and 13:52 local time.
- 9 OTC ADRs failed (404 on stockanalysis.com); 163 succeeded with full 5yr data.
- One sub-agent then ran sequentially against Yahoo Finance via Playwright (MCP_DOCKER browser) for monthly prices; ran ~25-30 min.
- Yahoo's consent wall was accepted once and persisted; subsequent navigations went directly to history pages.
- For tickers where Yahoo history page returned blocked / empty, stub JSON was written with `status: "no_data"` and reason.

## What's NOT in this snapshot

- Quarterly financials (only annual).
- Forward consensus estimates / analyst targets.
- Valuation multiples (P/E, EV/EBITDA, EV/Sales, FCF yield) — derivable from the data.
- Cash-flow statement detail (only revenue / NI / EPS from income statement).
- Balance-sheet detail (debt, cash).
- Pre-revenue cap-table info for IONQ/RGTI/etc.
- Charts. JSON / CSV are intentionally chart-builder-ready.
