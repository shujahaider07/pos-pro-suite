import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'admin' | 'employee' | null;

interface AuthUser {
  email: string;
  role: UserRole;
  userName: string;
  token?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  userName: string;
  email: string;
  login: (email: string, password: string, role: UserRole, customName?: string) => boolean;
  logout: () => void;
  isBackendConnected: boolean;
  setIsBackendConnected: (connected: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'restopos_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        return !!parsed.role;
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [role, setRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        return parsed.role;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [userName, setUserName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        return parsed.userName || '';
      }
    } catch {
      // ignore
    }
    return '';
  });

  const [email, setEmail] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        return parsed.email || '';
      }
    } catch {
      // ignore
    }
    return '';
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && role) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ email: email || (userName ? `${userName}@resto.com` : ''), role, userName })
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [isAuthenticated, role, userName, email]);

  const login = (userEmail: string, _password: string, selectedRole: UserRole, customName?: string) => {
    const name = customName || userEmail.split('@')[0] || (selectedRole === 'admin' ? 'Admin' : 'Staff');
    setIsAuthenticated(true);
    setRole(selectedRole);
    setUserName(name);
    setEmail(userEmail);
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ email: userEmail, role: selectedRole, userName: name })
    );
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUserName('');
    setEmail('');
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        userName,
        email,
        login,
        logout,
        isBackendConnected,
        setIsBackendConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
