import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useCapabilities } from '../../auth/AuthContext';
import { OfflineIndicator } from './OfflineIndicator';
import { UpdatePrompt } from './UpdatePrompt';
import { Button } from './Button';

/**
 * Shared layout for all authenticated pages.
 * Features:
 * - Sidebar navigation (collapses to top bar on mobile)
 * - Theme toggle (light/dark)
 * - Responsive design
 * - Offline connectivity awareness
 * - Role-based navigation filtering
 * - Mobile nav closes on outside click / Escape key
 */
export const AuthenticatedShell: React.FC = () => {
  const { user, logout } = useAuth();
  const capabilities = useCapabilities();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close mobile nav on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileNavOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileNavOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileNavOpen]);

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

  // All nav items with their Settings access requirement
  const allNavItems = [
    // { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/inventory', label: 'Inventario', icon: '📦' },
    { to: '/recipes', label: 'Ricette', icon: '🍰' },
    { to: '/documents', label: 'Documenti', icon: '📄' },
    { to: '/labels', label: 'Etichette', icon: '🏷️' },
    { to: '/settings', label: 'Impostazioni', icon: '⚙️', requiresSettings: true },
  ];

  // Filter nav items by role permissions
  const navItems = allNavItems.filter(item => {
    if (item.requiresSettings && !capabilities.canAccessSettings) {
      return false;
    }
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-brand-900">
      {/* Mobile header - only on mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-brand-800 border-b border-gray-200 dark:border-brand-700 fixed w-full top-0 z-30">
        <h1 className="text-lg font-bold text-brand-900 dark:text-white" onClick={() => navigate('/')}>
          Lab Inventory
        </h1>
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
            aria-expanded={mobileNavOpen}
          >
            ☰
          </button>
        </div>
      </header>

      <div ref={navRef}>
        {mobileNavOpen && (
          <nav className="md:hidden bg-white dark:bg-brand-800 border-b border-gray-200 dark:border-brand-700 fixed w-full top-16 shadow-lg animate-slide-down z-20">
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
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start"
                aria-label="Esci"
              >
                <span className="mr-2" aria-hidden="true">🚪</span>
                Esci
              </Button>
            </div>
          </nav>
        )}
      </div>

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
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full mt-2 justify-start"
            aria-label="Esci"
          >
            <span className="mr-2" aria-hidden="true">🚪</span>
            Esci
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 mt-16 overflow-y-auto">
        <OfflineIndicator />
        <UpdatePrompt />
        <Outlet />
      </main>
    </div>
  );
};