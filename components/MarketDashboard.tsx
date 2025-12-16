import React, { useState, useEffect, useRef } from 'react';
import { 
  Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ComposedChart 
} from 'recharts';
import { 
  Zap, MousePointer2, Loader2, Globe, AlertTriangle, RefreshCw 
} from 'lucide-react';

import { MarketData } from '../types';
import { INITIAL_DATA, CHART_COLORS } from '../constants';
import { formatNumber, getTodayDateString } from '../utils';
import { fetchLiveMarketData, generateSimulatedData } from '../services/marketService';
import MiniCard from './MiniCard';
import CustomTooltip from './CustomTooltip';

const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

const MarketDashboard: React.FC = () => {
  const [data, setData] = useState<MarketData[]>(INITIAL_DATA);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleString());
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  const mountedRef = useRef(false);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    handleFetchData();
    return () => { mountedRef.current = false; };
  }, []);

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (!loading && !isSimulated) {
        handleFetchData(true); // silent update
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, loading, isSimulated]);

  // Helper to update state with new entry (replace if today, else push)
  const updateDataState = (newEntry: MarketData) => {
    setData(prevData => {
      const newData = [...prevData];
      const lastIdx = newData.length - 1;
      if (newData[lastIdx].date === newEntry.date) {
        newData[lastIdx] = newEntry;
      } else {
        newData.push(newEntry);
      }
      return newData;
    });
    setLastUpdated(new Date().toLocaleString());
  };

  // Switch to simulation mode
  const switchToSimulation = () => {
    if (!mountedRef.current) return;
    console.warn("Switching to simulation mode due to network error.");
    setStatusMsg("網路受限，顯示模擬數據");
    setIsSimulated(true);
    
    const lastEntry = data[data.length - 1];
    const newEntry = generateSimulatedData(lastEntry);
    
    updateDataState(newEntry);
    // Keep showing simulation updates if in sim mode
    // We will clear the msg after 3s
    setTimeout(() => {
      if(mountedRef.current) setStatusMsg("");
    }, 3000);
  };

  // Main fetch handler
  const handleFetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setIsSimulated(false);
    if (!silent) setStatusMsg("正在連接 Proxy 伺服器...");

    try {
      const liveData = await fetchLiveMarketData(silent ? () => {} : setStatusMsg);
      if (!silent) setStatusMsg("數據整合中...");

      const todayStr = getTodayDateString();
      const lastEntry = data[data.length - 1];

      // Merge live prices with last known margin/short data
      // If liveData returns 0 or null, fallback to last known to avoid graph drop to 0
      const newEntry: MarketData = {
        date: todayStr,
        twii: liveData.twii || lastEntry.twii,
        wtx: liveData.wtx || lastEntry.wtx,
        vix: liveData.vix || lastEntry.vix,
        margin: lastEntry.margin,
        short: lastEntry.short
      };

      if (mountedRef.current) {
        updateDataState(newEntry);
        setIsSimulated(false); // Recovery successful
        if (!silent) {
          setStatusMsg("更新成功！");
          setTimeout(() => { if(mountedRef.current) setStatusMsg(""); }, 3000);
        }
      }

    } catch (error) {
      console.error("Fetch failed:", error);
      if (!silent) switchToSimulation();
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const latestData = data[data.length - 1];
  const previousData = data.length > 1 ? data[data.length - 2] : latestData;
  const latestSpread = latestData.wtx - latestData.twii;

  return (
    <div className="p-4 md:p-6 font-sans max-w-7xl mx-auto pb-20">
      
      {/* 標題區 */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="text-yellow-400 fill-yellow-400" />
            StockTW p. <span className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full border border-blue-700">Frontend Mode</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">期現貨價差 vs 籌碼多空動能 (Proxy 抓取版)</p>
        </div>
        <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
          <div className="flex items-center gap-3">
             {statusMsg && (
                <span className={`text-xs animate-pulse font-bold flex items-center ${isSimulated ? 'text-orange-400' : 'text-green-400'}`}>
                  {isSimulated && <AlertTriangle size={12} className="mr-1" />}
                  {statusMsg}
                </span>
             )}
             <span className="text-xs text-slate-500 font-mono hidden md:inline">
               更新於: {lastUpdated}
             </span>
             <button 
               onClick={() => handleFetchData(false)}
               disabled={loading}
               className={`p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition text-blue-400 flex items-center justify-center border border-slate-700 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50'}`}
               title="透過 Proxy 抓取最新數據"
             >
               {loading ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
             </button>
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setAutoRefresh(!autoRefresh)}
               className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-full border ${autoRefresh ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
             >
               <RefreshCw size={10} className={autoRefresh ? "animate-spin" : ""} style={{ animationDuration: '3s' }}/>
               {autoRefresh ? '自動更新中 (60s)' : '自動更新暫停'}
             </button>
          </div>
        </div>
      </header>

      {/* 數據卡片區 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MiniCard 
          label="加權指數" 
          val={latestData.twii} 
          diff={latestData.twii - previousData.twii} 
          color="text-white" 
          subLabel="現貨"
        />
        <MiniCard 
          label="台指期貨" 
          val={latestData.wtx} 
          diff={latestData.wtx - previousData.wtx} 
          color="text-purple-400" 
          subLabel={`價差 ${latestSpread > 0 ? '+' : ''}${formatNumber(latestSpread)}`}
        />
        <MiniCard 
          label="融資餘額" 
          val={latestData.margin} 
          unit="億" 
          diff={latestData.margin - previousData.margin} 
          color="text-red-400" 
          subLabel="散戶動能"
        />
        <MiniCard 
          label="VIX 恐慌" 
          val={latestData.vix} 
          diff={latestData.vix - previousData.vix} 
          color="text-green-400" 
          subLabel="避險情緒"
        />
      </div>

      {/* 主要圖表區 */}
      <div className="flex flex-col gap-4">
        
        {/* 上層：價格與 VIX */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 shadow-lg relative overflow-hidden group">
          <div className="absolute top-4 left-4 z-10 flex gap-4 text-xs font-bold pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
            <span className="text-slate-100 flex items-center gap-1"><div className="w-2 h-2 bg-white rounded-full shadow-[0_0_4px_white]"></div> 加權指數</span>
            <span className="text-purple-400 flex items-center gap-1"><div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_4px_#a855f7]"></div> 台指期</span>
            <span className="text-green-500 flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_4px_#22c55e]"></div> VIX (右軸)</span>
          </div>
          
          <div className="h-[320px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} syncId="marketSync" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVix" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.vix} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={CHART_COLORS.vix} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} opacity={0.5} />
                <XAxis dataKey="date" hide />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                <YAxis yAxisId="left" stroke="#94a3b8" tick={{fontSize: 11, fill: '#64748b'}} domain={['auto', 'auto']} tickFormatter={(val)=>val.toLocaleString()} />
                <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.vix} domain={[10, 25]} tick={{fontSize: 11, fill: '#22c55e'}} tickFormatter={(val)=>val.toFixed(2)} />

                <Area yAxisId="right" type="monotone" dataKey="vix" name="VIX" stroke={CHART_COLORS.vix} fill="url(#colorVix)" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="twii" name="加權指數" stroke={CHART_COLORS.twii} strokeWidth={2} dot={false} activeDot={{r:5, strokeWidth: 0}} />
                <Line yAxisId="left" type="monotone" dataKey="wtx" name="台指期" stroke={CHART_COLORS.wtx} strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 下層：籌碼面 */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 shadow-lg relative overflow-hidden group">
           <div className="absolute top-4 left-4 z-10 flex gap-4 text-xs font-bold pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
            <span className="text-red-400 flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_4px_#f87171]"></div> 融資 (左軸)</span>
            <span className="text-yellow-400 flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_4px_#facc15]"></div> 融券 (右軸)</span>
          </div>

          <div className="h-[200px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} syncId="marketSync" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} opacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 11, fill: '#64748b'}} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />

                <YAxis yAxisId="margin" stroke={CHART_COLORS.margin} domain={['auto', 'auto']} tick={{fontSize: 11, fill: '#f87171'}} width={50} tickFormatter={(val)=>val.toFixed(2)} />
                <YAxis yAxisId="short" orientation="right" stroke={CHART_COLORS.short} domain={['auto', 'auto']} tick={{fontSize: 11, fill: '#facc15'}} width={50} />

                <Line yAxisId="margin" type="monotone" dataKey="margin" name="融資" stroke={CHART_COLORS.margin} strokeWidth={2} dot={{r:2}} activeDot={{r:5}} />
                <Line yAxisId="short" type="monotone" dataKey="short" name="融券" stroke={CHART_COLORS.short} strokeWidth={2} dot={{r:2}} activeDot={{r:5}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-600">
            <MousePointer2 size={10} />
            <span>滑鼠在任一圖表移動可同步查看上下數據</span>
          </div>
        </div>

      </div>

      <footer className="mt-12 pt-8 border-t border-slate-800 text-slate-500 text-xs leading-relaxed">
        <h4 className="text-sm font-bold text-slate-400 mb-4 pb-2 border-b border-slate-800 inline-block">
          【免責聲明與使用條款】
        </h4>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          <div>
            <span className="font-semibold text-slate-400 block mb-1">1. 關於網站定位與內容</span>
            本網站致力於金融數據的學術研究與整理分享。所有提供的分析文章、數據圖表及篩選結果，皆僅供教育參考與個人研究使用，並不旨在提供任何投資建議、買賣指令或業務招攬。我們希望透過資訊的透明化，協助使用者進行更有效率的研究。
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">2. 投資風險與獨立判斷</span>
            金融市場變幻莫測，過去的數據表現不代表未來的績效。本網站內容並未考量您的個別財務狀況、風險承受能力或投資目標。在做出任何投資決策前，請務必審慎評估並獨立思考，或諮詢專業的財務顧問。您應充分了解，依據本網站資訊進行的任何投資行為，其損益與風險均由您自行承擔。
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">3. 資料準確性與系統限制</span>
            我們採用自動化程式與網路公開資訊來構建數據庫，雖力求資訊精確與即時，但受限於資料來源本身或技術傳輸過程，我們無法保證所有內容均為 100% 正確、完整或無延遲。對於因數據缺漏、錯誤或系統中斷而可能產生的困擾，我們深感抱歉，但無法對此承擔法律責任。
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">4. 第三方連結說明</span>
            本網站可能包含通往其他網站或媒體的連結，這些內容不由我們控制。引用這些資訊是為了方便您的研究，並不代表我們認同其觀點或能對其真實性負責。
          </div>
        </div>
        <div className="mt-8 text-center text-[10px] opacity-30 uppercase tracking-widest font-mono">
          © 2025 StockTW p. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MarketDashboard;