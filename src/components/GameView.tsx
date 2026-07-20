import React, { useState, useEffect, useRef } from 'react';
import { Game, PredictionItem, PredictionMode, TimeFrame } from '../types';
import { getCurrentPeriod, getPredictionForPeriod, formatPeriodMasked, fetchRealTimeDraws, getHistoricalRecordsFromDraws } from '../utils/predictor';
import { Eye, EyeOff, LogOut, Sparkles, TrendingUp, AlertTriangle, Wallet, Award, RotateCcw, Copy, Check, BarChart2 } from 'lucide-react';
import { playWinSound, playLossSound } from '../utils/audio';

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

interface ChallengeLog {
  status: 'WIN' | 'LOSS';
  period: string;
  level: number;
  stake: number;
  capital: number;
}

const LEVEL_STAKES = [10, 20, 50, 110, 240];

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
  historicalRecords: PredictionItem[];
  onInitializeHistory: (items: PredictionItem[]) => void;
}

export const GameView: React.FC<GameViewProps> = ({
  game,
  mode,
  timeFrame,
  onExit,
  onAddHistoryItem,
  onUpdateDraws,
  historicalRecords,
  onInitializeHistory,
}) => {
  const [period, setPeriod] = useState('SYNCING...');
  const [secondsLeft, setSecondsLeft] = useState(0);
  
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  
  // Current prediction state
  const [prediction, setPrediction] = useState<'BIG' | 'SMALL' | 'SKIP'>('SKIP');
  const [predictedNumber, setPredictedNumber] = useState<string | number>('⚠');
  const [confidence, setConfidence] = useState(90);
  const [skip, setSkip] = useState(true);
  const [patternName, setPatternName] = useState('Algorithm Wave Sync');

  // Capital challenge states with localStorage backup
  const [challengeCapital, setChallengeCapital] = useState<number>(() => {
    const saved = localStorage.getItem('wingo_challenge_capital');
    return saved ? parseFloat(saved) : 500;
  });
  const [challengeLevel, setChallengeLevel] = useState<number>(() => {
    const saved = localStorage.getItem('wingo_challenge_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [challengeHistory, setChallengeHistory] = useState<ChallengeLog[]>(() => {
    const saved = localStorage.getItem('wingo_challenge_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          return parsed.map((item: any) => ({
            status: item === '🟢' ? 'WIN' : 'LOSS',
            period: 'SYNCED',
            level: 1,
            stake: 10,
            capital: 500
          }));
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [pendingBetPeriod, setPendingBetPeriod] = useState<string | null>(() => {
    return localStorage.getItem('wingo_challenge_pending_bet_period');
  });
  const [pendingBetPred, setPendingBetPred] = useState<string | null>(() => {
    return localStorage.getItem('wingo_challenge_pending_bet_pred');
  });
  const [pendingBetLevel, setPendingBetLevel] = useState<number | null>(() => {
    const saved = localStorage.getItem('wingo_challenge_pending_bet_level');
    return saved ? parseInt(saved, 10) : null;
  });
  const [copied, setCopied] = useState(false);

  // Erase challenge states on unmount (when leaving the game view)
  useEffect(() => {
    return () => {
      localStorage.removeItem('wingo_challenge_capital');
      localStorage.removeItem('wingo_challenge_level');
      localStorage.removeItem('wingo_challenge_history');
      localStorage.removeItem('wingo_challenge_pending_bet_period');
      localStorage.removeItem('wingo_challenge_pending_bet_pred');
      localStorage.removeItem('wingo_challenge_pending_bet_level');
    };
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('wingo_challenge_capital', challengeCapital.toString());
  }, [challengeCapital]);

  useEffect(() => {
    localStorage.setItem('wingo_challenge_level', challengeLevel.toString());
  }, [challengeLevel]);

  useEffect(() => {
    localStorage.setItem('wingo_challenge_history', JSON.stringify(challengeHistory));
  }, [challengeHistory]);

  useEffect(() => {
    if (pendingBetPeriod) {
      localStorage.setItem('wingo_challenge_pending_bet_period', pendingBetPeriod);
    } else {
      localStorage.removeItem('wingo_challenge_pending_bet_period');
    }
  }, [pendingBetPeriod]);

  useEffect(() => {
    if (pendingBetPred) {
      localStorage.setItem('wingo_challenge_pending_bet_pred', pendingBetPred);
    } else {
      localStorage.removeItem('wingo_challenge_pending_bet_pred');
    }
  }, [pendingBetPred]);

  useEffect(() => {
    if (pendingBetLevel) {
      localStorage.setItem('wingo_challenge_pending_bet_level', pendingBetLevel.toString());
    } else {
      localStorage.removeItem('wingo_challenge_pending_bet_level');
    }
  }, [pendingBetLevel]);

  // Keep refs synchronized to avoid stale closure issues in the sync loop effect
  const pendingBetPeriodRef = useRef<string | null>(null);
  const pendingBetPredRef = useRef<string | null>(null);
  const pendingBetLevelRef = useRef<number | null>(null);

  useEffect(() => {
    pendingBetPeriodRef.current = pendingBetPeriod;
  }, [pendingBetPeriod]);

  useEffect(() => {
    pendingBetPredRef.current = pendingBetPred;
  }, [pendingBetPred]);

  useEffect(() => {
    pendingBetLevelRef.current = pendingBetLevel;
  }, [pendingBetLevel]);

  // Unified resolution function
  const resolveBet = (won: boolean, targetPeriod: string, levelForBet: number | null) => {
    const betLvl = levelForBet || challengeLevel;
    const currentStake = LEVEL_STAKES[betLvl - 1] || 10;
    
    if (won) {
      playWinSound();
    } else {
      playLossSound();
    }
    
    setChallengeCapital((prev) => {
      let nextCapital = prev;
      if (won) {
        nextCapital += currentStake;
      } else {
        nextCapital -= currentStake;
      }
      return nextCapital;
    });

    setChallengeLevel((prevLevel) => {
      if (won) {
        return 1; // reset to 1
      } else {
        return prevLevel >= 5 ? 1 : prevLevel + 1; // advance level or reset
      }
    });

    setChallengeHistory((prev) => {
      const newLog: ChallengeLog = {
        status: won ? 'WIN' : 'LOSS',
        period: formatPeriodMasked(targetPeriod || period),
        level: betLvl,
        stake: currentStake,
        capital: won ? (challengeCapital + currentStake) : (challengeCapital - currentStake)
      };
      return [...prev, newLog].slice(-30);
    });

    setPendingBetPeriod(null);
    setPendingBetPred(null);
    setPendingBetLevel(null);
  };

  const resolveBetRef = useRef<typeof resolveBet>(() => {});
  resolveBetRef.current = resolveBet;

  const challengeCapitalRef = useRef(challengeCapital);
  const challengeLevelRef = useRef(challengeLevel);

  useEffect(() => {
    challengeCapitalRef.current = challengeCapital;
  }, [challengeCapital]);

  useEffect(() => {
    challengeLevelRef.current = challengeLevel;
  }, [challengeLevel]);

  const handleCopySignal = () => {
    const cleanPeriod = period; // raw period e.g. 20260719100010123
    const predStr = prediction === 'BIG' ? 'BIGGG' : prediction === 'SMALL' ? 'SMALL' : 'SKIP';
    const activeStake = LEVEL_STAKES[challengeLevel - 1] || 10;
    const textToCopy = `PERIOD NO.👉. ${cleanPeriod} 👉 ${predStr}\n\nBET AMOUNT 👉. ₹${activeStake}`;
    
    try {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback if navigator.clipboard is not available in iframe sandbox:
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (copyErr) {
        console.error('Fallback copy failed', copyErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleExit = () => {
    localStorage.removeItem('wingo_challenge_capital');
    localStorage.removeItem('wingo_challenge_level');
    localStorage.removeItem('wingo_challenge_history');
    localStorage.removeItem('wingo_challenge_pending_bet_period');
    localStorage.removeItem('wingo_challenge_pending_bet_pred');
    localStorage.removeItem('wingo_challenge_pending_bet_level');
    onExit();
  };

  // Floating bubble position state
  const [bubblePos, setBubblePos] = useState({ x: 20, y: 150 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 20, y: 150 });

  // Manage period and predictions loop
  useEffect(() => {
    let lastProcessedPeriod = '';
    let isFetching = false;
    let hasInitializedThisCycle = false;

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

          // Auto resolve challenge bets
          if (list && list.length > 0 && pendingBetPeriodRef.current) {
            const matchedDraw = list.find(d => String(d.issueNumber) === String(pendingBetPeriodRef.current));
            if (matchedDraw) {
              const actualNumber = matchedDraw.number;
              let won = false;
              if (mode === 'size') {
                const isBig = actualNumber >= 5;
                const predictedBig = pendingBetPredRef.current === 'BIG';
                won = isBig === predictedBig;
              } else {
                won = String(actualNumber) === String(pendingBetPredRef.current);
              }
              resolveBetRef.current(won, pendingBetPeriodRef.current, pendingBetLevelRef.current);
            }
          }

          // Initialize history if empty or first sync of this cycle
          if (list && list.length > 0 && !hasInitializedThisCycle) {
            hasInitializedThisCycle = true;
            const initialHistory = getHistoricalRecordsFromDraws(list, mode);
            onInitializeHistory(initialHistory);
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

              // Auto-track challenge bet if capital target has not been reached or broken
              if (!result.skip && challengeCapitalRef.current < 1000 && challengeCapitalRef.current > 0) {
                setPendingBetPeriod(currPeriod);
                setPendingBetPred(result.prediction);
                setPendingBetLevel(challengeLevelRef.current);
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
  }, [timeFrame, mode, onAddHistoryItem, onUpdateDraws, onInitializeHistory]);

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
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[3000] w-[270px] bg-slate-950/95 backdrop-blur-md border border-cyan-400/55 rounded-2xl shadow-[0_15px_35px_rgba(34,211,238,0.25)] p-2.5 flex flex-col gap-2 max-h-[96vh] overflow-y-auto select-none text-white transition-all duration-300"
        >
          {/* Animated Green Scanning Grid Line */}
          {isAnalyzing && (
            <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-50 animate-scan" style={{ backgroundColor: 'var(--primary)', boxShadow: '0 0 15px var(--glow)' }} />
          )}

          {/* Header Panel */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full border border-theme-primary-25 p-0.5 bg-slate-950">
                <img 
                  src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&h=150&q=80" 
                  alt="Inject logo" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[9px] font-black tracking-widest text-theme-primary uppercase">
                GODXGOKU.PREDICTOR
              </span>
            </div>
            
            <div className="flex items-center gap-1 bg-theme-primary-10 px-1.5 py-0.5 rounded border border-theme-primary-25">
              <span className="w-1 h-1 rounded-full bg-theme-primary animate-pulse-glow" style={{ backgroundColor: 'var(--primary)' }} />
              <span className="text-[7px] font-extrabold tracking-wider text-theme-primary uppercase">
                {timeFrame === '1m' ? '1 MIN' : '30 SEC'}
              </span>
            </div>
          </div>

          {/* Period Details */}
          <div className="py-1.5 px-2 rounded-lg border border-theme-primary-15 bg-theme-primary-5 flex flex-col items-center">
            <div className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              Target Period Sync
            </div>
            <div className="text-[11px] font-mono font-black text-white tracking-widest">
              {formatPeriodMasked(period)}
            </div>
          </div>

          {/* Core Prediction Box with beautiful border design, corners and graphical badges */}
          <div className="h-28 rounded-xl bg-slate-950/95 border-2 border-theme-primary-25 shadow-theme-glow flex flex-col items-center justify-center relative overflow-hidden">
            
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

            {/* Beautiful, Prominent COPY SIGNAL Button inside Main Panel */}
            <div className="px-1 py-0.5">
              <button
                onClick={handleCopySignal}
                className="w-full flex items-center justify-center gap-1.5 bg-cyan-950/40 hover:bg-cyan-950/80 active:scale-95 border-2 border-cyan-500/35 rounded-xl text-[10px] font-black tracking-widest text-cyan-300 uppercase py-2.5 cursor-pointer transition-all shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                    COPIED! ✅
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    COPY SIGNAL
                  </>
                )}
              </button>
            </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleExit}
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

      {/* ================= 💰 SEPARATE FLOATING TARGET CHALLENGE PANEL ================= */}
      {isChallengeOpen && (
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[3000] w-[270px] bg-slate-950/98 backdrop-blur-md border border-amber-500/50 rounded-2xl shadow-[0_15px_35px_rgba(245,158,11,0.25)] p-3 flex flex-col gap-3 max-h-[96vh] overflow-y-auto select-none text-white transition-all duration-300"
        >
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="text-[10px] font-black text-amber-400 tracking-wider flex items-center gap-1 uppercase">
              <Award className="w-4 h-4 text-amber-400" />
              CHALLENGE CONSOLE
            </span>
            <button 
              onClick={() => setIsChallengeOpen(false)}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 text-[9px] font-black px-2 py-0.5 uppercase transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Capital Progress Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                Capital: <span className="text-white font-mono font-bold">₹{challengeCapital}</span>
              </span>
              
              <button
                onClick={() => {
                  setChallengeCapital((prev) => prev + 500);
                }}
                className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900 text-[8px] font-black tracking-wider uppercase transition-colors cursor-pointer"
              >
                + Add ₹500
              </button>
            </div>
            
            {/* Progress visual bar */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, ((challengeCapital - 500) / 500) * 100))}%` }}
              />
            </div>

            {challengeCapital >= 1000 ? (
              <div className="text-center text-[9px] font-black text-emerald-400 animate-bounce bg-emerald-950/40 py-1 rounded border border-emerald-500/20 uppercase mt-0.5">
                🎉 TARGET COMPLETED! 👍 WINNING BOOM!
              </div>
            ) : challengeCapital <= 0 ? (
              <div className="flex flex-col gap-1.5 mt-0.5">
                <div className="text-center text-[9px] font-black text-red-400 bg-red-950/40 py-1 rounded border border-red-500/20 uppercase">
                  ⚠️ CAPITAL BROKEN! (₹0)
                </div>
                <button
                  onClick={() => {
                    setChallengeCapital(500);
                    setChallengeLevel(1);
                    setChallengeHistory([]);
                    setPendingBetPeriod(null);
                    setPendingBetPred(null);
                    setPendingBetLevel(null);
                  }}
                  className="w-full py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  RECHARGE WALLET (₹500)
                </button>
              </div>
            ) : (
              <div className="flex justify-between text-[8px] text-slate-500 font-semibold uppercase">
                <span>Start: ₹500</span>
                <span>Progress: {Math.floor(Math.min(100, Math.max(0, ((challengeCapital - 500) / 500) * 100)))}%</span>
              </div>
            )}
          </div>

          {/* Current Level Bet Details */}
          {challengeCapital > 0 && challengeCapital < 1000 && (
            <div className="flex flex-col gap-1 bg-slate-900/40 rounded-lg p-2 border border-slate-900">
              <span className="text-[7.5px] text-slate-400 font-black tracking-wider uppercase">Active Stake Amount</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white font-mono flex items-center gap-1.5">
                  ₹{LEVEL_STAKES[challengeLevel - 1] || 10}
                  <span className="text-[7px] text-amber-400 font-extrabold font-sans bg-amber-950/50 px-1 py-0.5 rounded border border-amber-500/10">
                    Lvl {challengeLevel}
                  </span>
                </span>
                <span className="text-[8px] text-emerald-400 font-extrabold">
                  (₹{LEVEL_STAKES[challengeLevel - 1] || 10} ➔ ₹{(LEVEL_STAKES[challengeLevel - 1] || 10) * 2} WIN)
                </span>
              </div>
            </div>
          )}

          {/* Manual Controls Panel */}
          {challengeCapital > 0 && challengeCapital < 1000 && (
            <div className="flex flex-col gap-1.5 bg-slate-900/60 rounded-lg p-2 border border-slate-900/80">
              <div className="text-[7.5px] text-slate-400 font-black tracking-widest uppercase text-center">
                {pendingBetPeriod ? (
                  <span className="text-amber-400 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Auto-tracking: {formatPeriodMasked(pendingBetPeriod)} ({pendingBetPred})
                  </span>
                ) : (
                  "Manual Win / Loss Log"
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    resolveBet(true, period, challengeLevel);
                  }}
                  className="py-1.5 rounded bg-emerald-950/50 hover:bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  ✅ WIN
                </button>
                <button
                  onClick={() => {
                    resolveBet(false, period, challengeLevel);
                  }}
                  className="py-1.5 rounded bg-red-950/50 hover:bg-red-950 border border-red-500/40 text-red-400 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  ❌ LOSS
                </button>
              </div>
            </div>
          )}

          {/* Streak History Details */}
          <div className="flex flex-col gap-1 border-t border-slate-900/50 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase">Streak Log History</span>
              <button 
                onClick={() => {
                  if (window.confirm("क्या आप चुनौती इतिहास को पूरी तरह मिटाना चाहते हैं?")) {
                    setChallengeHistory([]);
                  }
                }}
                className="text-[7.5px] text-red-400 hover:text-red-300 uppercase font-black cursor-pointer"
              >
                Clear History
              </button>
            </div>
            <div className="flex flex-wrap gap-1 min-h-[22px] max-h-24 overflow-y-auto p-1.5 rounded bg-slate-950 border border-slate-900/80 items-center justify-start">
              {challengeHistory.length > 0 ? (
                challengeHistory.map((log, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-0.5 bg-slate-900 border border-slate-800/60 px-1 py-0.5 rounded text-[8px] font-semibold text-slate-300 select-none"
                    title={`Period: ${log.period} | Level: ${log.level} | Stake: ₹${log.stake} | Balance: ₹${log.capital}`}
                  >
                    <span>{log.status === 'WIN' ? '🟢' : '🔴'}</span>
                    <span className="font-mono text-[7px] text-slate-400">₹{log.stake}</span>
                  </div>
                ))
              ) : (
                <span className="text-[7px] text-slate-500 tracking-wider font-bold uppercase italic mx-auto">
                  No Streak Log Recorded
                </span>
              )}
            </div>
          </div>

          {/* Reset Action */}
          <button 
            onClick={() => {
              if (window.confirm("क्या आप चैलेंज को ₹500 पर रिसेट करना चाहते हैं?")) {
                setChallengeCapital(500);
                setChallengeLevel(1);
                setChallengeHistory([]);
                setPendingBetPeriod(null);
                setPendingBetPred(null);
                setPendingBetLevel(null);
              }
            }}
            className="w-full py-2 bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-red-500/20 rounded-lg text-[9px] font-black text-slate-400 hover:text-red-400 tracking-widest uppercase transition-colors cursor-pointer"
          >
            Reset Entire Challenge
          </button>
        </div>
      )}

      {/* ================= FLOATING ACTION BUTTONS FOR DRAGGABLE OVERLAYS ================= */}
      <div className="fixed right-4 bottom-24 z-[2500] flex flex-col gap-2.5">
        {/* Toggle Challenge Panel Button */}
        <button
          onClick={() => setIsChallengeOpen(prev => !prev)}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer border-2 hover:scale-105 active:scale-95 ${
            isChallengeOpen 
              ? 'bg-amber-500 text-slate-950 border-white' 
              : 'bg-slate-950/95 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
          }`}
          title="Open Challenge & Log Tracker"
        >
          <BarChart2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
