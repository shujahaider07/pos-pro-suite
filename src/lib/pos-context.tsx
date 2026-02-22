import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'admin' | 'employee' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  userName: string;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');

  const login = (email: string, _password: string, selectedRole: UserRole) => {
    setIsAuthenticated(true);
    setRole(selectedRole);
    setUserName(email.split('@')[0]);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUserName('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
