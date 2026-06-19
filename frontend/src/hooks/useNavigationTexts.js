import { useMemo } from 'react';
import { useSectionTranslations } from './useTranslations';

const DEFAULT_NAV_TEXTS = {
  MAIN_TABLIST_A11Y: 'Navegacion principal',
  TAB_HOME_LABEL: 'Inicio',
  TAB_HOME_HINT: 'Ir al inicio',
  TAB_TASKS_LABEL: 'Recordatorios',
  TAB_TASKS_HINT: 'Ver tareas y recordatorios',
  TAB_CHAT_LABEL: 'Chat',
  TAB_CHAT_HINT: 'Abrir el chat',
  TAB_TECHNIQUES_LABEL: 'Técnicas',
  TAB_TECHNIQUES_HINT: 'Abrir técnicas y herramientas',
  TAB_SETTINGS_LABEL: 'Ajustes',
  TAB_SETTINGS_HINT: 'Abrir ajustes',
  HEADER_BACK_LABEL: 'Volver atras',
  HEADER_BACK_HINT: 'Doble toque para volver a la pantalla anterior',
  HEADER_PROFILE_LABEL: 'Ir a perfil',
  HEADER_PROFILE_HINT: 'Doble toque para abrir tu perfil',
  HEADER_DEFAULT_GREETING: 'Bienvenido',
};

export function useNavigationTexts() {
  const translated = useSectionTranslations('NAV');
  return useMemo(
    () => ({ ...DEFAULT_NAV_TEXTS, ...(translated || {}) }),
    [translated]
  );
}

