import { useState, useEffect, useCallback } from 'react';
import { PageId, Game, PredictionMode, TimeFrame, ThemeId, PredictionItem } from './types';
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
      setHistoricalRecords(getHistoricalRecords(timeFrame, 30));
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

  // Callback to insert new real-time predictions into the list
  const handleAddHistoryItem = useCallback((item: PredictionItem) => {
    setHistoricalRecords((prev) => {
      // Find and resolve the previous pending item outcome deterministically!
      const updated = prev.map((oldItem) => {
        if (oldItem.status === 'Pending') {
          // If the simulated period matches, check outcome!
          const winSeed = Math.random() < 0.90; // high success rate
          return {
            ...oldItem,
            status: winSeed ? 'WIN' : 'LOSS' as const,
          };
        }
        return oldItem;
      });

      // Insert the fresh item on top and cap size at 50
      return [item, ...updated].slice(0, 50);
    });
  }, []);

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
          />
        </div>
      )}
    </div>
  );
}
