export type PageId = 'landing' | 'login' | 'dashboard' | 'game-view';

export interface Game {
  id: string;
  name: string;
  url: string;
  logo: string;
  tag: string;
}

export type PredictionMode = 'size' | 'number';
export type TimeFrame = '30s' | '1m';
export type PredictionStatus = 'Pending' | 'WIN' | 'LOSS' | 'SKIP';

export interface PredictionItem {
  fullPeriod: string;
  formattedPeriod: string;
  prediction: string;
  number: string | number;
  status: PredictionStatus;
  skip: boolean;
  timestamp: number;
}

export interface ActiveGame {
  game: Game;
  mode: PredictionMode;
  timeFrame: TimeFrame;
}

export type ThemeId = 
  | 'cyan' 
  | 'red' 
  | 'blue' 
  | 'purple' 
  | 'green' 
  | 'gold' 
  | 'orange' 
  | 'pink';

export interface ColorTheme {
  id: ThemeId;
  name: string;
  primary: string; // Tailwind class like "from-cyan-400 to-cyan-600"
  accent: string;  // Hex color or specific tailwind color
  bgGlow: string;  // Glow shadow color
  rgbPrimary: string; // r, g, b values
}
