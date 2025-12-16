import React from 'react';
import MarketDashboard from './components/MarketDashboard';

const App: React.FC = () => {
  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-slate-950 text-slate-200">
      <MarketDashboard />
    </div>
  );
};

export default App;