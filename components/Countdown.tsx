import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface CountdownProps {
  targetDate: Date;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number}>({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
      <Timer className="w-4 h-4 text-purple-400 animate-pulse" />
      <div className="flex gap-1 font-mono text-sm font-bold text-white">
        <span>{String(timeLeft.h).padStart(2, '0')}</span>
        <span className="text-slate-500">:</span>
        <span>{String(timeLeft.m).padStart(2, '0')}</span>
        <span className="text-slate-500">:</span>
        <span className="text-purple-400">{String(timeLeft.s).padStart(2, '0')}</span>
      </div>
    </div>
  );
};