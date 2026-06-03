import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionContainer } from '../components/ui/SectionContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { userRepo } from '../repositories/userRepo';
import { useAuth } from '../auth/AuthContext';

/**
 * Simple demo login screen.
 * Shows the app title, a subtitle explaining this is a local demo,
 * and a single button that logs in with the first seeded user.
 */
const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Demo user – pick the first seeded user (admin) from the DB.
      const demoUser = await userRepo.getDemoUser();
      if (!demoUser) {
        throw new Error('Nessun utente demo trovato nel database');
      }
      login(demoUser);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Impossibile effettuare il login: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionContainer className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 shadow-lg p-8 ring-2 ring-brand/20">
      <h1 className="text-4xl font-bold text-brand-900 mb-4 text-center">Lab Inventory PWA</h1>
      <p className="text-center text-gray-600 mb-6">
        Accedi per gestire inventario, ricette, documenti ed etichette.
      </p>
      {error && <p className="text-red-600 mb-2" role="alert">{error}</p>}
      <Button onClick={handleLogin} disabled={loading} block>
        {loading ? 'Caricamento…' : 'Entra'}
      </Button>
    </SectionContainer>
  );
};

export default Login;
