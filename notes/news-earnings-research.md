# News + earnings API research (2026-05-13)

Goal: per-ticker stock news (~180 US tickers, 5-10 latest headlines) and next-earnings
date, called **client-side** from a static SPA hosted on Cloudflare Pages. CORS support
is the make-or-break requirement.

## TL;DR

- Pure client-side, no key, no proxy: **Google News RSS via a CORS proxy** (or Yahoo
  Finance RSS, same constraint). Both feeds are publicly available and were verified
  returning live NVDA results today; neither sets `Access-Control-Allow-Origin`, so they
  need a tiny pass-through.
- Hosted on Cloudflare Pages, you already have the cheapest proxy available:
  **Pages Functions** (same project, same domain, no extra deploy, 100k requests/day
  free). That is the recommended approach.
- For earnings, the cleanest free path is **Finnhub `/calendar/earnings`** keyed by
  symbol — same proxy story applies. If we want zero-API-key, a thin scrape of
  `stockanalysis.com/stocks/<ticker>/` returns the earnings date in server-rendered
  HTML.

Direct-from-browser (no proxy at all) is **not** reliably available on any of the free
providers tested. SEC EDGAR explicitly states it does not support CORS. Finnhub has an
open CORS bug (issue #286). Marketaux/Polygon/Alpha Vantage docs don't advertise CORS
and forum reports are mixed at best. NewsAPI.org's free plan blocks all non-localhost
browser requests by policy.

---

## News — recommended approach

**Google News RSS, fronted by a Cloudflare Pages Function.** The RSS query
`https://news.google.com/rss/search?q=<TICKER>+stock&hl=en-US&gl=US&ceid=US:en` is free,
needs no API key, aggregates Reuters/CNBC/Bloomberg/etc., and was verified today
returning 50+ live NVDA items. Yahoo Finance RSS
(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=<TICKER>&region=US&lang=en-US`)
is an equally viable backup — also verified live today, also no key.

Both feeds lack `Access-Control-Allow-Origin`, so a same-origin function on
Cloudflare Pages parses and re-serves with CORS headers. Cost: $0 up to 100k req/day,
which dwarfs our footprint (180 tickers x weekly refresh = ~720 req/week).

### Integration plan

Cloudflare Pages Function at `functions/api/news/[ticker].js`:

```js
// functions/api/news/[ticker].js
export async function onRequestGet({ params, request }) {
  const ticker = String(params.ticker || "").toUpperCase().replace(/[^A-Z.]/g, "");
  if (!ticker) return new Response("bad ticker", { status: 400 });

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(ticker + " stock")}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } });
  const xml = await res.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10).map(m => {
    const get = (tag) => (m[1].match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)) || [])[1] || "";
    return {
      title:   get("title").replace(/<!\[CDATA\[|\]\]>/g, ""),
      link:    get("link"),
      pubDate: get("pubDate"),
      source:  (get("source") || "").replace(/<!\[CDATA\[|\]\]>/g, "")
                .replace(/^<source url="[^"]*">|<\/source>$/g, ""),
    };
  });

  return new Response(JSON.stringify({ ticker, items }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600, s-maxage=21600",
      "access-control-allow-origin": "*",
    },
  });
}
```

Viewer JS (same-origin, no key, no CORS dance):

```js
async function fetchNews(ticker) {
  const r = await fetch(`/api/news/${encodeURIComponent(ticker)}`);
  if (!r.ok) throw new Error(`news fetch ${r.status}`);
  const { items } = await r.json();
  return items; // [{ title, link, pubDate, source }, ...]
}
```

If we'd rather pre-bake everything weekly into static JSON (simpler, no Functions at
all): a GitHub Action or local Node script fetches the same RSS for all 180 tickers,
writes `data/news/<TICKER>.json` files, and commits them. The viewer fetches
`/data/news/NVDA.json` as a static asset.

### Considered alternatives

| Source | Free tier | API key | CORS for browser? | Verified today | Notes |
|---|---|---|---|---|---|
| **Google News RSS** | unlimited (practically) | no | no header, needs proxy | yes — 50+ NVDA items | Aggregates CNBC/Barron's/TradingView/Reuters. Link is a redirect via news.google.com. |
| **Yahoo Finance RSS** (`feeds.finance.yahoo.com`) | unlimited | no | no CORS header (long-standing) | yes — items dated within hours | Direct Yahoo links, has author/source. Slightly fewer items than Google. |
| **Finnhub `/company-news`** | 60 req/min | yes (free signup) | open issue #286, CORS not honored in browser; npm client exists for Node | demo token = 401 | Strong JSON shape (headline, source, url, summary, image). Need proxy + register key. |
| **Marketaux** | 100 req/day, 3 articles/req | yes | docs silent, no public confirmation | demo token = 403 | 100/day is too tight for 180 tickers even weekly. |
| **Polygon.io news** | 5 req/min | yes | not advertised for browser; key would be exposed | demo key = 401 | Rate limit too low for live use; cache-warm only. |
| **Alpha Vantage NEWS_SENTIMENT** | 25 req/day | yes | not advertised | demo key returns boilerplate, no data | 25/day rules it out for 180 tickers. |
| **NewsAPI.org** | 100 req/day | yes | **explicitly blocked from non-localhost browsers** | demo key = 401 | Free plan policy forbids production browser use. Hard no. |
| **stockanalysis.com/stocks/&lt;t&gt;/** | unlimited | no | HTML page, no CORS | yes — server-rendered news + earnings | Scraping a 3rd party in production is fragile and ToS-grey; only as last-resort fallback. |
| **SEC EDGAR** | unlimited | no | **SEC explicitly says no CORS** | 403 from WebFetch (likely UA filter) | Returns 8-K filings, not "news". Requires identifying User-Agent header. |

### Risk / breakage notes

- Google News RSS has shifted output formats before (links now go through redirect
  IDs). If the format breaks, fall back to Yahoo RSS — both are essentially free.
- Yahoo dropped its JSON quote endpoints years ago but kept RSS feeds; still working
  in 2026 per multiple sources.
- Scraping stockanalysis.com is fine for a 180-ticker weekly batch but I would not
  build the production live path on it.

---

## Earnings — recommended approach

**Finnhub `/calendar/earnings` keyed by symbol**, proxied through the same Pages
Function pattern. Free tier 60 req/min with a registered key. Returns next earnings
date plus EPS estimate, time-of-day (BMO/AMC), and revenue estimate in clean JSON.

If we want zero-API-key, **scrape stockanalysis.com**: the page
`https://stockanalysis.com/stocks/<ticker>/` returns "Earnings Date: May 20, 2026" in
server-rendered HTML (verified today for NVDA). robots.txt allows it, no
crawl-delay. Same Function-as-proxy pattern.

