import { MarketData } from './types';

// 預設資料
export const INITIAL_DATA: MarketData[] = [
  { date: '12/01', twii: 27342.53, wtx: 27380.00, vix: 14.80, margin: 3193.60, short: 301654 },
  { date: '12/02', twii: 27564.27, wtx: 27600.00, vix: 14.50, margin: 3197.37, short: 305582 },
  { date: '12/03', twii: 27793.04, wtx: 27820.00, vix: 14.20, margin: 3214.25, short: 302856 },
  { date: '12/04', twii: 27795.71, wtx: 27805.00, vix: 14.10, margin: 3228.26, short: 299991 },
  { date: '12/05', twii: 27980.89, wtx: 28020.00, vix: 14.30, margin: 3229.17, short: 303648 },
  { date: '12/08', twii: 28303.78, wtx: 28350.00, vix: 14.60, margin: 3247.39, short: 310486 },
  { date: '12/09', twii: 28182.60, wtx: 28200.00, vix: 14.90, margin: 3268.84, short: 313708 },
  { date: '12/10', twii: 28400.73, wtx: 28450.00, vix: 15.20, margin: 3276.95, short: 303179 },
  { date: '12/11', twii: 28024.75, wtx: 28050.00, vix: 15.80, margin: 3266.72, short: 307829 },
  { date: '12/12', twii: 28198.02, wtx: 28240.00, vix: 15.70, margin: 3293.50, short: 307405 },
  { date: '12/15', twii: 27866.94, wtx: 27910.00, vix: 16.20, margin: 3318.59, short: 304195 },
  { date: '12/16', twii: 27536.66, wtx: 27624.00, vix: 16.50, margin: 3325.10, short: 302500 },
];

export const STOCK_URLS = {
  twii: "https://tw.stock.yahoo.com/quote/%5ETWII",
  wtx: "https://tw.stock.yahoo.com/future/WTX&",
  vix: "https://tw.stock.yahoo.com/quote/%5EVIX",
};

export const CHART_COLORS = {
  twii: "#ffffff",
  wtx: "#a855f7",
  vix: "#22c55e",
  margin: "#f87171",
  short: "#facc15",
  grid: "#1e293b",
  tooltipBg: "#1e293b", // slate-800
};