import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 'primary' (default) uses the brand color, 'secondary' is a neutral button, 'ghost' is text-only */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Optional full‑width style for block buttons */
  block?: boolean;
  /** Children – button label */
  children: React.ReactNode;
}

/**
 * Simple reusable button that respects the app's Tailwind palette.
 * - Primary: solid background using `primary` color.
 * - Secondary: transparent background with a border.
 * - Ghost: text-only with subtle hover.
 * Hover/focus states are provided via Tailwind utilities.
 * Dark mode support included.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  block = false,
  className = '',
  disabled,
  ...rest
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const primaryClasses =
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600';
  const secondaryClasses =
    'bg-white dark:bg-brand-700 border border-gray-300 dark:border-brand-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-600 focus:ring-primary-500';
  const ghostClasses =
    'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-700 focus:ring-primary-500';

  const sizeClasses = 'px-4 py-2 min-h-[2.5rem]';
  const blockClass = block ? 'w-full' : '';

  const getVariantClasses = () => {
    if (variant === 'ghost') return ghostClasses;
    if (variant === 'secondary') return secondaryClasses;
    return primaryClasses;
  };

  const classes = `${baseClasses} ${getVariantClasses()} ${sizeClasses} ${blockClass} ${className}`;

  return <button className={classes} disabled={disabled} {...rest} />;
};
