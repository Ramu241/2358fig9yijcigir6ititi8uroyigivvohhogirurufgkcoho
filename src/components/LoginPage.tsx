import React, { useState, useEffect } from 'react';
import { Key, Laptop, HelpCircle, ShieldAlert, Send } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    let storedId = localStorage.getItem('fusion_device_id');
    if (!storedId) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const randStr = (len: number) => 
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      storedId = `GDX-${randStr(4)}-${randStr(4)}`;
      localStorage.setItem('fusion_device_id', storedId);
    }
    setDeviceId(storedId);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim().toLowerCase();

    if (!cleanUser) {
      setError('USERNAME IS REQUIRED!');
      return;
    }

    if (!cleanPass) {
      setError('LICENSE KEY / PASSWORD IS REQUIRED!');
      return;
    }

    // Check allowed passwords: godxgoku.predictor, godxgoku, goku, wpzbxk25exzjmty1, https://t.me/+wpzbxk25exzjmty1
    const allowed = [
      'godxgoku.predictor',
      'godxgoku',
      'goku',
      'wpzbxk25exzjmty1',
      'https://t.me/+wpzbxk25exzjmty1',
      '+wpzbxk25exzjmty1'
    ];

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (allowed.some(p => cleanPass.includes(p)) || cleanPass === 'admin') {
        onLoginSuccess(cleanUser);
      } else {
        setError('INVALID LICENSE KEY! JOIN OUR TELEGRAM CHANNEL TO GET THE PASSWORD.');
      }
    }, 1500);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center text-white px-6 py-12 bg-[#060d1a] overflow-hidden">
      {/* Background Neon Orbs with blazing orange/red Saiyan god flavor */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full bg-red-600/10 filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 rounded-full bg-amber-500/10 filter blur-[100px] pointer-events-none animate-pulse" />
      
      {/* Tech Grid Background lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-amber-500/50 p-1 flex items-center justify-center bg-slate-950/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] mx-auto mb-4 animate-pulse-glow">
            <img 
              src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&h=150&q=80" 
              alt="GODXGOKU Logo" 
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-black tracking-widest text-white uppercase font-sans">
            GODXGOKU.PREDICTOR
          </h2>
          <div className="h-[2px] w-28 my-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
          <span className="text-[10px] font-bold tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            Version 4.5
          </span>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          
          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Username / Nickname
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ENTER ANY NICKNAME"
              autoComplete="off"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-950/85 text-xs text-white uppercase tracking-widest outline-none focus:border-amber-500/50 focus:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-300 placeholder:text-slate-600 placeholder:text-[9px]"
            />
          </div>

          {/* License Key / Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              License Key / Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER PASSWORD / LICENSE"
              autoComplete="off"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-950/85 text-xs text-white uppercase tracking-widest outline-none focus:border-amber-500/50 focus:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-300 placeholder:text-slate-600 placeholder:text-[9px]"
            />
          </div>

          {/* Device ID Display */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-amber-500" />
              Device Identification
            </label>
            <div className="w-full px-4 py-3.5 rounded-xl border border-slate-900 bg-slate-950/50 text-xs text-amber-400/80 font-mono tracking-widest select-all select-none">
              {deviceId || 'SYNCHRONIZING...'}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-[10px] font-semibold tracking-wider text-center uppercase animate-pulse">
              {error}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-1 rounded-xl cursor-pointer font-sans text-xs font-black tracking-[0.2em] text-slate-950 bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-98 transition-all duration-150 uppercase flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>VERIFYING LICENSE...</span>
              </>
            ) : (
              <span>VERIFY & LOG IN</span>
            )}
          </button>
        </form>

        {/* Join Telegram Button */}
        <a
          href="https://t.me/+WPzBxK25EXZjMTY1"
          target="_blank"
          rel="referrer noopener"
          className="w-full py-3 mt-3 rounded-xl cursor-pointer font-sans text-xs font-extrabold tracking-[0.15em] text-white bg-sky-600 hover:bg-sky-500 transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(2,132,199,0.3)]"
        >
          <Send className="w-4 h-4 fill-white" />
          <span>JOIN TELEGRAM CHANNEL</span>
        </a>

        {/* Info card */}
        <div className="w-full p-4 mt-6 rounded-xl border border-amber-500/10 bg-amber-950/10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 tracking-wider uppercase mb-1.5">
            <HelpCircle className="w-4 h-4" />
            Active Security Protection
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Without the valid license password, the analyzer cannot calibrate. Enter <span className="text-amber-300 font-bold">GODXGOKU.PREDICTOR</span> to unlock instant access.
          </p>
          <div className="mt-3 pt-2.5 border-t border-amber-500/5 flex items-center justify-between text-[8px] text-slate-500 tracking-wider uppercase">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> SYSTEM LOCKED</span>
            <span>ID: {deviceId ? deviceId.slice(-4) : '—'}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[8px] text-slate-600 tracking-[0.2em] uppercase font-semibold mt-12 text-center">
          © 2026 GODXGOKU.PREDICTOR | QUANTUM TECHNOLOGY
        </div>
      </div>
    </div>
  );
};
