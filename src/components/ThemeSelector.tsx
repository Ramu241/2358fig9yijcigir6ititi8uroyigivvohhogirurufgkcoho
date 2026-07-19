import React from 'react';
import { ColorTheme, ThemeId } from '../types';

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
}

export const THEMES: ColorTheme[] = [
  { id: 'cyan', name: 'Default Cyan', primary: 'from-cyan-400 to-cyan-600', accent: '#22d3ee', bgGlow: 'shadow-cyan-500/20', rgbPrimary: '34, 211, 238' },
  { id: 'red', name: 'Nexora Red', primary: 'from-red-400 to-red-600', accent: '#ff2e4d', bgGlow: 'shadow-red-500/20', rgbPrimary: '255, 46, 77' },
  { id: 'blue', name: 'Blue Cyber', primary: 'from-blue-400 to-blue-600', accent: '#1d6cf3', bgGlow: 'shadow-blue-500/20', rgbPrimary: '29, 108, 243' },
  { id: 'purple', name: 'Purple Galaxy', primary: 'from-purple-400 to-purple-600', accent: '#a855f7', bgGlow: 'shadow-purple-500/20', rgbPrimary: '168, 85, 247' },
  { id: 'green', name: 'Green Matrix', primary: 'from-emerald-400 to-emerald-600', accent: '#10b981', bgGlow: 'shadow-emerald-500/20', rgbPrimary: '16, 185, 129' },
  { id: 'gold', name: 'Gold Elite', primary: 'from-amber-400 to-amber-600', accent: '#eab308', bgGlow: 'shadow-amber-500/20', rgbPrimary: '234, 179, 8' },
  { id: 'orange', name: 'Orange Fire', primary: 'from-orange-400 to-orange-600', accent: '#f97316', bgGlow: 'shadow-orange-500/20', rgbPrimary: '249, 115, 22' },
  { id: 'pink', name: 'Pink Neon', primary: 'from-pink-400 to-pink-600', accent: '#ec4899', bgGlow: 'shadow-pink-500/20', rgbPrimary: '236, 72, 153' },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div className="grid grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
      {THEMES.map((theme) => {
        const isSelected = theme.id === currentTheme;
        return (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`relative aspect-square rounded-lg flex flex-col items-center justify-end p-1 text-center transition-all duration-300 border-2 active:scale-95 cursor-pointer ${
              isSelected 
                ? 'border-white shadow-lg' 
                : 'border-transparent hover:border-slate-700'
            }`}
            style={{
              background: `linear-gradient(135deg, ${theme.accent}33 0%, ${theme.accent}11 100%)`,
            }}
          >
            {isSelected && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                <svg className="w-2 h-2 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            
            {/* Colored Preview Dot */}
            <div 
              className="w-4 h-4 rounded-full mb-1 border border-white/20"
              style={{ backgroundColor: theme.accent }}
            />
            
            <span className="text-[8px] font-extrabold tracking-wider text-white uppercase truncate w-full">
              {theme.id}
            </span>
          </button>
        );
      })}
    </div>
  );
};
