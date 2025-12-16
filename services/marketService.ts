import { MarketData, LivePrices, ProxyConfig } from '../types';
import { STOCK_URLS } from '../constants';
import { getTodayDateString } from '../utils';

// Define Proxy List
const PROXIES: ProxyConfig[] = [
  {
    url: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    type: 'json' // allorigins returns JSON { contents: "html" }
  },
  {
    url: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    type: 'text' // corsproxy returns raw HTML Text
  }
];

/**
 * Fetches HTML content via a rotation of proxies.
 */
const fetchHtmlViaProxy = async (targetUrl: string): Promise<string> => {
  let lastError: Error | null = null;

  for (const proxy of PROXIES) {
    try {
      const fetchUrl = proxy.url(targetUrl);
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }

      if (proxy.type === 'json') {
         const json = await response.json();
         if (json.contents) return json.contents;
         throw new Error("Empty contents from JSON proxy");
      } else {
         return await response.text();
      }
    } catch (e: any) {
      console.warn(`Proxy attempt failed for ${targetUrl} using ${proxy.type}:`, e);
      lastError = e;
      continue; // Try next proxy
    }
  }
  throw lastError || new Error("All proxies failed");
};

/**
 * Parses Yahoo Finance HTML to extract price.
 * Yahoo uses Atomic CSS, often 'Fz(32px)' for the main price.
 */
const parseYahooPrice = (html: string): number => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  let price = 0;
  // Yahoo price class usually contains Fz(32px)
  const priceElements = doc.querySelectorAll('[class*="Fz(32px)"]');
  for (const el of priceElements) {
    const text = el.textContent?.replace(/,/g, '') || '0';
    const val = parseFloat(text);
    if (!isNaN(val)) {
      price = val;
      break; 
    }
  }
  return price;
};

/**
 * Orchestrates fetching TWII, WTX, and VIX.
 */
export const fetchLiveMarketData = async (setStatusMsg: (msg: string) => void): Promise<LivePrices> => {
  setStatusMsg("正在同步市場數據...");

  const [twiiHtml, wtxHtml, vixHtml] = await Promise.all([
    fetchHtmlViaProxy(STOCK_URLS.twii),
    fetchHtmlViaProxy(STOCK_URLS.wtx),
    fetchHtmlViaProxy(STOCK_URLS.vix)
  ]);

  const twii = parseYahooPrice(twiiHtml);
  const wtx = parseYahooPrice(wtxHtml);
  const vix = parseYahooPrice(vixHtml);

  if (!twii || !wtx) {
    throw new Error("解析價格失敗，網頁結構可能已變更");
  }

  return { twii, wtx, vix };
};

/**
 * Generates a simulated data entry based on the last known data.
 * Used when network requests fail.
 */
export const generateSimulatedData = (lastEntry: MarketData): MarketData => {
  const randomChange = (val: number, rangePercent: number) => {
    // Generate random change between -rangePercent and +rangePercent
    const change = val * (Math.random() * rangePercent * 2 - rangePercent);
    return val + change;
  };

  const newTwii = randomChange(lastEntry.twii, 0.003); // 0.3% volatility
  const newWtx = randomChange(lastEntry.wtx, 0.003);
  const newVix = randomChange(lastEntry.vix, 0.02);

  return {
    date: getTodayDateString(),
    twii: newTwii,
    wtx: newWtx,
    vix: newVix,
    margin: lastEntry.margin, // Margin usually doesn't change intraday
    short: lastEntry.short
  };
};