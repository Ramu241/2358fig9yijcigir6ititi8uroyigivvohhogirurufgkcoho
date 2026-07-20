import React, { useState, useEffect, useRef } from 'react';
import { Game, PredictionItem, PredictionMode, TimeFrame } from '../types';
import { getCurrentPeriod, getPredictionForPeriod, formatPeriodMasked, fetchRealTimeDraws } from '../utils/predictor';
import { Eye, EyeOff, LogOut, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

const IMG_SMALL = 'https://image2url.com/r2/default/images/1770189526625-c1b6c510-cf81-4589-a305-86430a66146a.png';
const IMG_BIG = 'https://image2url.com/r2/default/images/1770190123131-24e81887-a75f-4cd8-aa8f-de3b3e9b4468.png';

const NUM_IMAGES: Record<number | string, string> = {
  0: 'https://iili.io/Bm1hiXV.jpg',
  1: 'https://iili.io/Bm1wZHg.jpg',
  2: 'https://iili.io/Bm1NOsp.jpg',
  3: 'https://iili.io/Bm1NQB2.jpg',
  4: 'https://iili.io/Bm1O0TG.jpg',
  5: 'https://iili.io/Bm1eqMl.jpg',
  6: 'https://iili.io/Bm1eXov.jpg',
  7: 'https://iili.io/Bm1kW79.jpg',
  8: 'https://iili.io/Bm18qMv.jpg',
  9: 'https://iili.io/Bm18tRt.jpg'
};

const getRecommendedNumbers = (periodStr: string, isSmall: boolean) => {
  if (!periodStr) return isSmall ? [1, 2] : [7, 8];
  let sum = 0;
  for (let i = 0; i < periodStr.length; i++) {
    sum += periodStr.charCodeAt(i);
  }
  const pool = isSmall ? [1, 2, 3, 4] : [6, 7, 8, 9];
  const idx1 = sum % pool.length;
  const idx2 = (sum + 2) % pool.length;
  const n1 = pool[idx1];
  const n2 = pool[idx2];
  if (n1 === n2) {
    return [n1, pool[(idx1 + 1) % pool.length]].sort();
  }
  return [n1, n2].sort();
};

interface GameViewProps {
  game: Game;
  mode: PredictionMode;
  timeFrame: TimeFrame;
  onExit: () => void;
  onAddHistoryItem: (item: PredictionItem) => void;
  onUpdateDraws: (drawsList: any[]) => void;
}

export const GameView: React.FC<GameViewProps> = ({
  game,
  mode,
  timeFrame,
  onExit,
  onAddHistoryItem,
  onUpdateDraws,
}) => {
  const [period, setPeriod] = useState('SYNCING...');
  const [secondsLeft, setSecondsLeft] = useState(0);
  
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Current prediction state
  const [prediction, setPrediction] = useState<'BIG' | 'SMALL' | 'SKIP'>('SKIP');
  const [predictedNumber, setPredictedNumber] = useState<string | number>('⚠');
  const [confidence, setConfidence] = useState(90);
  const [skip, setSkip] = useState(true);
  const [patternName, setPatternName] = useState('Algorithm Wave Sync');

  // Floating bubble position state
  const [bubblePos, setBubblePos] = useState({ x: 20, y: 150 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 20, y: 150 });

  // Manage period and predictions loop
  useEffect(() => {
    let lastProcessedPeriod = '';
    let isFetching = false;

    const syncWithApi = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const { list, currentPeriod: currPeriod, secondsLeft: secLeft } = await fetchRealTimeDraws(timeFrame);
        if (currPeriod) {
          setPeriod(currPeriod);
          setSecondsLeft(secLeft);

          // Update outcomes of any pending predictions using the real list of draws!
          if (list && list.length > 0) {
            onUpdateDraws(list);
          }

          // Trigger prediction calculation for the upcoming period
          if (currPeriod !== lastProcessedPeriod) {
            lastProcessedPeriod = currPeriod;
            setIsAnalyzing(true);

            setTimeout(() => {
              setIsAnalyzing(false);
              const result = getPredictionForPeriod(currPeriod, mode, list);
              
              setPrediction(result.prediction);
              setPredictedNumber(result.number);
              setConfidence(result.confidence);
              setSkip(result.skip);
              if (result.patternName) {
                setPatternName(result.patternName);
              }

              // Build a history prediction item to feed back to dashboard stats
              const historyItem: PredictionItem = {
                fullPeriod: currPeriod,
                formattedPeriod: formatPeriodMasked(currPeriod),
                prediction: result.skip ? 'SKIP' : result.prediction,
                number: result.skip ? '⚠' : result.number,
                status: 'Pending',
                skip: result.skip,
                timestamp: Date.now(),
              };
              onAddHistoryItem(historyItem);
            }, 2200);
          }
        }
      } catch (err) {
        console.error('Failed to sync predictions with real-world draw API:', err);
      } finally {
        isFetching = false;
      }
    };

    // Initial load sync
    syncWithApi();

    // 1-second interval ticking for responsive countdown on UI
    const timerId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Poll immediately on zero or rollover
          syncWithApi();
          return timeFrame === '1m' ? 59 : 29;
        }
        // Show analyzer line in last 3 seconds
        if (prev <= 4) {
          setIsAnalyzing(true);
        } else {
          setIsAnalyzing(false);
        }
        return prev - 1;
      });
    }, 1000);

    // Stay robustly synchronized with Wingo servers by periodic pulling every 5 seconds
    const syncId = setInterval(syncWithApi, 5000);

    return () => {
      clearInterval(timerId);
      clearInterval(syncId);
    };
  }, [timeFrame, mode, onAddHistoryItem, onUpdateDraws]);

  // Pointer drag event handlers for floating bubble widget
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If user clicked the button or inner controls, ignore drag
    if ((e.target as HTMLElement).closest('button')) return;
    
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastPosRef.current = { ...bubblePos };
    
    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    // Bounds boundaries check to keep inside screen
    const newX = Math.max(10, Math.min(window.innerWidth - 75, lastPosRef.current.x + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 75, lastPosRef.current.y + deltaY));
    
    setBubblePos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    const element = e.currentTarget;
    element.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative w-screen h-screen bg-[#030712] overflow-hidden select-none">
      
      {/* Full-Screen Embedded Game Iframe */}
      <iframe
        id="game-iframe"
        src={game.url}
        title={game.name}
        className="w-full h-full border-none select-text"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        referrerPolicy="no-referrer"
      />

      {/* ================= DRAGGABLE FLOATING BUBBLE ================= */}
       {!isPanelOpen && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="fixed z-[2500] w-14 h-14 rounded-full flex items-center justify-center cursor-move shadow-theme-glow border-2 border-theme-primary-35 bg-slate-950/95 transition-shadow duration-300 select-none active:scale-95 touch-none"
          style={{
            left: `${bubblePos.x}px`,
            top: `${bubblePos.y}px`,
            borderColor: 'var(--primary)',
          }}
        >
          <button
            onClick={() => setIsPanelOpen(true)}
            className="w-full h-full rounded-full overflow-hidden p-1 bg-transparent border-none active:scale-90 cursor-pointer"
          >
            <img 
              src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&h=150&q=80" 
              alt="Logo Link" 
              className="w-full h-full object-cover rounded-full animate-rotate-slow"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      )}

      {/* ================= FLOATING INJECTOR DASHBOARD ================= */}
      {isPanelOpen && (
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[3000] w-72 bg-slate-950/90 backdrop-blur-xl border border-cyan-400/55 rounded-2xl shadow-[0_15px_40px_rgba(34,211,238,0.25)] p-4 flex flex-col gap-3.5 select-none text-white transition-all duration-300 touch-none"
        >
          {/* Animated Green Scanning Grid Line */}
          {isAnalyzing && (
            <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-50 animate-scan" style={{ backgroundColor: 'var(--primary)', boxShadow: '0 0 15px var(--glow)' }} />
          )}

          {/* Header Panel */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-theme-primary-25 p-0.5 bg-slate-950">
                <img 
                  src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&h=150&q=80" 
                  alt="Inject logo" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-black tracking-widest text-theme-primary uppercase">
                GODXGOKU.PREDICTOR
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-theme-primary-10 px-2 py-0.5 rounded border border-theme-primary-25">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-primary animate-pulse-glow" style={{ backgroundColor: 'var(--primary)' }} />
              <span className="text-[7.5px] font-extrabold tracking-wider text-theme-primary uppercase">
                {timeFrame === '1m' ? '1 MINUTE' : '30 SECONDS'}
              </span>
            </div>
          </div>

          {/* Period Details */}
          <div className="p-2.5 rounded-lg border border-theme-primary-15 bg-theme-primary-5 flex flex-col items-center">
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              Target Period Sync
            </div>
            <div className="text-xs font-mono font-black text-white tracking-widest">
              {formatPeriodMasked(period)}
            </div>
          </div>

          {/* Core Prediction Box with beautiful border design, corners and graphical badges */}
          <div className="h-32 rounded-xl bg-slate-950/95 border-2 border-theme-primary-25 shadow-theme-glow flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* High-tech Corner brackets to make it look super smart */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-[3px] border-l-[3px] rounded-tl-sm pointer-events-none" style={{ borderColor: 'var(--primary)' }} />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-[3px] border-r-[3px] rounded-tr-sm pointer-events-none" style={{ borderColor: 'var(--primary)' }} />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-[3px] border-l-[3px] rounded-bl-sm pointer-events-none" style={{ borderColor: 'var(--primary)' }} />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-[3px] border-r-[3px] rounded-br-sm pointer-events-none" style={{ borderColor: 'var(--primary)' }} />

            {/* Countdown timer overlay */}
            <div className="absolute top-2 right-2 text-[8px] font-mono font-bold text-slate-400">
              NEXT IN: {String(secondsLeft).padStart(2, '0')}s
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-1.5 animate-pulse">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)' }} />
                <span className="text-[9px] font-black tracking-widest text-theme-primary uppercase">
                  DECODING MATRIX...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                {skip ? (
                  <div className="flex flex-col items-center gap-1">
                    <AlertTriangle className="w-7 h-7 text-amber-400 animate-bounce" />
                    <span className="text-xs font-black text-amber-400 tracking-widest uppercase">
                      SKIP PERIOD
                    </span>
                    <span className="text-[6.5px] text-slate-500 tracking-wide uppercase font-medium">
                      High randomness detected in current block
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    {/* Visual Prediction Badge Image */}
                    {mode === 'size' ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-4">
                          <img 
                            src={prediction === 'SMALL' ? IMG_SMALL : IMG_BIG} 
                            alt={prediction}
                            className="h-14 object-contain animate-pulse-glow"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col items-center bg-slate-900/90 border border-theme-primary-25 px-2.5 py-1 rounded-lg">
                            <span className="text-[7px] text-theme-primary font-black uppercase tracking-wider mb-0.5" style={{ textShadow: '0 0 6px var(--glow)' }}>Lucky Number Suggestion</span>
                            <div className="flex gap-1.5">
                              {getRecommendedNumbers(period, prediction === 'SMALL').map((num) => (
                                <span 
                                  key={num} 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black bg-slate-950 border"
                                  style={{
                                    borderColor: 'var(--primary)',
                                    color: prediction === 'SMALL' ? '#818cf8' : '#fbbf24',
                                    boxShadow: '0 0 6px var(--glow)'
                                  }}
                                >
                                  {num}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {patternName && (
                          <div className="mt-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded px-2.5 py-0.5">
                            <span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase">
                              Trend: {patternName}
                            </span>
                          </div>
                        )}
                        <span className="text-[7.5px] font-bold tracking-wider text-slate-400 uppercase mt-1.5">
                          Calculated Pattern Signal & Target Suggestions
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {NUM_IMAGES[predictedNumber] ? (
                          <img 
                            src={NUM_IMAGES[predictedNumber]} 
                            alt={String(predictedNumber)}
                            className="h-14 object-contain animate-pulse-glow rounded"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--primary), #4f46e5)', borderColor: 'rgba(var(--primary-rgb), 0.2)' }}>
                            {predictedNumber}
                          </div>
                        )}
                        {patternName && (
                          <div className="mt-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded px-2.5 py-0.5">
                            <span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase">
                              Trend: {patternName}
                            </span>
                          </div>
                        )}
                        <span className="text-[7.5px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                          Target Number Signal
                        </span>
                      </div>
                    )}

                    {/* Confidence Meter */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                        Confidence:
                      </span>
                      <span className="text-[9px] font-extrabold text-emerald-400">
                        {confidence}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Row buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onExit}
              className="py-3 rounded-lg border border-red-500/25 bg-red-950/10 hover:bg-red-950/20 active:scale-95 text-[10px] font-black tracking-widest text-red-400 uppercase flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              EXIT ENGINE
            </button>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="py-3 rounded-lg cursor-pointer text-[10px] font-black tracking-widest text-slate-950 uppercase shadow-md active:scale-95 transition-all"
              style={{ background: 'linear-gradient(to right, var(--primary), #0ea5e9)' }}
            >
              HIDE OVERLAY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