### Integration plan (Finnhub variant)

Add `FINNHUB_API_KEY` as a Cloudflare Pages env secret; never ship to the browser.

```js
// functions/api/earnings/[ticker].js
export async function onRequestGet({ params, env }) {
  const ticker = String(params.ticker || "").toUpperCase().replace(/[^A-Z.]/g, "");
  if (!ticker) return new Response("bad ticker", { status: 400 });

  // Look 90 days forward for the next confirmed earnings date.
  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const to = new Date(today.getTime() + 90 * 86400_000).toISOString().slice(0, 10);

  const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&symbol=${ticker}&token=${env.FINNHUB_API_KEY}`;
  const r = await fetch(url, { cf: { cacheTtl: 21600, cacheEverything: true } });
  const j = await r.json();
  const next = (j.earningsCalendar || [])[0] || null;

  return new Response(JSON.stringify({ ticker, next }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=21600, s-maxage=86400",
      "access-control-allow-origin": "*",
    },
  });
}
```

Viewer:

```js
async function fetchEarnings(ticker) {
  const r = await fetch(`/api/earnings/${encodeURIComponent(ticker)}`);
  if (!r.ok) return null;
  const { next } = await r.json();
  return next; // { date, epsEstimate, hour, revenueEstimate, ... } | null
}
```

### Considered alternatives

| Source | Coverage | API key | CORS for browser? | Verified today | Notes |
|---|---|---|---|---|---|
| **Finnhub `/calendar/earnings`** | per-symbol forward window, US complete | yes (free) | needs proxy | demo = 401 (signup required) | Cleanest JSON. Includes EPS estimate, BMO/AMC, revenue. |
| **stockanalysis.com/stocks/&lt;t&gt;/** | per-ticker | no | scrape, needs proxy | yes — "May 20, 2026" present in HTML | Just a date string, no estimates. robots.txt allows. |
| **Yahoo Finance `/calendar/earnings`** | weekly index | no | HTML scrape | partial — NVDA not in current-week index page | Requires walking the calendar by date, awkward for "next earnings per ticker". |
| **Earnings Whispers** | per-ticker | freemium | scrape, page shows dashes without login | yes — `Earnings Date: -` (paywall) | Public page literally shows hyphens, gated. Not usable free. |
| **NASDAQ.com `api.nasdaq.com/api/calendar/earnings`** | by date | no | tight UA / Akamai filtering | both endpoints timed out from WebFetch | Anecdotally works when called with a real browser UA, but unreliable and they actively block scrapers. |
| **SEC EDGAR (8-K)** | per-CIK filings, hint at earnings | no | **no CORS** | 403 from WebFetch (UA filter) | Filings tell you when earnings *was* announced, not when *next* will be. Indirect and lossy. |
| **wisesheets / similar aggregators** | per-ticker | yes | not free | n/a | Paid only. |

### Risk / breakage notes

- Finnhub free plan has been steady for years; the main risk is them tightening
  free-tier coverage of `/calendar/earnings`. They currently include it.
- stockanalysis.com markup could change at any time — a 1-line regex over
  "Earnings Date" survives most rewrites; pin the selector defensively.
- Earnings Whispers and Yahoo earnings calendar are not viable as primary sources.

---

## What about going proxy-less?

Short version: **no free, reliable browser-side option exists for either feed.**

- Public CORS proxies (corsproxy.io, allorigins.win) work but are unreliable, rate-
  limited, occasionally inject errors, and break user trust because your viewer sends
  every ticker request through a third party. corsproxy.io now caps free responses at
  1 MB and has changed pricing several times.
- The cheapest robust path is a Cloudflare Pages Function in the same project as the
  SPA — 100k requests/day on the free Workers/Pages plan, deployed automatically with
  the static site, runs at the same origin so no CORS dance in the viewer at all.
- If we'd rather avoid even that: pre-build static JSON files weekly (GitHub Actions
  or local script), commit them to `data/news/<TICKER>.json` and `data/earnings/<TICKER>.json`,
  and serve them as plain static assets. Refresh weekly is in-scope per the brief.
  Zero runtime cost, zero runtime risk, zero CORS, but stale-for-a-week.

---

## Recommendation summary

Build a **Cloudflare Pages Function proxy** for both feeds at `/api/news/:ticker` and
`/api/earnings/:ticker`. News fetches Google News RSS (no key, no signup); earnings
fetches Finnhub `/calendar/earnings` with a free registered key stored as a Pages
secret. Cache both at the Cloudflare edge for 6-24 hours. Total cost: $0 within the
free tier for our 180-ticker / weekly-refresh footprint, with ~6-orders-of-magnitude
headroom. If we want to stay purely static, run the same fetches in a weekly GitHub
Action and commit `data/news/<TICKER>.json` / `data/earnings/<TICKER>.json` files.
