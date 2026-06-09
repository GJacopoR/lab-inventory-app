import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionContainer } from '../components/ui/SectionContainer';
import { Button } from '../components/ui/Button';
import { userRepo } from '../repositories/userRepo';
import { useAuth } from '../auth/AuthContext';
import bcrypt from 'bcryptjs';
import { AnimatedPage } from '../components/ui/PageHeader';

/**
 * Login screen with role-based seeded users.
 * Credentials: username = role name (admin/operatore/lettura), password = "password"
 */
const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await userRepo.getByUsername(username);
      if (!user) {
        throw new Error('Utente non trovato');
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Password non valida');
      }
      login(user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <main className="min-h-screen flex items-center justify-center px-4 relative">
        {/* Background image placeholder with overlay - gracefully degrades if no image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}inventoryBg.avif)`,
            backgroundColor: '#f9fafb', // Fallback color matching light theme
          }}
          aria-hidden="true"
        >
          {/* Soft overlay for text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <SectionContainer className="relative max-w-md mx-auto bg-white dark:bg-brand-800 rounded-xl border border-gray-200 dark:border-brand-700 shadow-lg p-8 ring-2 ring-brand-500/20">
          <h1 className="text-4xl font-bold text-brand-900 dark:text-brand-100 mb-4 text-center">Lab Inventory PWA</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Accedi con le tue credenziali.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-red-600 dark:text-red-400 mb-2" role="alert">{error}</p>}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="admin, operatore, o lettura"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-brand-600 rounded-xl bg-white dark:bg-brand-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                placeholder="password"
                required
                disabled={loading}
              />
            </div>
            <Button onClick={handleLogin} disabled={loading} block>
              {loading ? 'Caricamento…' : 'Entra'}
            </Button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            Utenti demo: <strong>admin</strong>, <strong>operatore</strong>, <strong>lettura</strong> (password: <strong>password</strong>)
          </p>
        </SectionContainer>
      </main>
    </AnimatedPage>
  );
};

export default Login;