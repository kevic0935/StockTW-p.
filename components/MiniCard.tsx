import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '../utils';

interface MiniCardProps {
  label: string;
  subLabel?: string;
  val: number;
  diff: number;
  color: string;
  unit?: string;
}

const MiniCard: React.FC<MiniCardProps> = ({ label, subLabel, val, diff, color, unit = '' }) => {
  const isPositive = diff > 0;
  
  return (
    <div className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm">
      <div className="flex justify-between items-start">
        <span className="text-slate-400 text-xs font-medium">{label}</span>
        {subLabel && (
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 border border-slate-700">
            {subLabel}
          </span>
        )}
      </div>
      <div className={`text-xl font-bold mt-2 ${color}`}>
        {formatNumber(val)}<span className="text-xs ml-1 text-slate-500 font-normal">{unit}</span>
      </div>
      <div className={`text-xs mt-1 flex items-center ${isPositive ? 'text-red-400' : 'text-green-400'}`}>
        {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
        {diff > 0 ? '+' : ''}{formatNumber(diff)}
      </div>
    </div>
  );
};

export default MiniCard;