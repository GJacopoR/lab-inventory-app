import React from 'react';
import { NavItem } from './NavItem';

/**
 * Minimal left‑hand navigation rail.
 * Visible on medium screens and up (md:), hidden on smaller devices so the
 * content area keeps full width. The rail only displays the five real sections
 * – Dashboard, Inventario, Ricette, Documenti, Etichette – using the existing
 * NavItem component for active‑state styling.
 */
export const NavigationRail: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/inventory', label: 'Inventario' },
    { to: '/recipes', label: 'Ricette' },
    { to: '/documents', label: 'Documenti' },
    { to: '/labels', label: 'Etichette' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-48 bg-white dark:bg-brand-800 border-r border-gray-200 dark:border-brand-700 p-4">
      {/* Brand logo / name could go here – keep it light */}
      <div className="mb-6 text-center text-brand-900 font-semibold text-lg">
        Lab Inventory
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} />
        ))}
      </nav>
    </aside>
  );
};
