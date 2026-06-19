/**
 * Pantalla principal del dashboard
 * 
 * Muestra el panel principal con saludo, foco del día, tareas, hábitos,
 * herramientas TCC, diario y accesos a patrones. Incluye pull-to-refresh
 * y manejo de errores.
 * 
 * @author AntoApp Team
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DashboardScroll from '../components/DashboardScroll';
import EmergencyContactsModal from '../components/EmergencyContactsModal';
import FloatingNavBar from '../components/FloatingNavBar';
import websocketService from '../services/websocketService';
import FirstSessionHint, { isFirstSessionHintDismissed } from '../components/FirstSessionHint';
import OnboardingQuestions from '../components/OnboardingQuestions';
import OnboardingTutorial, { isTutorialCompleted } from '../components/OnboardingTutorial';
import TutorialHighlight from '../components/TutorialHighlight';
import DashboardHomeHeader from '../components/dashboard/DashboardHomeHeader';
import DashboardBrandBackdrop from '../components/dashboard/DashboardBrandBackdrop';
import MoodCheckInCard from '../components/dashboard/MoodCheckInCard';
import DashboardRotatingInsightCard from '../components/dashboard/DashboardRotatingInsightCard';
import DashboardStreakHero from '../components/dashboard/DashboardStreakHero';
import DashboardStatsRow from '../components/dashboard/DashboardStatsRow';
import DashboardHabitsSection from '../components/dashboard/DashboardHabitsSection';
import DashboardFocusCard from '../components/DashboardFocusCard';
import { SkeletonBlock, SkeletonCard } from '../components/Skeleton';
import { api, ENDPOINTS } from '../config/api';
import { BORDERS, SPACING, STATUS_BAR } from '../constants/ui';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  computeHabitsActiveThisWeek,
  getActiveHabitsForDashboard,
  getDashboardDisplayName,
  resolveDashboardStreakDays,
} from '../utils/dashboardHomeUtils';
import { areNotificationsEnabled, registerForPushNotifications, requestNotificationPermissions } from '../services/pushNotificationService';
import paymentService from '../services/paymentService';
import TrialBanner from '../components/TrialBanner';
import OfflineBanner from '../components/OfflineBanner';
import NotificationsPromptBanner from '../components/NotificationsPromptBanner';
import { useTheme } from '../context/ThemeContext';
import {
  computeNextPromptAt,
  getNotificationsPromptNextAtKey,
  getNotificationsPromptVisitsKey,
  shouldShowNotificationsPrompt,
} from '../utils/notificationsPromptPolicy';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';
import { STORAGE_KEYS as CHAT_STORAGE_KEYS } from './chat/chatScreenConstants';
import { setFirstSessionHintDismissed } from '../utils/firstSessionHintStorage';
import { markTutorialCompleted } from '../utils/tutorialStorage';
import { buildFocusNextTaskNavParams } from '../utils/focusNextTaskNavigation';
import { buildFocusNextHabitNavParams } from '../utils/focusNextHabitNavigation';
import { useSectionTranslations } from '../hooks/useTranslations';

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  EMERGENCY_CONTACTS_SKIPPED: 'emergencyContactsSkipped',
  NOTIFICATIONS_PROMPT_DISMISSED_PREFIX: 'notificationsPromptDismissed:', // legacy (migración)
};

const DashScreen = () => {
  const DASH = useSectionTranslations('DASH');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeAreaRoot: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safeAreaMain: {
          flex: 1,
          backgroundColor: 'transparent',
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centerContent: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          color: colors.textSecondary,
          fontSize: 18,
          marginTop: SPACING.LOADING_TEXT_MARGIN_TOP,
        },
        skeletonScreen: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        skeletonHeader: {
          marginBottom: 18,
        },
        skeletonHeaderLine: {
          marginTop: 10,
        },
        skeletonCard: {
          marginBottom: 20,
        },
        errorContainer: {
          alignSelf: 'stretch',
          backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.12)',
          borderRadius: 22,
          padding: SPACING.ERROR_PADDING,
          marginBottom: SPACING.ERROR_MARGIN_BOTTOM,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.dangerBorder ?? 'rgba(255, 107, 107, 0.35)',
        },
        errorText: {
          color: colors.text,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: SPACING.ERROR_TEXT_MARGIN_BOTTOM,
        },
        errorButtonsContainer: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
        },
        errorButtonText: {
          color: colors.text,
          fontSize: 14,
        },
        errorButton: {
          paddingHorizontal: SPACING.ERROR_BUTTON_PADDING_HORIZONTAL,
          paddingVertical: SPACING.ERROR_BUTTON_PADDING_VERTICAL,
          borderRadius: BORDERS.ERROR_BUTTON_RADIUS,
          backgroundColor: colors.glassFill ?? 'rgba(255, 255, 255, 0.2)',
          marginLeft: SPACING.ERROR_BUTTON_MARGIN_LEFT,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassOutline ?? colors.border ?? 'rgba(255,255,255,0.14)',
        },
      }),
    [colors],
  );

  const ErrorMessage = useCallback(
    ({ message, onRetry, onDismiss }) => (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {DASH.ERROR_PREFIX}
          {message}
        </Text>
        <View style={styles.errorButtonsContainer}>
          {onRetry ? (
            <TouchableOpacity style={styles.errorButton} onPress={onRetry}>
              <Text style={styles.errorButtonText}>{DASH.RETRY}</Text>
            </TouchableOpacity>
          ) : null}
          {onDismiss ? (
            <TouchableOpacity style={styles.errorButton} onPress={onDismiss}>
              <Text style={styles.errorButtonText}>{DASH.DISMISS}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    ),
    [styles, DASH],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [togglingHabitId, setTogglingHabitId] = useState(null);
  const [showEmergencyContactsModal, setShowEmergencyContactsModal] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [hasCheckedEmergencyContacts, setHasCheckedEmergencyContacts] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedTutorial, setHasCheckedTutorial] = useState(false);
  const [showFirstSessionHint, setShowFirstSessionHint] = useState(false);
  const [showOnboardingQuestions, setShowOnboardingQuestions] = useState(false);
  const [highlightElement, setHighlightElement] = useState(null);
  const [trialInfo, setTrialInfo] = useState(null);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [, setEmergencyAlertNotification] = useState(null);
  const [showNotificationsPrompt, setShowNotificationsPrompt] = useState(false);
  const [notificationsPromptSuppressed, setNotificationsPromptSuppressed] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [dashVisitsCount, setDashVisitsCount] = useState(0);
  const [focusPayload, setFocusPayload] = useState(null);
  const dashFirstFocusRef = useRef(true);
  const hasCountedDashVisitRef = useRef(false);
  const tutorialShouldOpenChatRef = useRef(false);
  const onboardingOverlayStateRef = useRef({
    showTutorial: false,
    showOnboardingQuestions: false,
    showFirstSessionHint: false,
  });

  // Log cuando showTutorial cambia (solo en desarrollo)
  React.useEffect(() => {
    if (__DEV__) {
      console.log('🎬 showTutorial cambió a:', showTutorial);
    }
  }, [showTutorial]);

  useEffect(() => {
    onboardingOverlayStateRef.current = {
      showTutorial,
      showOnboardingQuestions,
      showFirstSessionHint,
    };
  }, [showTutorial, showOnboardingQuestions, showFirstSessionHint]);

  const checkEmergencyContacts = useCallback(async (currentUserData = null) => {
    try {
      const skipped = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS_SKIPPED);
      if (skipped === 'true') {
        setHasCheckedEmergencyContacts(true);
        return;
      }

      const response = await api.get(ENDPOINTS.EMERGENCY_CONTACTS);
      const contacts = response.contacts || [];
      setEmergencyContacts(contacts);
      setHasCheckedEmergencyContacts(true);

      if (contacts.length === 0) {
        const userDataToCheck = currentUserData || userData;
        const userCreatedAt = userDataToCheck?.createdAt ? new Date(userDataToCheck.createdAt) : null;
        const isNewUser =
          userCreatedAt && Date.now() - userCreatedAt.getTime() < 24 * 60 * 60 * 1000;
        setIsFirstTimeUser(isNewUser || false);

        setTimeout(() => {
          const blocker = onboardingOverlayStateRef.current;
          if (blocker.showTutorial || blocker.showOnboardingQuestions || blocker.showFirstSessionHint) {
            return;
          }
          setShowEmergencyContactsModal(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Error verificando contactos de emergencia:', error);
      const skipped = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS_SKIPPED);
      if (skipped !== 'true') {
        setEmergencyContacts([]);
        setHasCheckedEmergencyContacts(true);
        setTimeout(() => {
          const blocker = onboardingOverlayStateRef.current;
          if (blocker.showTutorial || blocker.showOnboardingQuestions || blocker.showFirstSessionHint) {
            return;
          }
          setShowEmergencyContactsModal(true);
        }, 1500);
      } else {
        setHasCheckedEmergencyContacts(true);
      }
    }
  }, [userData]);

  const handleEmergencyContactsSaved = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.EMERGENCY_CONTACTS_SKIPPED);
    } catch (error) {
      console.error('Error limpiando estado de omisión:', error);
    }
    await checkEmergencyContacts();
  }, [checkEmergencyContacts]);

  // Función para cargar datos
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && refreshing) return;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('SignIn');
        return;
      }

      // Cargar datos en paralelo usando api helper
      const [userData, tasks, habits, focusRes] = await Promise.all([
        api.get(ENDPOINTS.ME).catch(() => {
          setError(DASH.ERROR_USER);
          return {};
        }),
        api.get(ENDPOINTS.TASKS).catch(() => {
          setError(DASH.ERROR_TASKS);
          return [];
        }),
        api.get(ENDPOINTS.HABITS).catch(() => {
          setError(DASH.ERROR_HABITS);
          return [];
        }),
        api.get(ENDPOINTS.SUMMARY_FOCUS).catch(() => null)
      ]);

      if (focusRes && typeof focusRes === 'object' && focusRes.notModified === true) {
        /* mantener foco anterior */
      } else if (
        focusRes &&
        typeof focusRes === 'object' &&
        focusRes.success &&
        focusRes.data
      ) {
        setFocusPayload(focusRes.data);
      } else {
        setFocusPayload(null);
      }

      // Actualizar estados
      setUserData(userData || {});
      setTasks(Array.isArray(tasks) ? tasks : []);
      setHabits(Array.isArray(habits) ? habits : []);

      // Conectar WebSocket para notificaciones en tiempo real
      const userId = userData?._id || userData?.id;
      if (userId) {
        await websocketService.connect(userId);
      }

      // Verificar si debe mostrarse el tutorial (solo una vez)
      if (!hasCheckedTutorial) {
        // Obtener userId para hacer el tutorial específico por usuario
        const userId = userData?._id || userData?.id || null;
        
        // Verificar AsyncStorage con userId específico
        const tutorialCompleted = await isTutorialCompleted(userId);
        
        if (__DEV__) {
          console.log('📚 Tutorial completado en AsyncStorage?', tutorialCompleted);
          console.log('👤 UserId:', userId);
        }
        
        // Verificar si es un usuario nuevo (creado en las últimas 24 horas)
        const userCreatedAt = userData?.createdAt ? new Date(userData.createdAt) : null;
        const now = Date.now();
        const createdAtTime = userCreatedAt ? userCreatedAt.getTime() : 0;
        const timeDiff = now - createdAtTime;
        const hoursSinceCreation = timeDiff / (1000 * 60 * 60);
        const isNewUser = userCreatedAt && timeDiff >= 0 && timeDiff < 24 * 60 * 60 * 1000;
        
        if (__DEV__) {
          console.log('👤 Usuario nuevo?', isNewUser);
          console.log('👤 Fecha creación:', userCreatedAt);
          console.log('👤 Tiempo desde creación (horas):', hoursSinceCreation);
        }
        
        // Flujo principal (#16): primero onboarding conversacional.
        // Si no está completado, mostramos preguntas de acompañamiento y luego llevamos al chat.
        if (!tutorialCompleted) {
          if (isNewUser) {
            setIsFirstTimeUser(true);
          }
          setTimeout(() => {
            if (__DEV__) {
              console.log('🧭 Activando onboarding de acompañamiento...');
            }
            setShowOnboardingQuestions(true);
          }, 1000);
        } else {
          // Tutorial ya completado: mostrar hint de primera sesión si no lo cerró
          const hintDismissed = await isFirstSessionHintDismissed(userId);
          if (!hintDismissed) {
            setTimeout(() => setShowFirstSessionHint(true), 800);
          }
        }
        setHasCheckedTutorial(true);
      }

      if (!hasCheckedEmergencyContacts) {
        checkEmergencyContacts(userData);
      }

      // Registrar token push para notificaciones
      try {
        await registerForPushNotifications();
      } catch (error) {
        console.error('Error registrando notificaciones push:', error);
        // No bloquear la carga si falla
      }

      // Cargar información del trial
      try {
        const trialInfoResult = await paymentService.getTrialInfo();
        if (trialInfoResult.success && trialInfoResult.isInTrial) {
          setTrialInfo(trialInfoResult);
        }
      } catch (error) {
        console.error('Error cargando info de trial:', error);
        // No bloquear la carga si falla
      }

      setLoading(false);
      setRefreshing(false);
      setError(null);
    } catch (error) {
      console.error('Error en loadData:', error);
      setError(DASH.ERROR_GENERIC);
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, refreshing, hasCheckedEmergencyContacts, hasCheckedTutorial, checkEmergencyContacts, DASH]);

  const getNotificationsPromptKey = useCallback(() => {
    const userId = userData?._id || userData?.id || 'anon';
    return `${STORAGE_KEYS.NOTIFICATIONS_PROMPT_DISMISSED_PREFIX}${userId}`;
  }, [userData]);
  const getUserId = useCallback(() => (userData?._id || userData?.id || 'anon'), [userData]);

  // Contabilizar "visitas" al dashboard para no mostrar el banner demasiado pronto.
  // Regla: no mostrar hasta la 2ª visita (evita sobrecargar el inicio).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userData) return;
      if (hasCountedDashVisitRef.current) return;
      hasCountedDashVisitRef.current = true;

      try {
        const key = getNotificationsPromptVisitsKey(getUserId());
        const raw = await AsyncStorage.getItem(key);
        const current = Number(raw || '0') || 0;
        const next = current + 1;
        await AsyncStorage.setItem(key, String(next));
        if (!cancelled) setDashVisitsCount(next);
      } catch (_) {
        if (!cancelled) setDashVisitsCount(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userData, getUserId]);

  // Verificar si hay que invitar a activar notificaciones (sin molestar)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Esperar a tener usuario (y evitar overlays durante onboarding)
      if (!userData) return;
      if (showTutorial || showOnboardingQuestions || showEmergencyContactsModal) return;

      try {
        const userId = getUserId();
        const now = Date.now();

        const nextAtRaw = await AsyncStorage.getItem(getNotificationsPromptNextAtKey(userId));
        if (cancelled) return;
        const nextAt = Number(nextAtRaw || '0') || 0;

        const legacyDismissedRaw = await AsyncStorage.getItem(getNotificationsPromptKey());
        if (cancelled) return;
        const legacyDismissed = legacyDismissedRaw === 'true';

        const enabled = await areNotificationsEnabled();
        if (cancelled) return;

        const decision = shouldShowNotificationsPrompt({
          hasUser: true,
          isOverlayBlocking: false,
          dashVisitsCount,
          notificationsEnabled: enabled,
          nextAt,
          legacyDismissed,
          now,
        });

        if (decision.reason === 'legacy-dismissed') {
          const migratedNextAt = now + 3 * 24 * 60 * 60 * 1000;
          await AsyncStorage.setItem(getNotificationsPromptNextAtKey(userId), String(migratedNextAt));
          setNotificationsPromptSuppressed(true);
          setShowNotificationsPrompt(false);
          return;
        }

        const suppressed = decision.reason === 'cooldown' || decision.reason === 'too-early';
        setNotificationsPromptSuppressed(suppressed);
        setShowNotificationsPrompt(decision.show);
      } catch (_e) {
        // Si falla, no mostramos nada (mejor no molestar)
        if (!cancelled) setShowNotificationsPrompt(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    userData,
    showTutorial,
    showOnboardingQuestions,
    showEmergencyContactsModal,
    dashVisitsCount,
    getNotificationsPromptKey,
    getUserId,
  ]);

  const handleNotificationsPromptDismiss = useCallback(async () => {
    setShowNotificationsPrompt(false);
    try {
      const userId = getUserId();
      const nextAt = computeNextPromptAt();
      await AsyncStorage.setItem(getNotificationsPromptNextAtKey(userId), String(nextAt));
      setNotificationsPromptSuppressed(true);
    } catch (_) {
      // noop
    }
  }, [getUserId]);

  const handleEnableNotifications = useCallback(async () => {
    if (enablingNotifications) return;
    setEnablingNotifications(true);
    try {
      const granted = await requestNotificationPermissions();
      if (granted) {
        // Intentar registrar token ahora que hay permisos
        try {
          await registerForPushNotifications();
        } catch (_) {
          // noop
        }
        setShowNotificationsPrompt(false);
        return;
      }

      Alert.alert(
        DASH.NOTIFICATIONS_DISABLED_TITLE,
        DASH.NOTIFICATIONS_DISABLED_MESSAGE,
        [
          { text: DASH.NOTIFICATIONS_DISABLED_CANCEL, style: 'cancel' },
          {
            text: DASH.NOTIFICATIONS_DISABLED_OPEN_SETTINGS,
            onPress: async () => {
              try {
                await Linking.openSettings();
              } catch (_) {
                // noop
              }
            },
          },
        ]
      );
    } finally {
      setEnablingNotifications(false);
    }
  }, [enablingNotifications, DASH]);

  const handleMoodSaved = useCallback(async (saved) => {
    setFocusPayload((prev) => (prev ? { ...prev, dailyMood: saved } : prev));
    try {
      const focusRes = await api.get(ENDPOINTS.SUMMARY_FOCUS);
      if (focusRes?.success && focusRes?.data) {
        setFocusPayload(focusRes.data);
      }
    } catch (_) {
      /* noop */
    }
  }, []);

  const goToChatFromOnboarding = useCallback(async () => {
    await setChatEntryBackTarget('dash');
    const state = navigation.getState?.();
    if (state?.type === 'tab') {
      navigation.navigate('Chat');
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Chat' });
  }, [navigation]);

  const openBehavioralActivationFromFocus = useCallback((slotId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const trimmed = slotId ? String(slotId).trim() : '';
    navigation.navigate(
      'BehavioralActivation',
      trimmed ? { openWeekSlotId: trimmed } : undefined,
    );
  }, [navigation]);

  const openExposureFromFocus = useCallback((planId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const trimmed = planId ? String(planId).trim() : '';
    navigation.navigate(
      'ExposureHierarchy',
      trimmed ? { openPlanId: trimmed, mode: 'practice' } : { mode: 'practice' },
    );
  }, [navigation]);

  const openNextTaskFromFocus = useCallback((nextTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Tasks', {
      ...buildFocusNextTaskNavParams(nextTask),
      focusOpenToken: Date.now(),
    });
  }, [navigation]);

  const openNextHabitFromFocus = useCallback((nextHabit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Tasks', buildFocusNextHabitNavParams(nextHabit));
  }, [navigation]);

  const refreshHomeDataOnFocus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const [userDataRes, tasksRes, habitsRes, focusRes] = await Promise.all([
        api.get(ENDPOINTS.ME).catch(() => null),
        api.get(ENDPOINTS.TASKS).catch(() => null),
        api.get(ENDPOINTS.HABITS).catch(() => null),
        api.get(ENDPOINTS.SUMMARY_FOCUS).catch(() => null),
      ]);
      if (userDataRes && typeof userDataRes === 'object') {
        setUserData(userDataRes);
      }
      if (Array.isArray(tasksRes)) setTasks(tasksRes);
      if (Array.isArray(habitsRes)) setHabits(habitsRes);
      if (focusRes?.success && focusRes?.data) {
        setFocusPayload(focusRes.data);
      }
    } catch (_) {
      /* pull-to-refresh sigue disponible */
    }
  }, []);

  const openConversationFromFocus = useCallback(
    async (conversationId) => {
      if (!conversationId) return;
      const cid = String(conversationId);
      try {
        await AsyncStorage.setItem(CHAT_STORAGE_KEYS.CONVERSATION_ID, cid);
      } catch (_) {
        /* noop */
      }
      const state = navigation.getState?.();
      if (state?.type === 'tab') {
        navigation.navigate('Chat', { openConversationId: cid });
        return;
      }
      navigation.navigate('MainTabs', { screen: 'Chat', params: { openConversationId: cid } });
    },
    [navigation]
  );

  // Manejar finalización del tutorial
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    if (tutorialShouldOpenChatRef.current) {
      tutorialShouldOpenChatRef.current = false;
      setTimeout(() => {
        goToChatFromOnboarding();
      }, 250);
    }
  }, [goToChatFromOnboarding]);

  // Al cerrar las preguntas de onboarding (omitir o enviar), mostrar hint "Empezar chat"
  const handleOnboardingQuestionsDismiss = useCallback(async () => {
    setShowOnboardingQuestions(false);
    await goToChatFromOnboarding();
  }, [goToChatFromOnboarding]);

  const handleOnboardingQuestionsCompleted = useCallback(async () => {
    const userId = userData?._id || userData?.id || null;
    if (!userId) return;
    await markTutorialCompleted(userId);
    await setFirstSessionHintDismissed(userId);
  }, [userData]);

  const handleExploreAppTutorial = useCallback(() => {
    setShowOnboardingQuestions(false);
    tutorialShouldOpenChatRef.current = true;
    setShowTutorial(true);
  }, []);

  // Manejar el dismiss del banner de trial
  const handleTrialBannerDismiss = useCallback(() => {
    setTrialBannerDismissed(true);
  }, []);

  // Efecto para carga inicial
  useEffect(() => {
    if (loading) {
      loadData();
    }
  }, [loadData, loading]);

  // Al volver al tab Inicio, refrescar foco/tareas/hábitos (p. ej. tras registrar BA)
  useFocusEffect(
    useCallback(() => {
      if (dashFirstFocusRef.current) {
        dashFirstFocusRef.current = false;
        return undefined;
      }
      let cancelled = false;
      (async () => {
        if (cancelled) return;
        await refreshHomeDataOnFocus();
      })();
      return () => {
        cancelled = true;
      };
    }, [refreshHomeDataOnFocus]),
  );

  // Alertas de emergencia en tiempo real
  useEffect(() => {
    const unsubscribeAlert = websocketService.on('emergency:alert:sent', (data) => {
      setEmergencyAlertNotification(data);
      if (data && !data.isTest) {
        Alert.alert(
          `🚨 ${DASH.EMERGENCY_ALERT_SENT_TITLE}`,
          DASH.EMERGENCY_ALERT_SENT_BODY
            .replace('{successful}', String(data.successfulSends))
            .replace('{total}', String(data.totalContacts)),
          [{ text: DASH.EMERGENCY_ALERT_SENT_OK }]
        );
      }
    });
    const unsubscribeError = websocketService.on('error', (error) => {
      console.error('[DashScreen] Error en WebSocket:', error);
    });
    return () => {
      unsubscribeAlert();
      unsubscribeError();
    };
  }, [DASH]);

  // Limpiar conexión al desmontar
  useEffect(() => {
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const dashboardStats = useMemo(
    () => ({
      streakDays: resolveDashboardStreakDays(focusPayload, habits),
      habitsThisWeek: computeHabitsActiveThisWeek(habits),
    }),
    [habits, focusPayload],
  );

  const hasActiveHabits = useMemo(
    () => getActiveHabitsForDashboard(habits).length > 0,
    [habits],
  );

  const handleHabitToggleUpdate = useCallback(
    async (habitId) => {
      setTogglingHabitId(habitId);
      try {
        await refreshHomeDataOnFocus();
      } finally {
        setTogglingHabitId(null);
      }
    },
    [refreshHomeDataOnFocus],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <DashboardBrandBackdrop />
        <SafeAreaView style={styles.safeAreaRoot} edges={['top', 'left', 'right']}>
        <View style={[styles.skeletonScreen, { flex: 1 }]}>
        <View style={styles.skeletonHeader}>
          <SkeletonBlock width="70%" height={18} radius={10} />
          <SkeletonBlock width="45%" height={14} radius={10} style={styles.skeletonHeaderLine} />
        </View>
        <SkeletonCard style={styles.skeletonCard} />
        <SkeletonCard style={styles.skeletonCard} />
        <SkeletonCard style={styles.skeletonCard} />
        </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBarStyle ?? STATUS_BAR.STYLE} backgroundColor={colors.background} />
      <DashboardBrandBackdrop />
      <SafeAreaView style={styles.safeAreaMain} edges={['top', 'left', 'right']}>
        <OfflineBanner />
        <DashboardHomeHeader userData={userData} />
        <DashboardScroll
          refreshing={refreshing}
          onRefresh={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRefreshing(true);
            loadData(true);
          }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA,
          }}
        >
          {trialInfo && trialInfo.isInTrial && !trialBannerDismissed && (
            <TrialBanner
              variant="compact"
              daysRemaining={trialInfo.daysRemaining}
              hoursRemaining={trialInfo.hoursRemaining}
              onDismiss={handleTrialBannerDismiss}
              dismissed={trialBannerDismissed}
            />
          )}
          <NotificationsPromptBanner
            visible={showNotificationsPrompt && !notificationsPromptSuppressed}
            onEnable={handleEnableNotifications}
            onDismiss={handleNotificationsPromptDismiss}
            enabling={enablingNotifications}
          />
          <MoodCheckInCard
            onMoodSaved={handleMoodSaved}
            displayName={getDashboardDisplayName(userData)}
            syncedMood={focusPayload ? focusPayload.dailyMood : undefined}
            focusFetchDone={!loading}
          />
          <DashboardFocusCard
            data={focusPayload}
            onOpenChat={goToChatFromOnboarding}
            onOpenConversation={openConversationFromFocus}
            onOpenBehavioralActivation={openBehavioralActivationFromFocus}
            onOpenExposureHierarchy={openExposureFromFocus}
            onOpenNextTask={openNextTaskFromFocus}
            onOpenNextHabit={openNextHabitFromFocus}
            onCommitmentsChanged={refreshHomeDataOnFocus}
          />
          <DashboardStreakHero
            streakDays={dashboardStats.streakDays}
            displayName={getDashboardDisplayName(userData)}
            dailyMood={focusPayload?.dailyMood}
            onOpenChat={goToChatFromOnboarding}
            streakOnly
          />
          <DashboardRotatingInsightCard insight={focusPayload?.homeInsight} />
          {hasActiveHabits ? (
            <DashboardStatsRow
              streakDays={dashboardStats.streakDays}
              habitsThisWeek={dashboardStats.habitsThisWeek}
              showHabitsStat
              showStreakStat={false}
            />
          ) : null}
          {hasActiveHabits ? (
            <DashboardHabitsSection
              habits={habits}
              togglingId={togglingHabitId}
              onUpdate={handleHabitToggleUpdate}
            />
          ) : null}
          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => loadData(true)}
              onDismiss={() => setError(null)}
            />
          )}
        </DashboardScroll>
      </SafeAreaView>
      <FloatingNavBar activeTab="home" accessibilityLabel={DASH.NAVBAR_LABEL} />
      
      {/* Overlay de resaltado para el tutorial */}
      <TutorialHighlight
        highlightElement={highlightElement}
        visible={showTutorial}
      />

      {/* Tutorial de onboarding */}
      <OnboardingTutorial
        visible={showTutorial}
        onComplete={handleTutorialComplete}
        onHighlightChange={setHighlightElement}
        userId={userData?._id || userData?.id || null}
      />

      {/* Preguntas iniciales para personalizar el chat (tras tutorial) */}
      <OnboardingQuestions
        visible={showOnboardingQuestions}
        onDismiss={handleOnboardingQuestionsDismiss}
        onCompleted={handleOnboardingQuestionsCompleted}
        onExploreApp={handleExploreAppTutorial}
      />

      {/* Hint de objetivo de primera sesión (tras onboarding) */}
      <FirstSessionHint
        visible={showFirstSessionHint}
        onDismiss={() => setShowFirstSessionHint(false)}
        userId={userData?._id || userData?.id || null}
      />

      <EmergencyContactsModal
        visible={showEmergencyContactsModal}
        onClose={() => setShowEmergencyContactsModal(false)}
        onSave={handleEmergencyContactsSaved}
        existingContacts={emergencyContacts}
        isFirstTime={isFirstTimeUser}
      />

    </View>
  );
};

export default memo(DashScreen);