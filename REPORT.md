# AI · Quantum · Photonics Buildout Supply Chain — Public Markets Map

**Snapshot date:** 2026-05-11 · **Coverage:** 172 publicly traded tickers (US-listed including OTC ADRs) · **Financial window:** 5 most recent fiscal years per filer · **Price window:** monthly closes 2021-05 → 2026-04 (+ partial 2026-05)

## Executive summary

This dataset traces every publicly investable link in the chain that turns mined raw materials into deployed AI compute, quantum hardware, and photonic interconnect — covering 2+ steps both upstream (silicon → wafers → gases → mining) and downstream (server → cloud → power → cooling → real estate → construction → recycling).

**Anchor stack (illustrative):** SMCI builds rack-scale AI servers using NVDA GPUs → NVDA chips are fabbed by TSM → TSM uses ASML EUV scanners + AMAT/LRCX/KLAC tools + Shin-Etsu/SUMCO wafers + LIN/APD specialty gases → those gases trace back to FCX copper, MP rare earths, BHP/RIO industrial metals. Downstream: SMCI servers ship to MSFT/META/xAI clusters → housed in DLR/EQIX data centers → powered by CEG/VST/TLN PPAs → cooled by VRT/JCI/MOD → built by PWR/MTZ EPCs → fed by GLW fiber → and ultimately decommissioned by WM/SMSMY.

**Cross-cuts:** Photonics names (COHR, LITE, IPGP, LASR) show up in three places — AI optical interconnect, EUV light sources for ASML, and trapped-ion lasers for quantum (IONQ, HON/Quantinuum). Power & nuclear (CEG, VST, TLN, GEV, OKLO, BWX) are the most leveraged downstream beneficiaries of the AI capex wave. Materials chokepoints (rare earths via MP/LYSDY, neon/helium via LIN/APD/AIQUY, silicon wafers via SHECY/SUOPY) are quietly the most concentrated parts of the chain.

**Known gaps (private / not US-listed):** xAI, OpenAI, Anthropic, Mistral, Groq, Cerebras (AI labs); BlueFors, Oxford Instruments (quantum cryogenics); SK Hynix, Tokyo Electron, Disco (foreign-listed only); Big Law (partnerships).

## Supply chain map (tier flow)

```
Mining/raw materials  →  Gases/chemicals    →  Wafers/substrates
  FCX SCCO MP LYSDY        LIN APD AIQUY          WOLF SHECY SUOPY SOIGY
  UUUU BHP RIO ALB         DD DOW ECL CE IFF      (Coherent COHR also fits)
                                  ↓
                       WFE + EDA + IP
            ASML AMAT LRCX KLAC TER ONTO ENTG ICHR UCTT
            ACMR KLIC AEHR ASMIY BESIY VECO  |  SNPS CDNS ANSS KEYS  |  ARM RMBS
                                  ↓
                       Foundry + Memory + OSAT
              TSM GFS UMC INTC SSNLF  |  MU WDC STX  |  ASX AMKR
                                  ↓
                       AI silicon design
       NVDA AMD AVGO MRVL QCOM ARM MBLY LSCC MPWR ON ADI TXN MCHP MTSI POWI VICR NVTS AOSL
                                  ↓
                       Networking + Photonics
         ANET CSCO JNPR CIEN  |  COHR LITE IPGP LASR POET VECO
                                  ↓
                ┌─────────  AI SERVER BUILDERS  ─────────┐
                │       SMCI  DELL  HPE  LNVGY            │
                └────────────────────────────────────────┘
                                  ↓
                       Hyperscaler / enterprise compute
              MSFT GOOGL AMZN META ORCL AAPL TSLA IBM PLTR
                                  ↓
    Data-center real estate         Power / utilities          Cooling / HVAC
        DLR EQIX IRM                CEG VST TLN NEE ETR        VRT JCI TT MOD AAON
                                    SO DUK D AEP GEV ETN       LII WTS ROK NVT
                                    HUBB SBGSY ABBNY ENS
                                    POWL OKLO SMR NNE BWX
                                    LNG KMI OKE WMB TRGP
                                  ↓
                       Construction / EPC / fiber
          PWR MTZ KBR FLR J ACM EME DY PRIM STRL AGX VMI  |  GLW COMM BEL
                                  ↓
                       AI software / MLOps / security
       PLTR AI SNOW DDOG MDB ESTC NET NOW CRM ADBE SAP CRWD PANW ZS IOT PATH BRZE
                                  ↓
                       Waste / recycling / e-waste
              WM RSG WCN CWST GFL VEOEY SMSMY

Cross-cuts:  COHR  →  ASML lasers + AI optics + quantum lasers
             IPGP/LASR  →  industrial + defense + quantum
             LIN/APD/AIQUY  →  fab gases + helium for dilution refrigerators (quantum)
             MP/LYSDY/UUUU  →  rare-earth magnets in servers + EVs + defense

Quantum stack:  IONQ RGTI QUBT QBTS ARQQ  +  HON IBM GOOG MSFT INTC (diversified)
```

## Per-segment commentary + financial tables

All revenue/net-income figures USD, converted from native at fiscal-year-end FX rates. EPS shown in **native currency per share** (ADR ratios noted in tickers.csv). 5y revenue CAGR computed across the 5 fiscal years on file. 5y price return computed from 2021-05 close to latest close (currency_native).

