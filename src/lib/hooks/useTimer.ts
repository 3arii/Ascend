'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  initialTime: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  time: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newTime?: number, autoStart?: boolean) => void;
  addTime: (seconds: number) => void;
}

export function useTimer({
  initialTime,
  onComplete,
  autoStart = false,
}: UseTimerOptions): UseTimerReturn {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Timer effect
  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, time]);

  const start = useCallback(() => {
    if (time > 0) {
      setIsRunning(true);
    }
  }, [time]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number, autoStart?: boolean) => {
    const timeToSet = newTime ?? initialTime;
    setTime(timeToSet);
    if (autoStart && timeToSet > 0) {
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [initialTime]);

  const addTime = useCallback((seconds: number) => {
    setTime(prev => Math.max(0, prev + seconds));
  }, []);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    addTime,
  };
}
