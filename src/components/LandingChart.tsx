import React, { useEffect, useRef } from 'react';

interface Candle {
  x: number;
  o: number; // open price
  c: number; // close price
  h: number; // high
  l: number; // low
}

export const LandingChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const candleWidth = 10;
    const gap = 6;
    const step = candleWidth + gap;
    const padding = 20;
    let offset = 0;
    let lastTime = 0;
    let candles: Candle[] = [];

    // Initialize dimensions and canvas scaling
    const resizeAndInit = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Generate initial candles to fill width
      const count = Math.ceil((rect.width - padding * 2) / step) + 4;
      let price = 100;
      candles = [];
      for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.47) * 3.5;
        const o = price;
        const c = price + change;
        candles.push({
          x: padding + i * step,
          o,
          c,
          h: Math.max(o, c) + Math.random() * 2.5,
          l: Math.min(o, c) - Math.random() * 2.5,
        });
        price = c;
      }
    };

    resizeAndInit();

    const getMinMax = () => {
      let min = Infinity;
      let max = -Infinity;
      candles.forEach((c) => {
        if (c.l < min) min = c.l;
        if (c.h > max) max = c.h;
      });
      return [min, max];
    };

    const getCoordY = (val: number, min: number, max: number, height: number) => {
      return height - padding - ((val - min) / (max - min || 1)) * (height - padding * 2);
    };

    const addCandle = () => {
      const last = candles[candles.length - 1];
      const price = last ? last.c : 100;
      const change = (Math.random() - 0.47) * 3.5;
      const o = price;
      const c = price + change;

      // Move existing candles left
      for (let i = 0; i < candles.length; i++) {
        candles[i].x -= step;
      }

      candles.push({
        x: last ? last.x : padding,
        o,
        c,
        h: Math.max(o, c) + Math.random() * 2.5,
        l: Math.min(o, c) - Math.random() * 2.5,
      });

      candles.shift();
    };

    // Helper to get active theme color dynamically
    const getPrimaryColor = (alpha: number = 1) => {
      const computed = window.getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      if (computed) {
        if (computed.startsWith('#')) {
          const r = parseInt(computed.slice(1, 3), 16);
          const g = parseInt(computed.slice(3, 5), 16);
          const b = parseInt(computed.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return computed;
      }
      return `rgba(34, 211, 238, ${alpha})`;
    };

    const draw = (width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      // Draw horizontal grid lines
      ctx.strokeStyle = getPrimaryColor(0.08);
      ctx.lineWidth = 1;
      for (let y = padding; y < height - padding; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw vertical grid lines
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const [min, max] = getMinMax();

      ctx.save();
      // Translate slightly to simulate smooth scrolling
      ctx.translate(-(offset % step), 0);

      // Draw wicks and candle bodies
      candles.forEach((c) => {
        const x = c.x;
        const isBullish = c.c >= c.o;
        const oy = getCoordY(c.o, min, max, height);
        const cy = getCoordY(c.c, min, max, height);
        const hy = getCoordY(c.h, min, max, height);
        const ly = getCoordY(c.l, min, max, height);

        // Wick
        ctx.strokeStyle = isBullish ? getPrimaryColor(0.5) : 'rgba(129, 140, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, hy);
        ctx.lineTo(x + candleWidth / 2, ly);
        ctx.stroke();

        // Body
        ctx.fillStyle = isBullish ? getPrimaryColor(1) : '#4f46e5';
        ctx.beginPath();
        // Support round rect or fallback to standard rect
        if (ctx.roundRect) {
          ctx.roundRect(x, Math.min(oy, cy), candleWidth, Math.abs(oy - cy) || 1.5, 2);
        } else {
          ctx.rect(x, Math.min(oy, cy), candleWidth, Math.abs(oy - cy) || 1.5);
        }
        ctx.fill();
      });

      ctx.restore();

      // Draw smooth line trend overlay
      if (candles.length > 1) {
        const pts = candles.map((c) => [
          c.x - (offset % step) + candleWidth / 2,
          getCoordY((c.o + c.c) / 2, min, max, height),
        ]);

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, getPrimaryColor(0));
        gradient.addColorStop(0.3, getPrimaryColor(0.6));
        gradient.addColorStop(1, '#6366f1');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.shadowColor = getPrimaryColor(0.4);
        ctx.shadowBlur = 6;
        
        ctx.beginPath();
        pts.forEach(([px, py], i) => {
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }
    };

    const loop = (timestamp: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const delta = timestamp - lastTime;
      lastTime = timestamp;

      offset += delta * 0.025;
      if (offset > step) {
        offset -= step;
        addCandle();
      }

      draw(width, height);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame((ts) => {
      lastTime = ts;
      animId = requestAnimationFrame(loop);
    });

    const handleResize = () => {
      resizeAndInit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
