import React from 'react';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  disabled = false,
  className = '',
}) => {
  const decrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const increment = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);
    if (!isNaN(num) && num >= min && (max === undefined || num <= max)) {
      onChange(num);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-brand-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
        aria-label="Decrement"
      >
        -
      </button>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-20 px-2 py-1.5 border border-gray-300 dark:border-brand-600 rounded-lg bg-white dark:bg-brand-700 text-gray-900 dark:text-white text-center font-semibold"
        aria-label="Value"
      />
      {unit && <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>}
      <button
        type="button"
        onClick={increment}
        disabled={disabled || (max !== undefined && value >= max)}
        className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-brand-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
        aria-label="Increment"
      >
        +
      </button>
    </div>
  );
};
