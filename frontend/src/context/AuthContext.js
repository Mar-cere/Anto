/**
 * Contexto de autenticación y sesión persistente.
 *
 * Flujo de sesión:
 * 1. Inicio (mount): Se lee AsyncStorage (userToken, userData). Si existen, se valida
 *    contra /api/users/me (con refresh automático si el access token expiró).
 * 2. Login: Se llama a api.login (config/api), que guarda token, refreshToken y user.
 * 3. Logout: Se llama a api.logout (limpia AsyncStorage) y setUser(null).
 * 4. refreshSession(): Valida sesión remota o lee userData tras login/register externo.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ENDPOINTS, login as apiLogin, logout as apiLogout } from '../config/api';
import { updateUser as updateUserService } from '../services/userService';
import {
  AUTH_STORAGE_KEYS,
  clearAuthSession,
  registerOnSessionInvalidated,
} from '../utils/authTokenRefresh';

const STORAGE_KEYS = AUTH_STORAGE_KEYS;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Valida la sesión remota (con refresh automático) y sincroniza user en contexto.
   */
  const refreshSession = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (!token) {
        setUser(null);
        return;
      }
      const me = await api.get(ENDPOINTS.ME);
      if (me && typeof me === 'object' && (me._id || me.id)) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(me));
        setUser(me);
        return;
      }
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      setUser(userData ? JSON.parse(userData) : null);
    } catch (e) {
      console.warn('[AuthContext] Error restaurando sesión:', e);
      await clearAuthSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    registerOnSessionInvalidated(() => setUser(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }
        const me = await api.get(ENDPOINTS.ME);
        if (cancelled) return;
        if (me && typeof me === 'object' && (me._id || me.id)) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(me));
          setUser(me);
        } else {
          const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
          setUser(userData ? JSON.parse(userData) : null);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[AuthContext] Error cargando sesión al iniciar:', e);
          await clearAuthSession();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await apiLogin(credentials);
    if (result.success && result.data?.user) {
      setUser(result.data.user);
    }
    return result;
  }, []);

  const register = useCallback(async () => {
    // El flujo de registro lo gestionan RegisterScreen/VerifyEmail; tras guardar token+user en AsyncStorage llaman refreshSession().
    return null;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback(async (userId, data) => {
    const response = await updateUserService(userId, data);
    if (response) setUser((prev) => (prev ? { ...prev, ...response } : response));
    return response;
  }, []);

  /**
   * Aplica un snapshot de usuario tras PUT /me (evita GET /me con caché obsoleta).
   */
  const applyLocalUser = useCallback(async (userSnapshot) => {
    if (!userSnapshot || typeof userSnapshot !== 'object') return;
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userSnapshot));
    setUser(userSnapshot);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshSession,
    applyLocalUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
