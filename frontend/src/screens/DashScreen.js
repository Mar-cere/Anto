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
import {
  mergeFocusResponse,
  shouldRefreshHomeOnFocus,
} from '../utils/dashboardHomeRefresh';
import OnboardingQuestions from '../components/OnboardingQuestions';
import OnboardingTutorial, { isTutorialCompleted } from '../components/OnboardingTutorial';
import TutorialHighlight from '../components/TutorialHighlight';
import DashboardHomeHeader from '../components/dashboard/DashboardHomeHeader';
import DashboardBrandBackdrop from '../components/dashboard/DashboardBrandBackdrop';
import MoodCheckInCard from '../components/dashboard/MoodCheckInCard';
import DashboardRotatingInsightCard from '../components/dashboard/DashboardRotatingInsightCard';
import DigitalHealthProdromeAlert from '../components/dashboard/DigitalHealthProdromeAlert';
import DashboardStreakHero from '../components/dashboard/DashboardStreakHero';
import DashboardStatsRow from '../components/dashboard/DashboardStatsRow';
import DashboardHabitsSection from '../components/dashboard/DashboardHabitsSection';
import DashboardFocusCard from '../components/DashboardFocusCard';
import BrandLoadingView from '../components/common/BrandLoadingView';
import { api, ENDPOINTS } from '../config/api';
import { BORDERS, SPACING, STATUS_BAR } from '../constants/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { canAttemptChatAccess } from '../utils/chatAccessGate';
import { STORAGE_KEYS as CHAT_STORAGE_KEYS } from './chat/chatScreenConstants';
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
  const CHAT = useSectionTranslations('CHAT');
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
  const lastHomeRefreshAtRef = useRef(0);
  const homeRefreshInFlightRef = useRef(false);
  const hasCountedDashVisitRef = useRef(false);
  const tutorialShouldOpenChatRef = useRef(false);
  const onboardingOverlayStateRef = useRef({
    showTutorial: false,
    showOnboardingQuestions: false,
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
    };
  }, [showTutorial, showOnboardingQuestions]);

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
          if (blocker.showTutorial || blocker.showOnboardingQuestions) {
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
          if (blocker.showTutorial || blocker.showOnboardingQuestions) {
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
      lastHomeRefreshAtRef.current = Date.now();

      setLoading(false);
      setRefreshing(false);
      setError(null);

      const userId = userData?._id || userData?.id;
      if (userId) {
        websocketService.connect(userId).catch(() => {});
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
        
        // Flujo: primero recorrido (qué es Anto), luego preferencia opcional; el chat
        // queda accesible directamente desde la barra de navegación.
        if (!tutorialCompleted) {
          if (isNewUser) {
            setIsFirstTimeUser(true);
          }
          setTimeout(() => {
            if (__DEV__) {
              console.log('🧭 Activando recorrido de bienvenida...');
            }
            setShowTutorial(true);
          }, 1000);
        }
        setHasCheckedTutorial(true);
      }

      if (!hasCheckedEmergencyContacts) {
        checkEmergencyContacts(userData);
      }

      registerForPushNotifications().catch((error) => {
        console.error('Error registrando notificaciones push:', error);
      });

      paymentService
        .getTrialInfo()
        .then((trialInfoResult) => {
          if (trialInfoResult.success && trialInfoResult.isInTrial) {
            setTrialInfo(trialInfoResult);
          }
        })
        .catch((error) => {
          console.error('Error cargando info de trial:', error);
        });
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
    const canChat = await canAttemptChatAccess(userData);
    if (!canChat) {
      Alert.alert(
        CHAT.SUBSCRIPTION_REQUIRED_TITLE || 'Suscripción requerida',
        CHAT.SUBSCRIPTION_REQUIRED_DEFAULT ||
          'Necesitas una suscripción activa o trial válido para usar el chat.',
        [
          { text: CHAT.COMMON_CANCEL || 'Cancelar', style: 'cancel' },
          {
            text: CHAT.SUBSCRIPTION_VIEW_PLANS || 'Ver planes',
            onPress: () => navigation.navigate('Subscription'),
          },
        ],
      );
      return;
    }
    await setChatEntryBackTarget('dash');
    const state = navigation.getState?.();
    if (state?.type === 'tab') {
      navigation.navigate('Chat');
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Chat' });
  }, [navigation, userData, CHAT]);

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

  const openFocusOnboarding = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('FocusOnboarding', {
      onComplete: () => refreshHomeDataOnFocus({ force: true }),
    });
  }, [navigation, refreshHomeDataOnFocus]);

  const openFocusProgress = useCallback((activeFocus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('FocusProgress', {
      focus: activeFocus,
      onUpdate: () => refreshHomeDataOnFocus({ force: true }),
    });
  }, [navigation, refreshHomeDataOnFocus]);

  const refreshHomeDataOnFocus = useCallback(async ({ force = false } = {}) => {
    if (homeRefreshInFlightRef.current) return;
    if (!force && !shouldRefreshHomeOnFocus(lastHomeRefreshAtRef.current)) return;

    homeRefreshInFlightRef.current = true;
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const [tasksRes, habitsRes, focusRes] = await Promise.all([
        api.get(ENDPOINTS.TASKS).catch(() => null),
        api.get(ENDPOINTS.HABITS).catch(() => null),
        api.get(ENDPOINTS.SUMMARY_FOCUS).catch(() => null),
      ]);
      if (Array.isArray(tasksRes)) setTasks(tasksRes);
      if (Array.isArray(habitsRes)) setHabits(habitsRes);
      setFocusPayload((prev) => mergeFocusResponse(focusRes, prev));
      lastHomeRefreshAtRef.current = Date.now();
    } catch (_) {
      /* pull-to-refresh sigue disponible */
    } finally {
      homeRefreshInFlightRef.current = false;
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
      // #202: al retomar la conversación desde el foco, forzar el follow-up de
      // compromiso vencido en el primer mensaje (aunque el hilo ya tenga historial).
      const state = navigation.getState?.();
      if (state?.type === 'tab') {
        navigation.navigate('Chat', { openConversationId: cid, resumeCommitmentFollowUp: true });
        return;
      }
      navigation.navigate('MainTabs', {
        screen: 'Chat',
        params: { openConversationId: cid, resumeCommitmentFollowUp: true },
      });
    },
    [navigation]
  );

  // Tras el recorrido: preferencia opcional o chat (si vino de «Repasar recorrido»).
  const handleTutorialComplete = useCallback(async () => {
    setShowTutorial(false);
    const userId = userData?._id || userData?.id || null;
    if (tutorialShouldOpenChatRef.current) {
      tutorialShouldOpenChatRef.current = false;
      await markTutorialCompleted(userId);
      setTimeout(() => {
        goToChatFromOnboarding();
      }, 250);
      return;
    }
    setTimeout(() => setShowOnboardingQuestions(true), 400);
  }, [goToChatFromOnboarding, userData]);

  // Al cerrar las preguntas de onboarding (omitir o enviar) el usuario queda en el
  // dashboard; el chat sigue accesible desde la barra de navegación.
  const handleOnboardingQuestionsDismiss = useCallback(() => {
    setShowOnboardingQuestions(false);
  }, []);

  const handleOnboardingQuestionsCompleted = useCallback(async () => {
    const userId = userData?._id || userData?.id || null;
    await markTutorialCompleted(userId);
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
        await refreshHomeDataOnFocus({ force: true });
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
        await refreshHomeDataOnFocus({ force: true });
      } finally {
        setTogglingHabitId(null);
      }
    },
    [refreshHomeDataOnFocus],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <BrandLoadingView />
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
            onCommitmentsChanged={() => refreshHomeDataOnFocus({ force: true })}
            onOpenFocusProgress={openFocusProgress}
          />
          <DashboardStreakHero
            streakDays={dashboardStats.streakDays}
            displayName={getDashboardDisplayName(userData)}
            dailyMood={focusPayload?.dailyMood}
            onOpenChat={goToChatFromOnboarding}
            streakOnly
          />
          <DashboardRotatingInsightCard insight={focusPayload?.homeInsight} />
          <DigitalHealthProdromeAlert alert={focusPayload?.phenotypeAlert} />
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