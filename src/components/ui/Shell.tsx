import React from 'react';
import clsx from 'clsx';

/**
 * Simple layout primitive used by the bootstrap screen (and later pages).
 * It provides a centered container with generous padding and a maximum width
 * that feels premium on desktop, tablet and mobile.
 */
export const Shell: React.FC<React.PropsWithChildren<{
  className?: string;
}>> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-brand-800',
        'px-4 py-8 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div className="max-w-3xl w-full space-y-6 text-center">
        {children}
      </div>
    </div>
  );
};
