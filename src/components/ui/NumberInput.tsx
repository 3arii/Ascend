'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  size = 'md',
  className,
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) {
      setInputValue(value.toString());
    } else {
      const clamped = Math.min(max, Math.max(min, num));
      setInputValue(clamped.toString());
      onChange(clamped);
    }
  };

  const increment = () => {
    const newVal = Math.min(max, value + step);
    onChange(newVal);
  };

  const decrement = () => {
    const newVal = Math.max(min, value - step);
    onChange(newVal);
  };

  const sizes = {
    sm: 'h-10 text-lg',
    md: 'h-14 text-2xl',
    lg: 'h-20 text-4xl',
  };

  const buttonSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={decrement}
        className={cn(
          'flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-2xl font-bold',
          buttonSizes[size]
        )}
      >
        -
      </button>
      <div className="flex-1 relative">
        <input
          type="number"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className={cn(
            'w-full bg-zinc-800 rounded-xl text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary-500',
            sizes[size]
          )}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
            {unit}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={increment}
        className={cn(
          'flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-2xl font-bold',
          buttonSizes[size]
        )}
      >
        +
      </button>
    </div>
  );
}
