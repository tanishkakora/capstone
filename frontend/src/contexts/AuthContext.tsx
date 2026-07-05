import React, { createContext, useState, useEffect, useContext } from 'react';

interface UserSession {
  token: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'officer';
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (token: string, email: string, fullName: string, role: 'citizen' | 'officer') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on application load
    const storedUser = localStorage.getItem('smartwaste_session');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored auth session', e);
        localStorage.removeItem('smartwaste_session');
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, email: string, fullName: string, role: 'citizen' | 'officer') => {
    const sessionData: UserSession = { token, email, fullName, role };
    setUser(sessionData);
    localStorage.setItem('smartwaste_session', JSON.stringify(sessionData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartwaste_session');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
