/**
 * Restaura la navegación cuando hay sesión persistida al abrir la app.
 * Evita pasar por bienvenida/login si el token sigue válido en AsyncStorage.
 */
import { useEffect, useRef } from 'react';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from './navigationRef';

export default function AuthNavigationSync() {
  const { user, loading } = useAuth();
  const didRestore = useRef(false);

  useEffect(() => {
    if (loading || didRestore.current || !user) return;

    const tryRestore = () => {
      if (didRestore.current || !navigationRef.isReady()) return false;
      didRestore.current = true;
      navigationRef.reset({
        index: 0,
        routes: [{ name: ROUTES.MAIN_TABS }],
      });
      return true;
    };

    if (tryRestore()) return undefined;

    const intervalId = setInterval(() => {
      if (tryRestore()) clearInterval(intervalId);
    }, 50);

    return () => clearInterval(intervalId);
  }, [loading, user]);

  return null;
}
