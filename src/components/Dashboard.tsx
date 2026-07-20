import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, History, BarChart3, Settings, Menu, X, LogOut, 
  Clock, ShieldCheck, Zap, Send, Sparkles, TrendingUp
} from 'lucide-react';
import { Game, PredictionItem, PredictionMode, ThemeId, TimeFrame } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { getHistoricalRecords, fetchRealTimeDraws, getHistoricalRecordsFromDraws } from '../utils/predictor';

interface DashboardProps {
  username: string;
  onLogout: () => void;
  onSelectGame: (game: Game, mode: PredictionMode, timeFrame: TimeFrame) => void;
  currentTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  historicalRecords: PredictionItem[];
  setHistoricalRecords: React.Dispatch<React.SetStateAction<PredictionItem[]>>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  username,
  onLogout,
  onSelectGame,
  currentTheme,
  onThemeChange,
  historicalRecords,
  setHistoricalRecords,
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'history' | 'analytics' | 'settings'>('games');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deviceId, setDeviceId] = useState('FS-XXXX-XXXX');
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedGameForModal, setSelectedGameForModal] = useState<Game | null>(null);
  const [selectedModeForModal, setSelectedModeForModal] = useState<PredictionMode>('size');

  // Load Device ID on start
  useEffect(() => {
    const id = localStorage.getItem('fusion_device_id') || 'FS-8A92-C3B1';
    setDeviceId(id);
  }, []);

  // Sync historical records from live API draws
  useEffect(() => {
    const syncDraws = async () => {
      try {
        const { list } = await fetchRealTimeDraws('1m');
        if (list && list.length > 0) {
          const records = getHistoricalRecordsFromDraws(list, 'size');
          setHistoricalRecords(records);
        } else {
          setHistoricalRecords(getHistoricalRecords('1m', 30));
        }
      } catch (err) {
        console.error('Error syncing real-time draws on dashboard:', err);
        setHistoricalRecords(getHistoricalRecords('1m', 30));
      }
    };

    if (historicalRecords.length === 0) {
      syncDraws();
    }
  }, [historicalRecords.length, setHistoricalRecords]);

  // Compute analytics numbers
  const totalWins = historicalRecords.filter(r => r.status === 'WIN').length;
  const totalLosses = historicalRecords.filter(r => r.status === 'LOSS').length;
  const totalSkips = historicalRecords.filter(r => r.status === 'SKIP').length;
  const totalResults = totalWins + totalLosses;
  const accuracyRate = totalResults > 0 ? Math.round((totalWins / totalResults) * 100) : 0;

  // Premium game configurations with the explicit user links mapped!
  const premiumGames: Game[] = [
    {
      id: 'bdgwin',
      name: 'BDG WIN',
      url: 'https://bdgwinmy.cc/#/register?invitationCode=8261315097340',
      logo: 'https://iili.io/BbtJoZP.jpg',
      tag: 'Neural Socket Feed'
    },
    {
      id: 'goagame',
      name: 'GOA GAME',
      url: 'https://www.goaok.vip/#/register?invitationCode=527889149005',
      logo: 'https://iili.io/Bbt2qhB.jpg',
      tag: 'Quantum Multi-Layer Fix'
    }
  ];

  const handleGameModeClick = (game: Game, mode: PredictionMode) => {
    setSelectedGameForModal(game);
    setSelectedModeForModal(mode);
    setTimeModalOpen(true);
  };

  const handleSelectTimeFrame = (timeFrame: TimeFrame) => {
    if (selectedGameForModal) {
      onSelectGame(selectedGameForModal, selectedModeForModal, timeFrame);
    }
    setTimeModalOpen(false);
  };

  const navItems = [
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#060d1a] text-white">
      {/* Background Graphic elements */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full filter blur-[100px] pointer-events-none" style={{ backgroundColor: 'var(--primary)', opacity: 0.04 }} />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ backgroundColor: 'var(--primary)', opacity: 0.03 }} />

      {/* Primary Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3.5 bg-[#080f1d]/90 backdrop-blur-md border-b border-theme-primary-15">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-theme-primary-25 p-0.5 flex items-center justify-center bg-slate-950">
            <img 
              src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&h=150&q=80" 
              alt="Logo" 
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="text-xs font-black tracking-widest text-white uppercase">
              GODXGOKU.PREDICTOR
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-primary animate-pulse" style={{ backgroundColor: 'var(--primary)' }} />
              <span className="text-[8px] font-bold tracking-wider text-theme-primary uppercase text-theme-primary-glow">
                Active Nodes Ready
              </span>
            </div>
          </div>
        </div>

        {/* Hamburger Menu icon */}
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 active:scale-95 cursor-pointer"
        >
          <Menu className="w-4 h-4 text-theme-primary" style={{ color: 'var(--primary)' }} />
        </button>
      </header>

      {/* Sub Navigation Bar */}
      <nav className="flex items-center gap-1.5 px-4 py-2.5 bg-[#080f1d]/60 border-b border-slate-900 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-extrabold tracking-widest uppercase transition-all duration-300 cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'text-theme-primary bg-theme-primary-10 border border-theme-primary-25 shadow-theme-glow' 
                  : 'text-slate-500 border border-transparent hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 flex flex-col gap-4 max-w-md w-full mx-auto pb-12 overflow-y-auto">
        
        {/* ================= GAMES TAB ================= */}
        {activeTab === 'games' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {premiumGames.map((game) => (
              <div 
                key={game.id} 
                className="p-4 rounded-xl bg-slate-900/60 border border-theme-primary-15 backdrop-blur-sm flex flex-col gap-3 shadow-lg shadow-black/40 hover:border-theme-primary-35 transition-all duration-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl border border-theme-primary-25 overflow-hidden bg-slate-950 flex-shrink-0">
                    <img 
                      src={game.logo} 
                      alt={game.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback placeholder image if URL fails
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&h=150&q=80';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-white tracking-widest uppercase">
                      {game.name}
                    </h3>
                    <p className="text-[9px] font-extrabold tracking-wider text-theme-primary uppercase mt-0.5">
                      {game.tag}
                    </p>
                  </div>
                </div>
                
                {/* Mode Select Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handleGameModeClick(game, 'size')}
                    className="py-3.5 rounded-lg border border-theme-primary-25 bg-theme-primary-10 hover:bg-theme-primary-20 text-[10px] font-extrabold tracking-widest text-theme-primary uppercase shadow-md active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    style={{ textShadow: '0 0 8px var(--glow)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    BIG / SMALL
                  </button>
                  <button
                    onClick={() => handleGameModeClick(game, 'number')}
                    className="py-3.5 rounded-lg border border-theme-primary-25 bg-theme-primary-10 hover:bg-theme-primary-20 text-[10px] font-extrabold tracking-widest text-theme-primary uppercase shadow-md active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    style={{ textShadow: '0 0 8px var(--glow)' }}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    NUMBER FIX
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= HISTORY TAB ================= */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-white uppercase mb-3">
                <History className="w-4 h-4 text-cyan-400" />
                Live Sync Prediction History
              </div>
              
              <div className="flex flex-col gap-2.5">
                {historicalRecords.map((item, idx) => {
                  let statusColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                  let statusText = 'Pending';
                  
                  if (item.status === 'WIN') {
                    statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    statusText = 'WIN';
                  } else if (item.status === 'LOSS') {
                    statusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
                    statusText = 'LOSS';
                  } else if (item.status === 'SKIP') {
                    statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                    statusText = 'SKIP';
                  }

                  return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border-l-[3.5px] border-y border-r border-slate-900/60 transition-all`}
                      style={{ borderLeftColor: item.status === 'WIN' ? '#10b981' : item.status === 'LOSS' ? '#ef4444' : item.status === 'SKIP' ? '#f59e0b' : '#06b6d4' }}
                    >
                      <div>
                        <div className="text-[10px] font-bold text-white tracking-widest uppercase">
                          PERIOD {item.formattedPeriod}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-400 mt-1">
                          Prediction: <span className="text-white font-black uppercase">{item.prediction}</span> 
                          {item.number !== '⚠' && (
                            <> | Num: <span className="text-cyan-300 font-bold">{item.number}</span></>
                          )}
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 text-[8px] font-black tracking-widest uppercase rounded border ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= ANALYTICS TAB ================= */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <div className="text-[26px] font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                  {totalWins}
                </div>
                <div className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mt-1">
                  Total Wins
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <div className="text-[26px] font-black text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                  {totalLosses}
                </div>
                <div className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mt-1">
                  Total Losses
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <div className="text-[26px] font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                  {accuracyRate}%
                </div>
                <div className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mt-1">
                  AI Accuracy
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
                <div className="text-[26px] font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                  {historicalRecords.length}
                </div>
                <div className="text-[8px] font-bold tracking-widest text-slate-500 uppercase mt-1">
                  Synced Outcomes
                </div>
              </div>
            </div>

            {/* Pattern Load Analyzer Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xs font-black tracking-widest text-white uppercase mb-4 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                Neural Pattern Distribution
              </div>
              
              <div className="flex flex-col gap-3">
                {/* BIG prediction weighting */}
                <div>
                  <div className="flex justify-between items-center text-[9px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                    <span>BIG Trend Pressure</span>
                    <span className="text-cyan-400">76.4%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" style={{ width: '76.4%' }} />
                  </div>
                </div>

                {/* SMALL prediction weighting */}
                <div>
                  <div className="flex justify-between items-center text-[9px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                    <span>SMALL Trend Pressure</span>
                    <span className="text-indigo-400">82.1%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: '82.1%' }} />
                  </div>
                </div>

                {/* Accuracy Sync */}
                <div>
                  <div className="flex justify-between items-center text-[9px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                    <span>Neural Sync Integrity</span>
                    <span className="text-emerald-400">99.8%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: '99.8%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* System Details Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xs font-black tracking-widest text-white uppercase mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                SYSTEM & USER DETAILS
              </div>
              
              <div className="flex flex-col gap-3.5 divide-y divide-slate-800/40">
                <div className="flex items-center justify-between text-xs pt-0">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Operator</span>
                  <span className="font-mono text-cyan-400 uppercase font-extrabold tracking-widest">{username}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-3">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Hardware ID</span>
                  <span className="font-mono text-white tracking-widest">{deviceId}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-3">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">License Status</span>
                  <span className="font-bold text-emerald-400 uppercase tracking-widest">ACTIVE (LIFETIME)</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-3">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Neural Feed Connection</span>
                  <span className="font-bold text-cyan-400 uppercase tracking-widest">12ms (ONLINE)</span>
                </div>
              </div>
            </div>

            {/* Custom Theme Switcher Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xs font-black tracking-widest text-white uppercase mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                THEME CUSTOMIZATION
              </div>
              <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />
            </div>

            {/* Support/Owner Channels */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2.5">
              <div className="text-xs font-black tracking-widest text-white uppercase mb-1">
                SUPPORT & UPDATES
              </div>
              
              <a 
                href="https://t.me/+WPzBxK25EXZjMTY1" 
                target="_blank" 
                rel="noreferrer"
                className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-950/20 active:scale-97 transition-all flex items-center justify-between text-xs text-cyan-400 font-extrabold tracking-wider uppercase decoration-transparent"
              >
                <span className="flex items-center gap-1.5">
                  <Send className="w-4 h-4 fill-cyan-400/20" />
                  Telegram Channel
                </span>
                <span>Join Channel</span>
              </a>
              <a 
                href="https://t.me/+WPzBxK25EXZjMTY1" 
                target="_blank" 
                rel="noreferrer"
                className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-950/20 active:scale-97 transition-all flex items-center justify-between text-xs text-cyan-400 font-extrabold tracking-wider uppercase decoration-transparent"
              >
                <span className="flex items-center gap-1.5">
                  <Send className="w-4 h-4 fill-cyan-400/20" />
                  Support Desk
                </span>
                <span>Contact Owner</span>
              </a>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="w-full py-4 mt-1 rounded-xl cursor-pointer font-sans text-xs font-black tracking-[0.2em] text-red-400 border border-red-500/25 bg-red-950/10 hover:bg-red-950/20 active:scale-98 transition-all duration-150 uppercase flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              TERMINATE SESSION
            </button>
          </div>
        )}
      </main>

      {/* ================= SIDEBAR SLIDE-DRAWER ================= */}
      {sidebarOpen && (
        <>
          {/* Blur Overlay */}
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          />
          {/* Slide container */}
          <div className="fixed top-0 right-0 bottom-0 w-72 z-50 bg-[#080f1d] border-l border-cyan-500/20 flex flex-col shadow-2xl transition-transform duration-300 transform translate-x-0 animate-slide-in">
            <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-black tracking-widest text-white uppercase">
                  GODXGOKU.PREDICTOR
                </div>
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Control Drawer
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 active:scale-90 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6">
              {/* Quick Profile */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col gap-1">
                <div className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">Operator</div>
                <div className="text-xs font-black text-cyan-400 uppercase tracking-widest">{username}</div>
                <div className="text-[8px] font-bold text-slate-600 font-mono tracking-widest mt-2">Hardware: {deviceId}</div>
              </div>

              {/* Navigation Shortcuts */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-1">NAV SHORTCUTS</div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[10px] font-bold tracking-widest uppercase text-left border cursor-pointer transition-all ${
                        isActive 
                          ? 'text-cyan-300 bg-cyan-500/5 border-cyan-500/20 shadow-md' 
                          : 'text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Theme Mini-Grid */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-1">Quick Themes</div>
                <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-cyan-500/10 bg-slate-950/30">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  onLogout();
                }}
                className="w-full py-3 rounded-lg border border-red-500/25 bg-red-950/10 text-[10px] font-black tracking-widest text-red-400 uppercase flex items-center justify-center gap-1.5 cursor-pointer hover:bg-red-950/20 active:scale-97 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                TERMINATE SESSION
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= TIME FRAME SELECTOR MODAL ================= */}
      {timeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-center items-center p-4">
          <div 
            onClick={() => setTimeModalOpen(false)}
            className="absolute inset-0 z-0"
          />
          <div className="relative z-10 w-full max-w-xs p-6 rounded-2xl border border-cyan-500/30 bg-slate-900/95 shadow-[0_0_50px_rgba(34,211,238,0.15)] text-center animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400 animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            
            <h3 className="text-sm font-black text-white tracking-widest uppercase mb-1">
              Select Sync Interval
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-6 uppercase tracking-wider font-medium">
              Synchronize AI prediction pattern matrices for the preferred game period.
            </p>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleSelectTimeFrame('30s')}
                className="w-full py-3.5 rounded-xl cursor-pointer bg-gradient-to-r from-cyan-400 to-sky-500 text-xs font-black tracking-widest text-slate-950 uppercase shadow-[0_4px_15px_rgba(34,211,238,0.3)] active:scale-97 transition-all duration-100"
              >
                30 Seconds Period
              </button>
              <button
                onClick={() => handleSelectTimeFrame('1m')}
                className="w-full py-3.5 rounded-xl cursor-pointer border border-cyan-500/35 bg-transparent text-xs font-black tracking-widest text-cyan-300 uppercase hover:bg-cyan-500/5 active:scale-97 transition-all duration-100"
              >
                1 Minute Period
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
