/**
 * Minimal polished entry screen.
 * Shows the application title and a short subtitle confirming the shell works.
 * All text is Italian‑friendly as requested.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import Documents from './pages/Documents';
import Labels from './pages/Labels';
import RecipeDetail from './pages/RecipeDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthenticatedShell } from './components/ui/AuthenticatedShell';
import { useAuth } from './auth/AuthContext';

/**
 * Root component – sets up auth provider and routing.
 */
const PublicRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
};

const App: React.FC = () => (
  <AuthProvider>
    <Routes>
      {/* Public login route */}
      <Route path="/" element={<PublicRoute />} />

      {/* Protected layout – all inner routes share AuthenticatedShell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/labels" element={<Labels />} />
        </Route>
      </Route>

      {/* Catch‑all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AuthProvider>
);

export default App;