### Mining & raw materials (7 tickers)

The most upstream public exposure: copper for cabling/transformers, rare earths for magnets in servers & EVs, lithium for grid storage. China dominates rare-earth processing; MP & LYSDY are the only meaningful non-China public players.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [RIO](https://stockanalysis.com/stocks/rio/) | Rio Tinto plc | $57.64B | $10.25B | 6.08 | -2% | +26% |
| [BHP](https://stockanalysis.com/stocks/bhp/) | BHP Group Ltd | $53.99B | $10.24B | 4.03 | -8% | +253% |
| [FCX](https://stockanalysis.com/stocks/fcx/) | Freeport-McMoRan | $25.91B | $2.20B | 1.52 | +3% | +66% |
| [SCCO](https://stockanalysis.com/stocks/scco/) | Southern Copper | $13.42B | $4.33B | 5.24 | +5% | +208% |
| [MP](https://stockanalysis.com/stocks/mp/) | MP Materials | $224.4M | $-85.9M | -0.50 | -9% | +83% |
| [UUUU](https://stockanalysis.com/stocks/uuuu/) | Energy Fuels | $65.9M | $-85.6M | -0.38 | — | +253% |
| [LYSDY](https://stockanalysis.com/stocks/lysdy/) | Lynas Rare Earths | — | — | — | — | — |

### Specialty gases & chemicals (10 tickers)

Fabs run on industrial gases (LIN/APD/AIQUY) — neon for excimer lasers, ultra-pure H2/N2/O2, helium for cooling. Photoresist + advanced materials from DD/DOW/IFF. Single-source choke points abound (helium-3 for quantum dilution refrigerators).

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [DOW](https://stockanalysis.com/stocks/dow/) | Dow Inc | $39.97B | $-2.62B | -3.70 | -8% | -42% |
| [LIN](https://stockanalysis.com/stocks/lin/) | Linde plc | $33.99B | $6.90B | 14.61 | +2% | +71% |
| [ECL](https://stockanalysis.com/stocks/ecl/) | Ecolab Inc | $16.08B | $2.08B | 7.28 | +6% | +23% |
| [APD](https://stockanalysis.com/stocks/apd/) | Air Products & Chemicals | $12.46B | $2.11B | 9.45 | -0% | +3% |
| [IFF](https://stockanalysis.com/stocks/iff/) | International Flavors & Fragrances | $10.89B | $-361.0M | -1.41 | -2% | -46% |
| [CE](https://stockanalysis.com/stocks/ce/) | Celanese Corp | $9.54B | $-1.17B | -10.64 | +3% | -62% |
| [DD](https://stockanalysis.com/stocks/dd/) | DuPont de Nemours | $6.85B | $-779.0M | -1.86 | -14% | -36% |
| [ALB](https://stockanalysis.com/stocks/alb/) | Albemarle Corp | $1.23B | $416.0M | -5.76 | -15% | +21% |
| [AIQUY](https://stockanalysis.com/stocks/aiquy/) | Air Liquide SA | — | — | — | — | — |
| [AKZOY](https://stockanalysis.com/stocks/akzoy/) | Akzo Nobel NV | — | — | — | — | — |

### Wafer materials & substrates (4 tickers)

Silicon wafers are a Japan duopoly (Shin-Etsu SHECY + SUMCO SUOPY). Soitec (SOIGY) leads SOI for RF/photonics. Wolfspeed (WOLF) is the only public SiC wafer pure-play — restructuring 2025.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [WOLF](https://stockanalysis.com/stocks/wolf/) | Wolfspeed Inc | $712.5M | $544.2M | -10.91 | +6% | +77% |
| [SHECY](https://stockanalysis.com/stocks/shecy/) | Shin-Etsu Chemical | — | — | — | — | — |
| [SUOPY](https://stockanalysis.com/stocks/suopy/) | SUMCO Corp | — | — | — | — | — |
| [SOIGY](https://stockanalysis.com/stocks/soigy/) | Soitec SA | — | — | — | — | — |

### Wafer fab equipment (WFE) (15 tickers)

ASML's EUV monopoly enables sub-7nm. AMAT/LRCX/KLAC cover deposition/etch/inspection. Hybrid bonding for HBM is BESI (BESIY) + ASMI (ASMIY). Subsystem layer (ICHR/UCTT/ENTG) sits underneath.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [ASML](https://stockanalysis.com/stocks/asml/) | ASML Holding NV | $34.18B | $10.69B | 27.48 | +13% | +130% |
| [AMAT](https://stockanalysis.com/stocks/amat/) | Applied Materials | $28.21B | $7.84B | 9.77 | +2% | +206% |
| [LRCX](https://stockanalysis.com/stocks/lrcx/) | Lam Research | $21.68B | $6.71B | 5.30 | +6% | +352% |
| [KLAC](https://stockanalysis.com/stocks/klac/) | KLA Corp | $13.10B | $4.67B | 35.33 | +9% | +477% |
| [ENTG](https://stockanalysis.com/stocks/entg/) | Entegris Inc | $3.20B | $236.6M | 1.55 | +9% | +21% |
| [TER](https://stockanalysis.com/stocks/ter/) | Teradyne Inc | $3.19B | $554.0M | 3.47 | -4% | +169% |
| [UCTT](https://stockanalysis.com/stocks/uctt/) | Ultra Clean Holdings | $2.05B | $-181.2M | -4.00 | -1% | +62% |
| [ONTO](https://stockanalysis.com/stocks/onto/) | Onto Innovation | $1.03B | $106.4M | 2.14 | +1% | +290% |
| [ICHR](https://stockanalysis.com/stocks/ichr/) | Ichor Holdings | $947.6M | $-52.8M | -1.54 | -4% | +38% |
| [ACMR](https://stockanalysis.com/stocks/acmr/) | ACM Research | $901.3M | $94.1M | 1.37 | +36% | +76% |
| [KLIC](https://stockanalysis.com/stocks/klic/) | Kulicke & Soffa Industries | $687.6M | $-64.6M | -1.21 | -18% | +68% |
| [VECO](https://stockanalysis.com/stocks/veco/) | Veeco Instruments | $664.3M | $35.4M | 0.59 | +3% | +147% |
| [AEHR](https://stockanalysis.com/stocks/aehr/) | Aehr Test Systems | $45.3M | $-11.4M | -0.38 | -3% | +3423% |
| [ASMIY](https://stockanalysis.com/stocks/asmiy/) | ASM International | — | — | — | — | — |
| [BESIY](https://stockanalysis.com/stocks/besiy/) | BE Semiconductor Industries | — | — | — | — | — |

### EDA, chip IP, test & measurement (6 tickers)

Chip design impossible without SNPS/CDNS tools + ARM cores. ANSS being absorbed by SNPS. KEYS + TER provide RF and ATE test instruments.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [SNPS](https://stockanalysis.com/stocks/snps/) | Synopsys Inc | $8.01B | $1.10B | 6.44 | +15% | +87% |
| [KEYS](https://stockanalysis.com/stocks/keys/) | Keysight Technologies | $5.68B | $981.0M | 5.55 | +1% | +133% |
| [CDNS](https://stockanalysis.com/stocks/cdns/) | Cadence Design Systems | $5.30B | $1.11B | 4.06 | +15% | +165% |
| [ARM](https://stockanalysis.com/stocks/arm/) | ARM Holdings PLC | $4.92B | $904.0M | 0.85 | +16% | +298% |
| [ANSS](https://stockanalysis.com/stocks/anss/) | Ansys Inc | $2.54B | $575.7M | 6.55 | — | +10% |
| [RMBS](https://stockanalysis.com/stocks/rmbs/) | Rambus Inc | $707.6M | $230.5M | 2.11 | +21% | +445% |

### Foundry & OSAT (5 tickers)

TSM ~62% of foundry; GFS/UMC mature nodes; INTC pivoting to external foundry. OSAT (ASX/AMKR) does the back-end packaging — increasingly value-additive with CoWoS/advanced packaging.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [TSM](https://stockanalysis.com/stocks/tsm/) | Taiwan Semiconductor Manufacturing | $117.28B | $52.27B | 10.08 | +20% | +243% |
| [ASX](https://stockanalysis.com/stocks/asx/) | ASE Technology Holding | $19.87B | $1.23B | 0.54 | -1% | +325% |
| [UMC](https://stockanalysis.com/stocks/umc/) | United Microelectronics | $7.31B | $1.24B | 0.50 | -1% | +63% |
| [GFS](https://stockanalysis.com/stocks/gfs/) | GlobalFoundries | $6.79B | $885.0M | 1.59 | +1% | +7% |
| [AMKR](https://stockanalysis.com/stocks/amkr/) | Amkor Technology | $6.71B | $373.9M | 1.50 | +2% | +224% |

### Memory & storage (4 tickers)

HBM is the new gold: MU + Samsung (SSNLF) + SK Hynix (KRX-only) supply NVDA. WDC split off SanDisk (now SDDXD) in 2025. STX rides HAMR upgrade cycle for hyperscaler nearline.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [SSNLF](https://stockanalysis.com/stocks/ssnlf/) | Samsung Electronics Co Ltd | $227.85B | $30.23B | 4.51 | -1% | — |
| [MU](https://stockanalysis.com/stocks/mu/) | Micron Technology | $58.12B | $24.11B | 21.39 | +17% | +779% |
| [WDC](https://stockanalysis.com/stocks/wdc/) | Western Digital | $11.78B | $6.51B | 16.67 | -11% | +574% |
| [STX](https://stockanalysis.com/stocks/stx/) | Seagate Technology | $11.01B | $2.38B | 10.54 | -1% | +790% |

### AI chip design + adjacent semis (15 tickers)

NVDA's ~90% AI training GPU share + AMD MI300/350 + AVGO/MRVL custom AI ASICs for hyperscalers. Power-management long tail (MPWR/VICR/NVTS/MPWR) is the most NVDA-coupled.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [NVDA](https://stockanalysis.com/stocks/nvda/) | NVIDIA Corp | $215.94B | $120.07B | 4.90 | +68% | +1004% |
| [INTC](https://stockanalysis.com/stocks/intc/) | Intel Corp | $52.85B | $-267.0M | -0.06 | -10% | +119% |
| [QCOM](https://stockanalysis.com/stocks/qcom/) | Qualcomm Inc | $44.28B | $5.54B | 5.01 | +7% | +63% |
| [AMD](https://stockanalysis.com/stocks/amd/) | Advanced Micro Devices | $34.64B | $4.33B | 2.67 | +20% | +377% |
| [TXN](https://stockanalysis.com/stocks/txn/) | Texas Instruments | $17.68B | $5.00B | 5.45 | -1% | +52% |
| [ADI](https://stockanalysis.com/stocks/adi/) | Analog Devices | $11.76B | $2.71B | 5.47 | -1% | +153% |
| [ON](https://stockanalysis.com/stocks/on/) | ON Semiconductor | $6.00B | $121.0M | 0.29 | -3% | +158% |
| [MCHP](https://stockanalysis.com/stocks/mchp/) | Microchip Technology | $4.71B | $118.8M | 0.22 | -9% | +26% |
| [MPWR](https://stockanalysis.com/stocks/mpwr/) | Monolithic Power Systems | $2.79B | $621.5M | 12.86 | +23% | +367% |
| [MBLY](https://stockanalysis.com/stocks/mbly/) | Mobileye Global | $1.89B | $-392.0M | -0.48 | +8% | -65% |
| [AOSL](https://stockanalysis.com/stocks/aosl/) | Alpha & Omega Semi | $696.2M | $-19.2M | -3.30 | +1% | +25% |
| [LSCC](https://stockanalysis.com/stocks/lscc/) | Lattice Semiconductor | $574.0M | $19.9M | 0.14 | -3% | +140% |
| [POWI](https://stockanalysis.com/stocks/powi/) | Power Integrations | $443.5M | $22.1M | 0.39 | -11% | -11% |
| [VICR](https://stockanalysis.com/stocks/vicr/) | Vicor Corp | $407.7M | $118.6M | 2.61 | +3% | +185% |
| [NVTS](https://stockanalysis.com/stocks/nvts/) | Navitas Semiconductor | $45.9M | $-118.1M | -0.57 | +18% | +51% |

### Networking & photonics (12 tickers)

AI fabrics (ANET, AVGO/MRVL/CSCO silicon) + optical interconnect (COHR/LITE) + lasers (IPGP/LASR/COHR). Photonics shows up here, in EUV light sources, and in trapped-ion quantum.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [AVGO](https://stockanalysis.com/stocks/avgo/) | Broadcom Inc | $68.28B | $24.97B | 5.12 | +20% | +810% |
| [CSCO](https://stockanalysis.com/stocks/csco/) | Cisco Systems | $59.05B | $11.08B | 2.85 | +3% | +83% |
| [ANET](https://stockanalysis.com/stocks/anet/) | Arista Networks | $9.01B | $3.51B | 2.75 | +32% | +568% |
| [MRVL](https://stockanalysis.com/stocks/mrvl/) | Marvell Technology | $8.20B | $2.67B | 3.07 | +16% | +252% |
| [COHR](https://stockanalysis.com/stocks/cohr/) | Coherent Corp | $5.81B | $-80.6M | -0.52 | +17% | +398% |
| [CIEN](https://stockanalysis.com/stocks/cien/) | Ciena Corp | $5.12B | $229.1M | 1.57 | +9% | +937% |
| [JNPR](https://stockanalysis.com/stocks/jnpr/) | Juniper Networks | $5.07B | $287.9M | 0.86 | — | — |
| [LITE](https://stockanalysis.com/stocks/lite/) | Lumentum Holdings | $2.49B | $438.2M | 5.40 | +10% | +1011% |
| [MTSI](https://stockanalysis.com/stocks/mtsi/) | MACOM Technology Solutions | $1.07B | $176.8M | 2.31 | +12% | +508% |
| [IPGP](https://stockanalysis.com/stocks/ipgp/) | IPG Photonics | $1.00B | $31.1M | 0.73 | -9% | -50% |
| [LASR](https://stockanalysis.com/stocks/lasr/) | nLIGHT Inc | $261.3M | $-23.5M | -0.47 | -1% | +104% |
| [POET](https://stockanalysis.com/stocks/poet/) | POET Technologies | $1.1M | $-63.0M | -0.68 | +50% | -5% |

### AI server builders (4 tickers)

Where it all ends up: SMCI/DELL/HPE/LNVGY assemble the rack-scale GPU clusters. Margins thin; volume is everything.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [DELL](https://stockanalysis.com/stocks/dell/) | Dell Technologies | $113.54B | $5.94B | 8.68 | +3% | +421% |
| [HPE](https://stockanalysis.com/stocks/hpe/) | Hewlett Packard Enterprise | $35.74B | $-234.0M | -0.19 | +6% | +96% |
| [SMCI](https://stockanalysis.com/stocks/smci/) | Super Micro Computer | $33.70B | $1.25B | 1.89 | +60% | +919% |
| [LNVGY](https://stockanalysis.com/stocks/lnvgy/) | Lenovo Group Ltd | — | — | — | — | +33% |

### Hyperscalers & end-users (8 tickers)

The buyers: MSFT/META/AMZN/GOOG dominate. ORCL/TSLA/AAPL/IBM/PLTR are large but distant followers. xAI/OpenAI/Anthropic are private; closest proxy is MSFT (OpenAI investor).

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [AMZN](https://stockanalysis.com/stocks/amzn/) | Amazon.com Inc | $716.92B | $77.67B | 7.17 | +11% | +69% |
| [AAPL](https://stockanalysis.com/stocks/aapl/) | Apple Inc | $451.44B | $122.58B | 8.27 | +3% | +114% |
| [GOOGL](https://stockanalysis.com/stocks/googl/) | Alphabet Inc | $402.84B | $132.17B | 10.82 | +12% | +240% |
| [MSFT](https://stockanalysis.com/stocks/msft/) | Microsoft Corp | $318.27B | $125.22B | 16.80 | +13% | +66% |
| [META](https://stockanalysis.com/stocks/meta/) | Meta Platforms Inc | $200.97B | $60.46B | 23.49 | +14% | +75% |
| [TSLA](https://stockanalysis.com/stocks/tsla/) | Tesla Inc | $94.83B | $3.79B | 1.08 | +15% | +89% |
| [IBM](https://stockanalysis.com/stocks/ibm/) | International Business Machines | $67.53B | $10.59B | 11.17 | +4% | +57% |
| [ORCL](https://stockanalysis.com/stocks/orcl/) | Oracle Corp | $64.08B | $16.19B | 5.57 | +11% | +152% |

### AI software, MLOps & security (17 tickers)

Software layer riding inferencing demand: PLTR (highest growth), SNOW/MDB/DDOG (data + observability), CRWD/PANW/ZS (security for AI workloads).

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [CRM](https://stockanalysis.com/stocks/crm/) | Salesforce Inc | $41.52B | $7.46B | 7.80 | +12% | -26% |
| [SAP](https://stockanalysis.com/stocks/sap/) | SAP SE | $38.50B | $7.49B | 6.38 | +6% | +24% |
| [ADBE](https://stockanalysis.com/stocks/adbe/) | Adobe Inc | $24.45B | $7.21B | 17.17 | +9% | -57% |
| [NOW](https://stockanalysis.com/stocks/now/) | ServiceNow Inc | $13.28B | $1.75B | 1.67 | +23% | -17% |
| [PANW](https://stockanalysis.com/stocks/panw/) | Palo Alto Networks | $9.89B | $1.28B | 1.81 | +16% | +236% |
| [CRWD](https://stockanalysis.com/stocks/crwd/) | CrowdStrike Holdings | $4.81B | $-162.5M | -0.65 | +35% | +110% |
| [SNOW](https://stockanalysis.com/stocks/snow/) | Snowflake Inc | $4.68B | $-1.33B | -3.95 | +40% | -37% |
| [PLTR](https://stockanalysis.com/stocks/pltr/) | Palantir Technologies | $4.47B | $1.63B | 0.63 | +31% | +423% |
| [DDOG](https://stockanalysis.com/stocks/ddog/) | Datadog Inc | $3.43B | $107.7M | 0.31 | +35% | +92% |
| [ZS](https://stockanalysis.com/stocks/zs/) | Zscaler Inc | $3.00B | $-66.9M | -0.42 | +29% | -30% |
| [MDB](https://stockanalysis.com/stocks/mdb/) | MongoDB Inc | $2.46B | $-71.2M | -0.88 | +30% | -17% |
| [NET](https://stockanalysis.com/stocks/net/) | Cloudflare Inc | $2.17B | $-102.3M | -0.29 | +35% | +85% |
| [ESTC](https://stockanalysis.com/stocks/estc/) | Elastic NV | $1.68B | $-84.5M | -0.80 | +18% | -64% |
| [IOT](https://stockanalysis.com/stocks/iot/) | Samsara Inc | $1.62B | $-9.1M | -0.02 | +39% | +64% |
| [PATH](https://stockanalysis.com/stocks/path/) | UiPath Inc | $1.61B | $282.3M | 0.52 | +16% | -84% |
| [BRZE](https://stockanalysis.com/stocks/brze/) | Braze Inc | $738.2M | $-131.3M | -1.22 | +33% | -72% |
| [AI](https://stockanalysis.com/stocks/ai/) | C3.ai Inc | $307.4M | $-434.5M | -3.16 | +5% | -84% |

### Data-center REITs (3 tickers)

Capacity is the bottleneck. DLR + EQIX dominate. IRM moving fast into data-center build.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [EQIX](https://stockanalysis.com/stocks/eqix/) | Equinix Inc | $9.22B | $1.35B | 13.76 | +9% | +34% |
| [IRM](https://stockanalysis.com/stocks/irm/) | Iron Mountain Inc | $6.90B | $144.6M | 0.49 | +11% | +204% |
| [DLR](https://stockanalysis.com/stocks/dlr/) | Digital Realty Trust | $6.11B | $1.27B | 3.58 | +8% | +30% |

### Power & electrical equipment (10 tickers)

Grid + UPS + transformers + switchgear. GEV (just-spun-off) the biggest. VRT/ETN/ENS/HUBB are NVDA-coupled.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [SBGSY](https://stockanalysis.com/stocks/sbgsy/) | Schneider Electric SE | $42.01B | $4.36B | 7.67 | +6% | — |
| [GEV](https://stockanalysis.com/stocks/gev/) | GE Vernova | $38.07B | $4.88B | 17.69 | +4% | +577% |
| [ABBNY](https://stockanalysis.com/stocks/abbny/) | ABB Ltd | $33.22B | $4.73B | 2.59 | +4% | — |
| [ETN](https://stockanalysis.com/stocks/etn/) | Eaton Corp | $27.45B | $4.09B | 10.45 | +9% | +171% |
| [VRT](https://stockanalysis.com/stocks/vrt/) | Vertiv Holdings | $10.23B | $1.33B | 3.41 | +20% | +1145% |
| [ROK](https://stockanalysis.com/stocks/rok/) | Rockwell Automation | $8.80B | $1.01B | 9.62 | +3% | +59% |
| [HUBB](https://stockanalysis.com/stocks/hubb/) | Hubbell Inc | $5.84B | $887.0M | 16.54 | +9% | +164% |
| [NVT](https://stockanalysis.com/stocks/nvt/) | nVent Electric plc | $3.89B | $710.2M | 4.31 | +12% | +444% |
| [ENS](https://stockanalysis.com/stocks/ens/) | EnerSys | $3.74B | $312.8M | 8.07 | +3% | +135% |
| [POWL](https://stockanalysis.com/stocks/powl/) | Powell Industries | $1.10B | $180.8M | 4.95 | +24% | +2899% |

### Utilities / IPP / SMR / nuclear (13 tickers)

Power generation is the AI build-out's bottleneck. CEG/VST/TLN signing 10-20yr nuclear PPAs with hyperscalers. SMR pure-plays OKLO/SMR/NNE pre-revenue but speculative. BWX fuels everything.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [DUK](https://stockanalysis.com/stocks/duk/) | Duke Energy | $32.24B | $4.91B | 6.31 | +7% | +26% |
| [SO](https://stockanalysis.com/stocks/so/) | Southern Co | $29.55B | $4.34B | 3.92 | +6% | +52% |
| [NEE](https://stockanalysis.com/stocks/nee/) | NextEra Energy | $27.41B | $6.83B | 3.30 | +13% | +27% |
| [CEG](https://stockanalysis.com/stocks/ceg/) | Constellation Energy | $25.53B | $2.32B | 7.40 | +7% | +560% |
| [AEP](https://stockanalysis.com/stocks/aep/) | American Electric Power | $21.88B | $3.58B | 6.62 | +7% | +54% |
| [VST](https://stockanalysis.com/stocks/vst/) | Vistra Corp | $17.74B | $752.0M | 2.18 | +10% | +696% |
| [D](https://stockanalysis.com/stocks/d/) | Dominion Energy | $16.51B | $3.00B | 3.45 | +10% | -16% |
| [ETR](https://stockanalysis.com/stocks/etr/) | Entergy Corp | $12.95B | $1.76B | 3.91 | +2% | +124% |
| [BWX](https://stockanalysis.com/stocks/bwx/) | BWX Technologies | $3.20B | $328.9M | 3.58 | +11% | +253% |
| [TLN](https://stockanalysis.com/stocks/tln/) | Talen Energy | $2.58B | $-219.0M | -4.79 | +29% | +612% |
| [SMR](https://stockanalysis.com/stocks/smr/) | NuScale Power | $31.5M | $-355.8M | -2.17 | +82% | +25% |
| [OKLO](https://stockanalysis.com/stocks/oklo/) | Oklo Inc | — | $-105.7M | -0.72 | — | +638% |
| [NNE](https://stockanalysis.com/stocks/nne/) | Nano Nuclear Energy | — | $-43.5M | -1.08 | — | +17% |

### Gas / LNG midstream (5 tickers)

Gas turbines power most new data-center additions. LNG/KMI/OKE/WMB/TRGP are the fuel-delivery layer.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [OKE](https://stockanalysis.com/stocks/oke/) | ONEOK Inc | $33.63B | $3.39B | 5.42 | +19% | +53% |
| [LNG](https://stockanalysis.com/stocks/lng/) | Cheniere Energy | $19.98B | $5.33B | 24.13 | +6% | +177% |
| [TRGP](https://stockanalysis.com/stocks/trgp/) | Targa Resources | $17.03B | $1.85B | 8.49 | +0% | +458% |
| [KMI](https://stockanalysis.com/stocks/kmi/) | Kinder Morgan | $16.94B | $3.06B | 1.37 | +0% | +72% |
| [WMB](https://stockanalysis.com/stocks/wmb/) | Williams Companies | $11.95B | $2.62B | 2.14 | +3% | +171% |

### Cooling / HVAC (6 tickers)

Liquid cooling is forced by NVDA GB200/GB300. VRT + MOD + NVT + JCI are the picks-and-shovels here.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [JCI](https://stockanalysis.com/stocks/jci/) | Johnson Controls | $24.43B | $3.53B | 5.59 | +4% | +103% |
| [TT](https://stockanalysis.com/stocks/tt/) | Trane Technologies | $21.32B | $2.92B | 12.98 | +11% | +153% |
| [LII](https://stockanalysis.com/stocks/lii/) | Lennox International | $5.20B | $805.8M | 22.79 | +5% | +49% |
| [MOD](https://stockanalysis.com/stocks/mod/) | Modine Manufacturing | $2.58B | $184.0M | 3.42 | +8% | +1546% |
| [WTS](https://stockanalysis.com/stocks/wts/) | Watts Water Technologies | $2.44B | $340.8M | 10.17 | +8% | +103% |
| [AAON](https://stockanalysis.com/stocks/aaon/) | AAON Inc | $1.44B | $108.0M | 1.29 | +28% | +235% |

### Construction / EPC / infra (12 tickers)

Building the data centers + the power that feeds them. PWR + MTZ dominate utility transmission build; STRL + AGX + EME the site / mechanical layer.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [PWR](https://stockanalysis.com/stocks/pwr/) | Quanta Services | $28.48B | $1.03B | 6.80 | +22% | +723% |
| [EME](https://stockanalysis.com/stocks/eme/) | EMCOR Group | $16.99B | $1.27B | 28.19 | +14% | +648% |
| [ACM](https://stockanalysis.com/stocks/acm/) | AECOM | $16.14B | $562.0M | 4.21 | +7% | +27% |
| [FLR](https://stockanalysis.com/stocks/flr/) | Fluor Corp | $15.50B | $-51.0M | -0.31 | +2% | +145% |
| [MTZ](https://stockanalysis.com/stocks/mtz/) | MasTec Inc | $14.30B | $399.0M | 5.07 | +16% | +290% |
| [J](https://stockanalysis.com/stocks/j/) | Jacobs Solutions | $13.18B | $381.0M | 3.25 | +8% | -11% |
| [KBR](https://stockanalysis.com/stocks/kbr/) | KBR Inc | $7.69B | $400.0M | 3.14 | +4% | -15% |
| [PRIM](https://stockanalysis.com/stocks/prim/) | Primoris Services | $7.58B | $274.9M | 5.02 | +21% | +256% |
| [DY](https://stockanalysis.com/stocks/dy/) | Dycom Industries | $5.55B | $281.2M | 9.56 | +15% | +475% |
| [VMI](https://stockanalysis.com/stocks/vmi/) | Valmont Industries | $4.10B | $350.0M | 16.79 | +4% | +116% |
| [STRL](https://stockanalysis.com/stocks/strl/) | Sterling Infrastructure | $2.49B | $290.0M | 9.38 | +15% | +3401% |
| [AGX](https://stockanalysis.com/stocks/agx/) | Argan Inc | $944.6M | $137.8M | 9.74 | +17% | +1323% |

### Fiber / cabling / glass (3 tickers)

GLW (Corning) for optical fiber + display glass; COMM + BEL for cabling. Quietly enabled by hyperscaler capex.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [GLW](https://stockanalysis.com/stocks/glw/) | Corning Inc | $15.63B | $1.60B | 1.83 | +3% | +357% |
| [BEL](https://stockanalysis.com/stocks/bel/) | Belden Inc | $2.71B | $237.5M | 5.91 | +4% | +1969% |
| [COMM](https://stockanalysis.com/stocks/comm/) | CommScope Holding | $1.93B | $2.21B | 9.63 | -27% | — |

### Waste / recycling (7 tickers)

End-of-life: WM/RSG/WCN/CWST/GFL handle the waste streams; SMSMY/VEOEY specifically target e-waste / metal recovery from decommissioned servers.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [VEOEY](https://stockanalysis.com/stocks/veoey/) | Veolia Environnement | $46.45B | $1.27B | 1.61 | +9% | — |
| [WM](https://stockanalysis.com/stocks/wm/) | Waste Management | $25.20B | $2.71B | 6.70 | +9% | +54% |
| [RSG](https://stockanalysis.com/stocks/rsg/) | Republic Services | $16.59B | $2.14B | 6.85 | +10% | +82% |
| [WCN](https://stockanalysis.com/stocks/wcn/) | Waste Connections | $9.47B | $1.08B | 4.17 | +11% | +27% |
| [SMSMY](https://stockanalysis.com/stocks/smsmy/) | Sims Metal Management | $4.68B | $-11.8M | -0.06 | -10% | — |
| [CWST](https://stockanalysis.com/stocks/cwst/) | Casella Waste | $1.84B | $7.9M | 0.12 | +20% | +35% |
| [GFL](https://stockanalysis.com/stocks/gfl/) | GFL Environmental | — | — | 13.71 | — | +15% |

### Quantum (pure-plays & diversified) (6 tickers)

5 pure-plays mostly pre-revenue (IONQ trapped ion most advanced commercially; QBTS only one with material commercial revenue). HON owns majority of Quantinuum. IBM + GOOG + MSFT + INTC have research-grade systems via internal labs.

| Ticker | Name | Rev (FY-latest) | Net inc | EPS | 5y Rev CAGR | 5y px return |
| --- | --- | --- | --- | --- | --- | --- |
| [HON](https://stockanalysis.com/stocks/hon/) | Honeywell International | $37.44B | $4.73B | 7.36 | +2% | -3% |
| [IONQ](https://stockanalysis.com/stocks/ionq/) | IonQ Inc | $130.0M | $-510.4M | -1.82 | +181% | +361% |
| [QBTS](https://stockanalysis.com/stocks/qbts/) | D-Wave Quantum | $24.6M | $-355.1M | -1.11 | +41% | +128% |
| [RGTI](https://stockanalysis.com/stocks/rgti/) | Rigetti Computing | $7.1M | $-216.2M | -0.70 | — | +95% |
| [QUBT](https://stockanalysis.com/stocks/qubt/) | Quantum Computing Inc | $680K | $-18.7M | -0.11 | — | +85% |
| [ARQQ](https://stockanalysis.com/stocks/arqq/) | Arqit Quantum | $530K | $-35.3M | -2.56 | +80% | -94% |

## Cross-cuts

**Photonics players spanning AI + quantum:**
- **COHR (Coherent):** EUV CO2 lasers for ASML lithography, 800G/1.6T optical transceivers for AI fabrics, lasers for trapped-ion quantum. Three structural growth drivers in one company.
- **LITE (Lumentum):** Optical transceivers for AI + iPhone VCSELs + quantum-adjacent lasers.
- **IPGP, LASR:** Industrial + defense + quantum (cooling laser systems).

**Power names with the biggest AI-PPA leverage:**
- **CEG (Constellation):** Three Mile Island restart for 20-yr Microsoft PPA — first dedicated nuclear-AI deal.
- **VST (Vistra):** Texas + Comanche Peak nuclear; large hyperscaler pipeline.
- **TLN (Talen):** Susquehanna nuclear + Cumulus AI campus sold to Amazon.
- **GEV (GE Vernova):** Gas turbines + grid + BWRX-300 SMR; AI capex backlog through 2027.
- **OKLO, SMR, NNE, BWX:** Pre-revenue SMR plays + BWX as fuel monopolist.

**Materials chokepoints (single points of failure):**
- Rare-earth magnets: MP (only operating US mine) + LYSDY (sole non-China processor at scale).
- Helium-3 (dilution refrigerators for quantum): LIN + APD + AIQUY tightly controlled.
- EUV pellicles + photoresist: mostly Japan (Shin-Etsu SHECY, JSR private).
- Silicon wafers: Shin-Etsu (SHECY) + SUMCO (SUOPY) duopoly.
- Neon gas (excimer laser fuel): historically Ukraine-concentrated; now diversified to LIN/APD on-site at fabs.

**Liquid-cooling beneficiaries (NVDA GB200/GB300 wave):**
- **VRT (Vertiv):** Coolant Distribution Units (CDUs) for rack-level liquid cooling.
- **MOD (Modine):** Airedale heat rejection + CDUs for AI servers.
- **NVT (nVent):** Trachte enclosures + busbars + liquid-cooled cabinets.
- **JCI (Johnson Controls):** Silent-Aire / YORK chillers.

## Gaps & caveats

**Private companies (no public investable proxy):**
- AI foundation-model labs: xAI, OpenAI (MSFT-aligned), Anthropic (AMZN/GOOGL-aligned), Mistral, Cohere, Groq, Cerebras, Tenstorrent.
- AI infra/cloud: CoreWeave (IPO'd 2025 as CRWV — added in v2; not in this snapshot), Lambda Labs.
- Quantum cryogenics: BlueFors (Finland, private); Oxford Instruments (UK only OXIG.L).
- Specialty subsystems: Zeiss SMT (EUV optics, owned by Carl Zeiss AG private), TRUMPF (EUV CO2 laser source, German private).
- EUV photoresist: JSR (taken private 2024), Tokyo Ohka Kogyo (Japan only TOOCY OTC).

**Excluded foreign-only listings (user choice):**
- SK Hynix (#2 DRAM, dominant HBM supplier) — only KRX 000660.
- Tokyo Electron (TEL) — only TSE 8035.T (OTC TOELY unsponsored).
- Disco Corp (semiconductor dicing) — only TSE 6146.T.
- SMIC, NAURA, AMEC (China semi/equipment) — A-shares + HK; under US entity list.

**Data caveats:**
- FX conversions use approximate fiscal-year-end rates from public references (full table in `notes/caveats.md`); precise FY-end rates may differ ±1-2% vs. broker-quality data.
- For ADRs of foreign reporters (TSM, ASML, SAP, etc.), revenue/NI are company-wide native then converted; EPS may reflect per-ADR vs per-ordinary depending on stockanalysis.com normalization — see per-ticker JSON `notes` field.
- OTC unsponsored ADRs (SSNLF Samsung, SHECY Shin-Etsu, SUOPY SUMCO, SOIGY Soitec, AIQUY Air Liquide, AKZOY Akzo, LYSDY Lynas, VEOEY Veolia, SMSMY Sims, ASMIY ASM Intl, BESIY BESI, SBGSY Schneider, ABBNY ABB, LNVGY Lenovo) — pricing on US exchanges may be illiquid; native-listing financials used and converted.
- GE Vernova (GEV) spun off Apr 2024 — only 1-2 standalone fiscal years exist.
- Pre-revenue / emerging: IONQ, RGTI, QUBT, QBTS, ARQQ, OKLO, SMR, NNE, POET — financials show losses, valued on TAM optionality.
- Non-calendar fiscal years (NVDA Jan, MSFT Jun, AVGO Oct/Nov, DELL Jan, HPE Oct, CSCO Jul, ORCL May, SMCI Jun, AAPL Sep) — when comparing across companies, use fiscal_year_end_date column, not raw fy.
- Price agent in some cases produced partial monthly windows (<60 closes) for thinly-traded OTC ADRs; flagged in per-ticker JSON.

## Files in this dataset

- `REPORT.md` — this narrative
- `README.md` — methodology + how to read
- `tickers.csv` — master registry (172 tickers; segment / tier / role / upstream-downstream)
- `financials.csv` — 5yr annual financials, native + USD, 1 row per ticker × FY
- `prices_monthly.csv` — monthly closes 2021-05 → 2026-04, native + USD
- `data/tickers.json` — structured registry + relationship graph
- `data/financials/<TICKER>.json` — per-ticker income-statement detail
- `data/prices/<TICKER>.json` — per-ticker monthly price array
- `notes/` — fetch log, caveats, missing-data registry
