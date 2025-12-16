export interface MarketData {
  date: string;
  twii: number; // 加權指數
  wtx: number;  // 台指期
  vix: number;  // 恐慌指數
  margin: number; // 融資餘額
  short: number; // 融券餘額
}

export interface LivePrices {
  twii: number | null;
  wtx: number | null;
  vix: number | null;
}

export interface ProxyConfig {
  url: (target: string) => string;
  type: 'json' | 'text';
}