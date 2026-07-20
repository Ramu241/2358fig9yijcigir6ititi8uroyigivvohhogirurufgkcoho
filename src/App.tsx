import { useState, useEffect, useCallback } from 'react';
import { PageId, Game, PredictionMode, TimeFrame, ThemeId, PredictionItem, PredictionStatus } from './types';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { GameView } from './components/GameView';
import { getHistoricalRecords } from './utils/predictor';

export default function App() {
  const [page, setPage] = useState<PageId>('landing');
  const [username, setUsername] = useState<string>('');
  
  // Game state
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [activeMode, setActiveMode] = useState<PredictionMode>('size');
  const [activeTimeFrame, setActiveTimeFrame] = useState<TimeFrame>('1m');

  // Themes state
  const [theme, setTheme] = useState<ThemeId>('red');

  // Shared history logs
  const [historicalRecords, setHistoricalRecords] = useState<PredictionItem[]>([]);

  // Load saved credentials on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('fusion_username');
    const savedTheme = localStorage.getItem('fusion_theme_id') as ThemeId;

    if (savedUser) {
      setUsername(savedUser);
      setPage('dashboard');
    }

    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Update theme attributes on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fusion_theme_id', theme);
  }, [theme]);

  const handleStart = () => {
    setPage('login');
  };

  const handleLoginSuccess = (user: string) => {
    setUsername(user);
    localStorage.setItem('fusion_username', user);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUsername('');
    setActiveGame(null);
    localStorage.removeItem('fusion_username');
    setPage('login');
  };

  const handleSelectGame = (game: Game, mode: PredictionMode, timeFrame: TimeFrame) => {
    if (!activeGame || activeGame.id !== game.id || activeTimeFrame !== timeFrame) {
      setHistoricalRecords([]); // Clear to let GameView load the actual real history from the API
    }
    setActiveGame(game);
    setActiveMode(mode);
    setActiveTimeFrame(timeFrame);
    setPage('game-view');
  };

  const handleExitGame = () => {
    // Keep activeGame set to preserve iframe state in the background
    setPage('dashboard');
  };

  const handleInitializeHistory = useCallback((items: PredictionItem[]) => {
    setHistoricalRecords(items);
  }, []);

  // Callback to insert new real-time predictions into the list
  const handleAddHistoryItem = useCallback((item: PredictionItem) => {
    setHistoricalRecords((prev) => {
      // Do NOT arbitrarily resolve pending items with Math.random()!
      // They will be resolved correctly when the real draw data arrives.
      // Insert the fresh item on top and cap size at 50
      return [item, ...prev].slice(0, 50);
    });
  }, []);

  const handleUpdateDraws = useCallback((drawsList: any[]) => {
    setHistoricalRecords((prev) => {
      let changed = false;
      const updated = prev.map((oldItem) => {
        if (oldItem.status === 'Pending') {
          const matchingDraw = drawsList.find((d) => String(d.issueNumber) === String(oldItem.fullPeriod));
          if (matchingDraw) {
            changed = true;
            const actualNumber = matchingDraw.number;
            let status: PredictionStatus = 'Pending';
            if (activeMode === 'size') {
              const isBig = actualNumber >= 5;
              const predictedBig = oldItem.prediction === 'BIG';
              status = (isBig === predictedBig) ? 'WIN' : 'LOSS';
            } else {
              status = (String(actualNumber) === String(oldItem.number)) ? 'WIN' : 'LOSS';
            }
            return {
              ...oldItem,
              status,
            };
          }
        }
        return oldItem;
      });
      return changed ? updated : prev;
    });
  }, [activeMode]);

  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden">
      {page === 'landing' && (
        <LandingPage onStart={handleStart} />
      )}

      {page === 'login' && (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}

      {page === 'dashboard' && (
        <Dashboard
          username={username}
          onLogout={handleLogout}
          onSelectGame={handleSelectGame}
          currentTheme={theme}
          onThemeChange={setTheme}
          historicalRecords={historicalRecords}
          setHistoricalRecords={setHistoricalRecords}
        />
      )}

      {activeGame && (
        <div className={page === 'game-view' ? 'w-full h-full flex flex-col flex-1' : 'hidden'}>
          <GameView
            game={activeGame}
            mode={activeMode}
            timeFrame={activeTimeFrame}
            onExit={handleExitGame}
            onAddHistoryItem={handleAddHistoryItem}
            onUpdateDraws={handleUpdateDraws}
            historicalRecords={historicalRecords}
            onInitializeHistory={handleInitializeHistory}
          />
        </div>
      )}
    </div>
  );
}
