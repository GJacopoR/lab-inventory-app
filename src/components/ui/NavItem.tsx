import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  label: string;
}

/**
 * Navigation link used in the AuthenticatedShell header.
 * Applies active styling (background + left border) and focus ring.
 */
export const NavItem: React.FC<NavItemProps> = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `inline-flex items-center px-2 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-600 ${
        isActive
          ? 'text-brand-900 font-medium border-b-2 border-brand-600'
          : 'text-gray-600 hover:text-brand-900'
      }`
    }
  >
    {label}
  </NavLink>
);
