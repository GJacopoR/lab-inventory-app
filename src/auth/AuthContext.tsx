import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { User } from '../models';

/** Role hierarchy: lettura < operatore < admin */
export type Role = 'lettura' | 'operatore' | 'admin';

/** Capability definitions */
export interface Capabilities {
  /** Can read any page except Settings */
  canRead: boolean;
  /** Can create entities */
  canCreate: boolean;
  /** Can modify entities */
  canEdit: boolean;
  /** Can delete entities */
  canDelete: boolean;
  /** Can access Settings page */
  canAccessSettings: boolean;
  /** Can print labels */
  canPrintLabels: boolean;
}

/** Map roles to capabilities */
const roleCapabilities: Record<Role, Capabilities> = {
  lettura: {
    canRead: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAccessSettings: false,
    canPrintLabels: true,
  },
  operatore: {
    canRead: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canAccessSettings: false,
    canPrintLabels: true,
  },
  admin: {
    canRead: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canAccessSettings: true,
    canPrintLabels: true,
  },
};

interface AuthContextProps {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  /** Current user's role (derived from user) */
  role: Role | null;
  /** Current user's capabilities (derived from role) */
  capabilities: Capabilities;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (u: User) => setUser(u);
  const logout = () => setUser(null);

  const role = useMemo(() => user?.role ?? null, [user]);

  const capabilities = useMemo(() => {
    if (!role) return {
      canRead: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canAccessSettings: false,
      canPrintLabels: false,
    };
    return roleCapabilities[role];
  }, [role]);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    role,
    capabilities,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

/** Hook for role-based access control */
export const useCapabilities = () => {
  const { capabilities } = useAuth();
  return capabilities;
};