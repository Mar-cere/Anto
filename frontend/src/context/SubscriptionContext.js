/**
 * Estado global de suscripción y trial compartido por paywall, perfil, chat y dashboard.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import paymentService, {
  setSubscriptionStatusChangeHandler,
} from '../services/paymentService';
import { resolveChatAccess } from '../utils/chatAccessGate';
import { subscriptionLooksCurrentlyUsable } from '../utils/subscriptionAccess';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [trialInfo, setTrialInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const applySubscriptionStatus = useCallback((status) => {
    if (status?.success) {
      setSubscriptionStatus(status);
      return status;
    }
    setSubscriptionStatus(null);
    return null;
  }, []);

  const refreshTrialInfo = useCallback(async ({ forceRefresh = false } = {}) => {
    const trial = await paymentService.getTrialInfo(forceRefresh ? { forceRefresh: true } : undefined);
    if (trial?.success) {
      setTrialInfo(trial);
    } else {
      setTrialInfo(null);
    }
    return trial;
  }, []);

  const refreshSubscription = useCallback(
    async ({ forceRefresh = false } = {}) => {
      const status = await paymentService.getSubscriptionStatus(
        forceRefresh ? { forceRefresh: true } : undefined,
      );
      return applySubscriptionStatus(status);
    },
    [applySubscriptionStatus],
  );

  const refreshAll = useCallback(
    async ({ forceRefresh = false } = {}) => {
      setLoading(true);
      try {
        const [status, trial] = await Promise.all([
          paymentService.getSubscriptionStatus(forceRefresh ? { forceRefresh: true } : undefined),
          paymentService.getTrialInfo(forceRefresh ? { forceRefresh: true } : undefined),
        ]);
        applySubscriptionStatus(status);
        if (trial?.success) {
          setTrialInfo(trial);
        } else {
          setTrialInfo(null);
        }
        return { subscriptionStatus: status, trialInfo: trial };
      } finally {
        setLoading(false);
      }
    },
    [applySubscriptionStatus],
  );

  const syncAfterPayment = useCallback(
    async (validationSubscription = null) => {
      const freshStatus = await paymentService.refreshSubscriptionStatusAfterPayment({
        validationSubscription,
      });
      applySubscriptionStatus(freshStatus);
      await refreshTrialInfo({ forceRefresh: true });
      return freshStatus;
    },
    [applySubscriptionStatus, refreshTrialInfo],
  );

  const userId = user?._id || user?.id || null;

  const trySyncPendingApple = useCallback(
    async (statusSnapshot) => {
      if (Platform.OS !== 'ios') return;
      if (subscriptionLooksCurrentlyUsable(statusSnapshot)) return;
      const syncResult = await paymentService.syncPendingApplePurchases();
      if (syncResult?.success && syncResult.subscription) {
        await syncAfterPayment(syncResult.subscription);
      }
    },
    [syncAfterPayment],
  );

  useEffect(() => {
    if (!userId) {
      setSubscriptionStatus(null);
      setTrialInfo(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [status, trial] = await Promise.all([
          paymentService.getSubscriptionStatus(),
          paymentService.getTrialInfo(),
        ]);
        if (cancelled) return;
        applySubscriptionStatus(status);
        if (trial?.success) {
          setTrialInfo(trial);
        } else {
          setTrialInfo(null);
        }
        // Cuenta nueva / restore pendiente: intentar vincular historial Apple local
        await trySyncPendingApple(status);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, applySubscriptionStatus, trySyncPendingApple]);

  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    if (!userId || Platform.OS !== 'ios') return undefined;

    const onChange = (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        void (async () => {
          const status = await paymentService.getSubscriptionStatus({ forceRefresh: true });
          applySubscriptionStatus(status);
          await trySyncPendingApple(status);
        })();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => {
      if (typeof sub?.remove === 'function') sub.remove();
    };
  }, [userId, applySubscriptionStatus, trySyncPendingApple]);

  useEffect(() => {
    setSubscriptionStatusChangeHandler((validationSubscription) => {
      void syncAfterPayment(validationSubscription);
    });
    return () => setSubscriptionStatusChangeHandler(null);
  }, [syncAfterPayment]);

  const hasChatAccess = useCallback(
    (userData = null) =>
      resolveChatAccess({
        subscriptionStatus,
        trialInfo,
        userData: userData || user,
      }),
    [subscriptionStatus, trialInfo, user],
  );

  const hasPremiumAccess = useMemo(
    () => subscriptionLooksCurrentlyUsable(subscriptionStatus),
    [subscriptionStatus],
  );

  const value = useMemo(
    () => ({
      subscriptionStatus,
      trialInfo,
      loading,
      hasPremiumAccess,
      hasChatAccess,
      refreshSubscription,
      refreshTrialInfo,
      refreshAll,
      syncAfterPayment,
      applySubscriptionStatus,
    }),
    [
      subscriptionStatus,
      trialInfo,
      loading,
      hasPremiumAccess,
      hasChatAccess,
      refreshSubscription,
      refreshTrialInfo,
      refreshAll,
      syncAfterPayment,
      applySubscriptionStatus,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription debe usarse dentro de un SubscriptionProvider');
  }
  return context;
}
