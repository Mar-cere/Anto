/**
 * Contexto de autenticación y sesión persistente.
 *
 * Flujo de sesión:
 * 1. Inicio (mount): Se lee AsyncStorage (userToken, userData). Si existen ambos,
 *    se restaura user en estado → sesión persistente. Si no, user = null.
 * 2. Login: Se llama a api.login (config/api), que guarda token y user en AsyncStorage.
 *    On success se hace setUser(data.user). Las pantallas que hacen login por su cuenta
 *    (ej. SignIn con api.post + saveAuthData) deben llamar refreshSession() después
 *    para sincronizar el contexto.
 * 3. Logout: Se llama a api.logout (limpia AsyncStorage) y setUser(null).
 * 4. refreshSession(): Lee userData de AsyncStorage y actualiza user. Útil tras
 *    login/register hechos fuera del contexto (ej. SignInScreen, RegisterScreen).
 *
 * Persistencia: userToken y userData en AsyncStorage (mismas claves que config/api y
 * pantallas de auth). Una sola fuente de verdad en memoria (user) y en disco (AsyncStorage).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as apiLogin, logout as apiLogout } from '../config/api';
import { updateUser as updateUserService } from '../services/userService';

const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Restaura el usuario desde AsyncStorage (userData).
   * Se usa en el init y cuando otra pantalla ha guardado sesión (login/register).
   */
  const refreshSession = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (token && userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('[AuthContext] Error restaurando sesión:', e);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (!cancelled) {
          if (token && userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[AuthContext] Error cargando sesión al iniciar:', e);
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

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshSession,
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
