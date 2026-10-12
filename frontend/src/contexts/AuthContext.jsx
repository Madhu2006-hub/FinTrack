import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '../api/services';
import { TOKEN_KEY, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [sessionMessage, setSessionMessage] = useState('');

  const logout = useCallback((message = '') => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setSessionMessage(message);
  }, []);

  const persistSession = useCallback((auth) => {
    localStorage.setItem(TOKEN_KEY, auth.token);
    setToken(auth.token);
    setUser(auth.user);
    setSessionMessage('');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout('Your session has expired. Please sign in again.'));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // After a page refresh the token survives but the profile does not, so reload it.
  useEffect(() => {
    if (token && !user) {
      authApi.me().then(setUser).catch(() => {
        // A 401 already logged out through the interceptor. Other errors keep the session.
      });
    }
  }, [token, user]);

  const login = useCallback(async (email, password) => {
    const auth = await authApi.login({ email, password });
    persistSession(auth);
    return auth.user;
  }, [persistSession]);

  const register = useCallback(async (name, email, password, countryCode, currencyCode) => {
    const auth = await authApi.register({ name, email, password, countryCode, currencyCode });
    persistSession(auth);
    return auth.user;
  }, [persistSession]);

  /** Update the user's country and currency preferences. */
  const updatePreferences = useCallback(async (countryCode, currencyCode) => {
    const updatedUser = await userApi.updatePreferences({ countryCode, currencyCode });
    setUser(updatedUser);
    return updatedUser;
  }, []);

  /** Convenience getter for the user's preferred currency code (defaults to USD). */
  const currencyCode = user?.currencyCode || 'USD';

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    sessionMessage,
    currencyCode,
    login,
    register,
    logout,
    updatePreferences,
  }), [token, user, sessionMessage, currencyCode, login, register, logout, updatePreferences]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const defaultAuthContext = {
  token: null,
  user: null,
  currencyCode: 'USD',
  sessionMessage: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updatePreferences: async () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}
