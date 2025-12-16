import React from 'react';
import { TooltipProps } from 'recharts';
import { formatNumber } from '../utils';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const currentData = payload[0].payload;
    const spread = currentData.wtx - currentData.twii;
    
    return (
      <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-xl text-slate-200 text-sm z-50 bg-opacity-95 backdrop-blur-sm">
        <p className="font-bold border-b border-slate-600 pb-2 mb-2 text-slate-100 flex justify-between gap-6">
          <span>{label}</span>
          <span className={`text-xs font-normal flex items-center ${spread >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            價差: {spread > 0 ? '+' : ''}{formatNumber(spread)}
          </span>
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-[0_0_4px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
              <span className="text-slate-400 text-xs">{entry.name}:</span>
            </div>
            <span className="font-mono font-bold text-slate-100 text-xs">
              {entry.name === '融券' ? entry.value?.toLocaleString() : formatNumber(entry.value as number)}
              {entry.name === '融資' && ' 億'}
              {entry.name === '融券' && ' 張'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;