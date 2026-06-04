import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

/**
 * Shared layout for all authenticated pages.
 * Features:
 * - Sidebar navigation (collapses to top bar on mobile)
 * - Theme toggle (light/dark)
 * - Responsive design
 */
export const AuthenticatedShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/inventory', label: 'Inventario', icon: '📦' },
    { to: '/recipes', label: 'Ricette', icon: '🍰' },
    { to: '/documents', label: 'Documenti', icon: '📄' },
    { to: '/labels', label: 'Etichette', icon: '🏷️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-brand-900">
      {/* Mobile header - only on mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-brand-800 border-b border-gray-200 dark:border-brand-700">
        <h1 className="text-lg font-bold text-brand-900 dark:text-white">Lab Inventory</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-700"
            title={theme === 'light' ? 'Tema scuro' : 'Tema chiaro'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-700 text-gray-700 dark:text-gray-300"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </header>

      {mobileNavOpen && (
        <nav className="md:hidden bg-white dark:bg-brand-800 border-b border-gray-200 dark:border-brand-700">
          <div className="flex flex-col p-2 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.to);
                  setMobileNavOpen(false);
                }}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.to)
                    ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-700'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-brand-800 border-r border-gray-200 dark:border-brand-700 p-4 min-h-screen">
        <div className="mb-8 px-3">
          <h1 className="text-xl font-bold text-brand-900 dark:text-white">Lab Inventory</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Gestione magazzino</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.to}
              href={item.to}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.to);
              }}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.to)
                  ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-700'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-brand-700 pt-4 mt-4">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{user?.username}</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-700"
              title={theme === 'light' ? 'Passa all\'scura' : 'Passa alla luce'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-700 rounded-lg"
          >
            Esci
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};