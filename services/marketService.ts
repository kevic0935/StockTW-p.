import { MarketData, LivePrices, ProxyConfig } from '../types';
import { STOCK_URLS } from '../constants';
import { getTodayDateString } from '../utils';

// Define Proxy List with random rotation support
const PROXIES: ProxyConfig[] = [
  {
    url: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}&disableCache=true`,
    type: 'json' 
  },
  {
    url: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    type: 'text' 
  },
  {
    url: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    type: 'text'
  }
];

// Helper for fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 8000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

/**
 * Fetches HTML content via a rotation of proxies.
 * Tries all proxies in sequence until one works.
 */
const fetchHtmlViaProxy = async (targetUrl: string): Promise<string> => {
  let lastError: Error | null = null;
  
  // Shuffle proxies slightly to distribute load, but keep allorigins first as it's often most reliable for JSON
  const currentProxies = [...PROXIES]; 

  for (const proxy of currentProxies) {
    try {
      const fetchUrl = proxy.url(targetUrl);
      const response = await fetchWithTimeout(fetchUrl);
      
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
      // Small delay before next proxy
      await new Promise(r => setTimeout(r, 500));
      continue; 
    }
  }
  throw lastError || new Error("All proxies failed");
};

/**
 * Parses Yahoo Finance HTML to extract price.
 * Tries multiple selector strategies.
 */
const parseYahooPrice = (html: string): number => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  let price = 0;
  
  // Strategy 1: The standard Fz(32px) class (Desktop)
  const mainPriceEl = doc.querySelector('[class*="Fz(32px)"]');
  
  // Strategy 2: The mobile/reactive Fz(xx) classes often used for main price
  const backupPriceEl = doc.querySelector('[data-test="qsp-price"], [class*="Fz(32px)"], [class*="Fz(30px)"], [class*="Fz(24px)"]');

  const el = mainPriceEl || backupPriceEl;
  
  if (el) {
    const text = el.textContent?.replace(/,/g, '') || '0';
    const val = parseFloat(text);
    if (!isNaN(val)) {
      price = val;
    }
  }

  // Fallback: search for meta tags
  if (price === 0) {
     const metaPrice = doc.querySelector('meta[itemprop="price"]');
     if (metaPrice) {
       const val = parseFloat(metaPrice.getAttribute('content') || '0');
       if (!isNaN(val)) price = val;
     }
  }

  return price;
};

/**
 * Orchestrates fetching TWII, WTX, and VIX.
 */
export const fetchLiveMarketData = async (setStatusMsg: (msg: string) => void): Promise<LivePrices> => {
  setStatusMsg("正在同步市場數據...");

  // Fetch concurrently
  const results = await Promise.allSettled([
    fetchHtmlViaProxy(STOCK_URLS.twii),
    fetchHtmlViaProxy(STOCK_URLS.wtx),
    fetchHtmlViaProxy(STOCK_URLS.vix)
  ]);

  const getResult = (index: number) => {
    if (results[index].status === 'fulfilled') {
      return (results[index] as PromiseFulfilledResult<string>).value;
    }
    return "";
  };

  const twiiHtml = getResult(0);
  const wtxHtml = getResult(1);
  const vixHtml = getResult(2);

  const twii = twiiHtml ? parseYahooPrice(twiiHtml) : 0;
  const wtx = wtxHtml ? parseYahooPrice(wtxHtml) : 0;
  const vix = vixHtml ? parseYahooPrice(vixHtml) : 0;

  // Strict check: We need at least TWII or WTX to consider this a success
  if (twii === 0 && wtx === 0) {
    throw new Error("無法解析主要指數價格");
  }

  return { 
    twii: twii || null, 
    wtx: wtx || null, 
    vix: vix || null 
  };
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

  // Add more realistic volatility
  const newTwii = randomChange(lastEntry.twii, 0.0015); 
  const newWtx = randomChange(lastEntry.wtx, 0.0015);
  const newVix = randomChange(lastEntry.vix, 0.01);

  return {
    date: getTodayDateString(),
    twii: newTwii,
    wtx: newWtx,
    vix: newVix,
    margin: lastEntry.margin,
    short: lastEntry.short
  };
};