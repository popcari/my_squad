'use client';

import type { User } from '@/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

const AUTH_KEY = 'user';
let authListeners: Array<() => void> = [];

function notifyAuthListeners() {
  authListeners.forEach((l) => l());
}

function subscribeAuth(listener: () => void) {
  authListeners = [...authListeners, listener];
  return () => {
    authListeners = authListeners.filter((l) => l !== listener);
  };
}

function getAuthSnapshot(): string | null {
  return localStorage.getItem(AUTH_KEY);
}

function getAuthServerSnapshot(): string | null {
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot,
  );
  const user = raw ? (JSON.parse(raw) as User) : null;

  // Track hydration so AuthGuard doesn't redirect to /login before localStorage
  // is readable (useSyncExternalStore returns server snapshot = null on first
  // client render, same as during SSR).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration flag
    setHydrated(true);
  }, []);
  const loading = !hydrated;

  const login = useCallback((u: User) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    notifyAuthListeners();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    notifyAuthListeners();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
