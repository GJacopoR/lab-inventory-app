import React from 'react';

interface PageHeaderProps {
  /** Main title */
  title: string;
  /** Optional subtitle displayed under the title */
  subtitle?: string;
  /** Optional extra class names */
  className?: string;
}

/** Consistent heading style for all pages */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, className = '' }) => (
  <header className={`mb-8 ${className}`}>
    <h1 className="text-4xl font-bold text-primary-800 mb-2">{title}</h1>
    {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
  </header>
);
