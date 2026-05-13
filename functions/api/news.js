// Cloudflare Pages Function: /api/news?t=<TICKER>
// Proxies Google News RSS (which doesn't send CORS headers) and parses
// it server-side, returning a small JSON payload to the viewer.
//
// Free tier: 100k req/day; KV cache used to avoid hammering Google for
// the same ticker repeatedly (15-minute TTL).

const RSS_BASE = "https://news.google.com/rss/search";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const ticker = (url.searchParams.get("t") || "").trim().toUpperCase();
  if (!/^[A-Z.\-]{1,8}$/.test(ticker)) {
    return json({ error: "?t=<TICKER> required (1-8 letters)" }, 400);
  }

  // Hit Google News RSS — query is "<TICKER> stock" to bias toward finance content
  const q = `${ticker} stock`;
  const rssUrl = `${RSS_BASE}?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  let xml;
  try {
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "ai-supply-chain/1.0 (+https://github.com/michaltalaga/ai-supply-chain)" },
      cf: { cacheTtl: 900, cacheEverything: true }
    });
    if (!res.ok) return json({ ticker, items: [], error: `upstream ${res.status}` }, 502);
    xml = await res.text();
  } catch (e) {
    return json({ ticker, items: [], error: String(e) }, 502);
  }

  // Lightweight RSS parser — no DOMParser in Workers, regex-based.
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null && items.length < 10) {
    const b = m[1];
    items.push({
      title: pickTag(b, "title"),
      link: pickTag(b, "link"),
      pubDate: pickTag(b, "pubDate"),
      source: pickTag(b, "source"),
    });
  }

  return json({ ticker, items, fetched_at: new Date().toISOString() }, 200, {
    "Cache-Control": "public, max-age=900",
  });
}

function pickTag(block, tag) {
  // Try CDATA first, then plain
  const cd = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`).exec(block);
  if (cd) return cd[1].trim();
  const pt = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(block);
  return pt ? pt[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim() : "";
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders,
    },
  });
}
