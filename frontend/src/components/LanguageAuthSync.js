/**
 * Sincroniza idioma local con la sesión del usuario (login, restore, actualización de perfil).
 * Debe montarse dentro de AuthProvider y LanguageProvider.
 */
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { applyLanguageFromUser } from '../utils/appLanguage';

export default function LanguageAuthSync() {
  const { user } = useAuth();
  const serverLanguage = user?.preferences?.language;
  const userId = user?._id ?? user?.id;

  useEffect(() => {
    applyLanguageFromUser(user ?? null).catch(() => {});
  }, [userId, serverLanguage]);

  return null;
}
