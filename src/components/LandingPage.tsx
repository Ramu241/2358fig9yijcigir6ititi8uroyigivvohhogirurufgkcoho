import React from 'react';
import { LandingChart } from './LandingChart';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center text-white px-6 py-12 overflow-hidden bg-[#060d1a]">
      {/* Background Graphic */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-color-dodge transition-opacity duration-1000"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80')" }}
      />
      {/* Dark Ambient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#060d1a]/50 via-[#060d1a]/80 to-[#060d1a] pointer-events-none" />

      {/* Header Info badge */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-[10px] tracking-widest text-cyan-300 font-extrabold uppercase animate-pulse-glow">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        SYSTEM ONLINE
      </div>

      {/* Main branding */}
      <div className="relative z-10 text-center flex flex-col items-center gap-4 mt-8">
        <div className="w-20 h-20 rounded-full border-2 border-cyan-500/40 p-1 flex items-center justify-center bg-slate-950/80 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          <img 
            src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&h=150&q=80" 
            alt="Fusion Server Logo" 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-widest bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent uppercase font-sans">
            GODXGOKU.PREDICTOR
          </h1>
          <div className="h-[2px] w-32 my-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto" />
          <p className="text-[11px] md:text-xs tracking-[0.25em] text-cyan-200/80 uppercase font-medium">
            Quantum Pattern Sync Engine
          </p>
        </div>
      </div>

      {/* Live Chart Visualisation */}
      <div className="relative z-10 w-full max-w-sm mt-4 animate-fade-in">
        <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden shadow-2xl shadow-cyan-950/30">
          <div className="h-44 w-full relative">
            <LandingChart />
          </div>
          <div className="grid grid-cols-3 divide-x divide-cyan-500/10 border-t border-cyan-500/15 py-3 text-center">
            <div>
              <div className="text-[8px] tracking-wider text-slate-400 uppercase mb-0.5">Signal</div>
              <div className="text-xs font-black text-cyan-400 uppercase">ACTIVE</div>
            </div>
            <div>
              <div className="text-[8px] tracking-wider text-slate-400 uppercase mb-0.5">Accuracy</div>
              <div className="text-xs font-black text-cyan-400">99.8%</div>
            </div>
            <div>
              <div className="text-[8px] tracking-wider text-slate-400 uppercase mb-0.5">Latency</div>
              <div className="text-xs font-black text-cyan-400">2ms</div>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-500 italic mt-3 tracking-wide">
          AI-powered pattern analytics with real-time sync
        </p>
      </div>

      {/* Start Button & Copyright */}
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-5 items-center mt-6">
        <button
          onClick={onStart}
          className="w-full py-4 rounded-xl cursor-pointer font-sans text-xs font-black tracking-[0.2em] text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-500 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] active:scale-98 transition-all duration-150 uppercase"
        >
          START PREDICTOR
        </button>
        <div className="text-[8px] text-slate-600 tracking-[0.2em] uppercase font-semibold">
          © 2026 GODXGOKU.PREDICTOR | QUANTUM TECHNOLOGY
        </div>
      </div>
    </div>
  );
};
