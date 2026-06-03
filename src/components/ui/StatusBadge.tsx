import React from 'react';

/**
 * Status badge with stronger visual identity.
 * Uses brand/accent colors for better hierarchy and dark mode support.
 */
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variants: Record<string, string> = {
    uploaded: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    processed: 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
    saved: 'bg-accent-100 text-accent-800 dark:bg-accent-800/50 dark:text-accent-200',
    linked: 'bg-accent-200 text-accent-900 dark:bg-accent-700/50 dark:text-accent-100',
    error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  const labelMap: Record<string, string> = {
    uploaded: 'Caricato',
    processed: 'Elaborato',
    saved: 'Salvato',
    linked: 'Collegato',
    error: 'Errore',
  };

  const className = variants[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {labelMap[status] || status}
    </span>
  );
};