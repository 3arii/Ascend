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
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Set end time when starting
  useEffect(() => {
    if (isRunning && time > 0 && endTimeRef.current === null) {
      endTimeRef.current = Date.now() + time * 1000;
    }
  }, [isRunning, time]);

  // Timer effect using timestamps (works even when tab is inactive)
  useEffect(() => {
    if (isRunning && time > 0) {
      const tick = () => {
        if (endTimeRef.current === null) return;

        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

        if (remaining <= 0) {
          setTime(0);
          setIsRunning(false);
          endTimeRef.current = null;
          onCompleteRef.current?.();
        } else {
          setTime(remaining);
        }
      };

      // Run immediately to sync time (important when returning to tab)
      tick();

      // Use shorter interval for more responsive updates
      intervalRef.current = setInterval(tick, 250);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Handle visibility change - sync time when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && endTimeRef.current) {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          setTime(0);
          setIsRunning(false);
          endTimeRef.current = null;
          onCompleteRef.current?.();
        } else {
          setTime(remaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning]);

  const start = useCallback(() => {
    if (time > 0) {
      endTimeRef.current = Date.now() + time * 1000;
      setIsRunning(true);
    }
  }, [time]);

  const pause = useCallback(() => {
    if (endTimeRef.current) {
      // Save remaining time when pausing
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setTime(Math.max(0, remaining));
    }
    endTimeRef.current = null;
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number, autoStart?: boolean) => {
    const timeToSet = newTime ?? initialTime;
    setTime(timeToSet);
    endTimeRef.current = null;

    if (autoStart && timeToSet > 0) {
      endTimeRef.current = Date.now() + timeToSet * 1000;
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [initialTime]);

  const addTime = useCallback((seconds: number) => {
    setTime(prev => {
      const newTime = Math.max(0, prev + seconds);
      if (endTimeRef.current && isRunning) {
        endTimeRef.current += seconds * 1000;
      }
      return newTime;
    });
  }, [isRunning]);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    addTime,
  };
}
