import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type UserRole = 'admin' | 'employee' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  userName: string;
  userEmail: string;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('pos_auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth) as {
          isAuthenticated: boolean;
          role: UserRole;
          userName: string;
          userEmail?: string;
        };
        if (parsed.isAuthenticated && parsed.role) {
          setIsAuthenticated(true);
          setRole(parsed.role);
          setUserName(parsed.userName);
          setUserEmail(parsed.userEmail ?? '');
        }
      } catch {
      }
    }
    setIsReady(true);
  }, []);

  const login = (email: string, _password: string, selectedRole: UserRole) => {
    setIsAuthenticated(true);
    setRole(selectedRole);
    const name = email.split('@')[0];
    setUserName(name);
    setUserEmail(email);
    localStorage.setItem(
      'pos_auth',
      JSON.stringify({
        isAuthenticated: true,
        role: selectedRole,
        userName: name,
        userEmail: email,
      }),
    );
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUserName('');
    setUserEmail('');
    localStorage.removeItem('pos_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, userName, userEmail, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
