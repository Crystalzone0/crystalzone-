import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as authApi from '../services/authApi.js';
import { SESSION_EXPIRED_EVENT, getErrorMessage } from '../services/api.js';

const AuthContext = createContext(null);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the first session answer arrives
  const userRef = useRef(null);
  userRef.current = user;
  const sessionCheckFailed = useRef(false); // the last session check could not reach the server

  // Cached data belonging to a customer (orders, addresses ...) uses query keys starting with 'account'.
  const resetAccountData = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['account'] });
  }, [queryClient]);

  /**
   * Asks the server who is logged in. Returns the user, null (nobody), or undefined (could not find out).
   * Temporary problems (offline, server hiccup, rate limit) are retried, so a flaky connection on the first page
   * load does not make a logged-in customer look logged out.
   */
  const checkSession = useCallback(async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const data = await authApi.getMe();
        sessionCheckFailed.current = false;
        return data.user || null;
      } catch (err) {
        const temporary = Boolean(err.isNetwork) || err.status === 429 || err.status >= 500;
        if (!temporary || attempt >= 2) {
          sessionCheckFailed.current = temporary;
          return undefined;
        }
        // eslint-disable-next-line no-await-in-loop
        await wait(1200 * (attempt + 1));
      }
    }
  }, []);

  // Restore the session (the httpOnly cookie is sent automatically).
  useEffect(() => {
    let active = true;
    checkSession()
      .then((found) => {
        if (active && found !== undefined) setUser(found);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [checkSession]);

  // If the first check failed because the device was offline, check again as soon as the connection returns.
  useEffect(() => {
    const onOnline = () => {
      if (!sessionCheckFailed.current || userRef.current) return;
      checkSession().then((found) => {
        if (found) setUser(found);
      });
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [checkSession]);

  // Any API call answered with 401 while logged in means the session ended.
  useEffect(() => {
    const onExpired = () => {
      if (!userRef.current) return;
      setUser(null);
      resetAccountData();
      toast.error('Your session has expired. Please log in again.');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [resetAccountData]);

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials);
      resetAccountData();
      setUser(data.user);
      toast.success('Login successful');
      return data.user;
    },
    [resetAccountData]
  );

  const adminLogin = useCallback(
    async (credentials) => {
      const data = await authApi.adminLogin(credentials);
      resetAccountData();
      setUser(data.user);
      toast.success('Login successful');
      return data.user;
    },
    [resetAccountData]
  );

  const register = useCallback(
    async (values) => {
      const data = await authApi.register(values);
      resetAccountData();
      setUser(data.user);
      toast.success('Welcome to Crystal Zone! Your account is ready.');
      return data.user;
    },
    [resetAccountData]
  );

  /** Returns true when logged out. If the server could not be reached the user stays logged in. */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    }
    setUser(null);
    resetAccountData();
    toast.success('You have been logged out');
    return true;
  }, [resetAccountData]);

  const updateProfile = useCallback(async (values) => {
    const data = await authApi.updateProfile(values);
    setUser(data.user);
    toast.success('Profile updated');
    return data.user;
  }, []);

  const changePassword = useCallback(async (values) => {
    await authApi.changePassword(values);
    toast.success('Password changed successfully');
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      adminLogin,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, loading, login, adminLogin, register, logout, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}