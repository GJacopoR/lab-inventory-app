import React from 'react';

interface SectionContainerProps {
  /** Content placed inside the container */
  children: React.ReactNode;
  /** Optional extra class names */
  className?: string;
}

/**
 * Generic white card used to frame sections (login card, page bodies, etc.).
 * Uses a subtle drop‑shadow and rounded corners to look like a material surface.
 */
export const SectionContainer: React.FC<SectionContainerProps> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-brand-800 rounded-xl md:rounded-2xl shadow-md border border-gray-200 dark:border-brand-700 p-4 md:p-6 lg:p-8 ${className}`}>{children}</div>
);
