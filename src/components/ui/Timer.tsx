'use client';

import { motion } from 'framer-motion';
import { formatTime } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface TimerProps {
  time: number;
  totalTime: number;
  isRunning: boolean;
  onSkip?: () => void;
  onAddTime?: (seconds: number) => void;
  className?: string;
}

export function Timer({
  time,
  totalTime,
  isRunning,
  onSkip,
  onAddTime,
  className,
}: TimerProps) {
  const progress = totalTime > 0 ? (time / totalTime) * 100 : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Circular timer */}
      <div className="relative w-72 h-72">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="144"
            cy="144"
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <motion.circle
            cx="144"
            cy="144"
            r={radius}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold tabular-nums">{formatTime(time)}</span>
          <span className="text-zinc-400 mt-2">
            {isRunning ? 'Rest Time' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-6">
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
          >
            Skip Rest
          </button>
        )}
        {onAddTime && (
          <button
            onClick={() => onAddTime(30)}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
          >
            +30 sec
          </button>
        )}
      </div>
    </div>
  );
}
