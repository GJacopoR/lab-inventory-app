import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  /** Destination route – if omitted the card is not clickable */
  to?: string;
  /** Title displayed prominently */
  title: string;
  /** Short description under the title */
  description: string;
  /** Optional extra class names */
  className?: string;
  /** Visual variant – primary for the emphasized tile, secondary for the others */
  variant?: 'primary' | 'secondary';
}

/**
 * Visual card used on the dashboard. Supports an optional `to` prop – when present the card renders as a `<Link>`
 * with hover lift, subtle shadow and a cursor pointer.
 */
export const Card: React.FC<CardProps> = ({ to, title, description, className = '', variant = 'secondary' }) => {
  // Base tile styling – shared between variants, with dark mode support
  const base =
    'p-4 md:p-6 bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 transition-all duration-200 hover:shadow-md hover:-translate-y-1';

  // Variant‑specific classes
  const variantClasses = {
    primary: 'shadow-md border-l-4 border-primary-600', // subtle shadow + left accent
    secondary: 'shadow-sm border-t-4 border-accent-400', // lighter shadow + top accent for secondary tiles
  }[variant];

  const content = (
    <>
      <h2 className={`text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2`}>{title}</h2>
      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{description}</p>
    </>
  );

  const classes = `${base} ${variantClasses} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
};
