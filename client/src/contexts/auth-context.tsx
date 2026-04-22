'use client';

import { onUnauthorized } from '@/services/api';
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
  login: (user: User, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

const USER_KEY = 'user';
const TOKEN_KEY = 'access_token';
const EXPIRY_CHECK_INTERVAL_MS = 60_000;

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
  return localStorage.getItem(USER_KEY);
}

function getAuthServerSnapshot(): string | null {
  return null;
}

// Returns payload.exp (seconds since epoch) if token is a well-formed JWT, else null.
function parseTokenExp(token: string | null): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string | null): boolean {
  const exp = parseTokenExp(token);
  if (exp === null) return true;
  return Date.now() >= exp * 1000;
}

function clearAuthStorage() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot,
  );
  const user = raw ? (JSON.parse(raw) as User) : null;

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration flag
    setHydrated(true);
  }, []);
  const loading = !hydrated;

  const login = useCallback((u: User, accessToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    notifyAuthListeners();
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    notifyAuthListeners();
  }, []);

  // Expiry enforcement: check on hydrate + periodically + on 401 from api
  useEffect(() => {
    const checkExpiry = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token && !localStorage.getItem(USER_KEY)) return;
      if (isTokenExpired(token)) {
        clearAuthStorage();
        notifyAuthListeners();
      }
    };

    checkExpiry();
    const id = setInterval(checkExpiry, EXPIRY_CHECK_INTERVAL_MS);

    onUnauthorized(() => {
      clearAuthStorage();
      notifyAuthListeners();
    });

    return () => {
      clearInterval(id);
      onUnauthorized(null);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
