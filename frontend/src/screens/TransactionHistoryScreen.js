/**
 * Pantalla de Historial de Transacciones
 * 
 * Muestra el historial completo de transacciones del usuario,
 * incluyendo pagos, suscripciones y reembolsos.
 * 
 * @author AntoApp Team
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import FloatingNavBar from '../components/FloatingNavBar';
import { SkeletonCard } from '../components/Skeleton';
import api, { ENDPOINTS } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useMappedSectionTexts } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

// Constantes
const DEFAULT_TEXTS = {
  TITLE: 'Historial de Transacciones',
  LOADING: 'Cargando transacciones...',
  ERROR: 'Error al cargar las transacciones',
  RETRY: 'Reintentar',
  NO_TRANSACTIONS: 'No tienes transacciones aún',
  NO_TRANSACTIONS_DESC: 'Tus pagos y suscripciones aparecerán aquí',
  NO_FILTERED_TRANSACTIONS: 'No se encontraron transacciones con los filtros aplicados',
  AMOUNT: 'Monto',
  DATE: 'Fecha',
  STATUS: 'Estado',
  PLAN: 'Plan',
  DESCRIPTION: 'Descripción',
  SEARCH_PLACEHOLDER: 'Buscar transacciones...',
  FILTER: 'Filtrar',
  CLEAR_FILTERS: 'Limpiar filtros',
  FILTER_BY_STATUS: 'Filtrar por estado',
  FILTER_BY_TYPE: 'Filtrar por tipo',
  ALL_STATUSES: 'Todos los estados',
  ALL_TYPES: 'Todos los tipos',
  VIEW_PLANS: 'Ver planes',
  APPLY: 'Aplicar',
  SUBSCRIPTION_TYPE: 'Suscripción',
  ONE_TIME_TYPE: 'Pago único',
  STATUS_COMPLETED: 'Completado',
  STATUS_PENDING: 'Pendiente',
  STATUS_PROCESSING: 'Procesando',
  STATUS_FAILED: 'Fallido',
  STATUS_CANCELED: 'Cancelado',
  STATUS_REFUNDED: 'Reembolsado',
  FILTER_COUNT: '{filtered} de {total} transacciones',
  ERROR_CONNECTION: 'Error de conexión. Verifica internet e inténtalo de nuevo.',
  ERROR_TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento e inténtalo nuevamente.',
};

const TRANSACTION_TEXT_MAP = {
  TITLE: 'TRANSACTIONS_TITLE',
  LOADING: 'TRANSACTIONS_LOADING',
  ERROR: 'TRANSACTIONS_ERROR',
  RETRY: 'RETRY',
  NO_TRANSACTIONS: 'TRANSACTIONS_EMPTY_TITLE',
  NO_TRANSACTIONS_DESC: 'TRANSACTIONS_EMPTY_DESC',
  NO_FILTERED_TRANSACTIONS: 'TRANSACTIONS_EMPTY_FILTERED',
  SEARCH_PLACEHOLDER: 'TRANSACTIONS_SEARCH_PLACEHOLDER',
  FILTER: 'TRANSACTIONS_FILTER',
  CLEAR_FILTERS: 'TRANSACTIONS_CLEAR_FILTERS',
  FILTER_BY_STATUS: 'TRANSACTIONS_FILTER_BY_STATUS',
  FILTER_BY_TYPE: 'TRANSACTIONS_FILTER_BY_TYPE',
  ALL_STATUSES: 'TRANSACTIONS_ALL_STATUSES',
  ALL_TYPES: 'TRANSACTIONS_ALL_TYPES',
  VIEW_PLANS: 'TRANSACTIONS_VIEW_PLANS',
  APPLY: 'APPLY',
  SUBSCRIPTION_TYPE: 'TRANSACTIONS_TYPE_SUBSCRIPTION',
  ONE_TIME_TYPE: 'TRANSACTIONS_TYPE_ONE_TIME',
  STATUS_COMPLETED: 'TRANSACTIONS_STATUS_COMPLETED',
  STATUS_PENDING: 'TRANSACTIONS_STATUS_PENDING',
  STATUS_PROCESSING: 'TRANSACTIONS_STATUS_PROCESSING',
  STATUS_FAILED: 'TRANSACTIONS_STATUS_FAILED',
  STATUS_CANCELED: 'TRANSACTIONS_STATUS_CANCELED',
  STATUS_REFUNDED: 'TRANSACTIONS_STATUS_REFUNDED',
  FILTER_COUNT: 'TRANSACTIONS_FILTER_COUNT',
  ERROR_CONNECTION: 'ERROR_CONNECTION',
  ERROR_TOO_MANY_REQUESTS: 'ERROR_TOO_MANY_REQUESTS',
};

const resolveTransactionHistoryErrorMessage = (
  error,
  texts,
  fallbackKey = 'ERROR',
) => {
  const normalizedMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();
  const status = error?.response?.status;

  const isNetwork =
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('econnrefused') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('failed to fetch');

  if (isNetwork) {
    return texts.ERROR_CONNECTION || texts[fallbackKey] || texts.ERROR;
  }

  const isTooManyRequests =
    status === 429 ||
    normalizedMessage.includes('too many') ||
    normalizedMessage.includes('demasiados intentos');

  if (isTooManyRequests) {
    return texts.ERROR_TOO_MANY_REQUESTS || texts[fallbackKey] || texts.ERROR;
  }

  return texts[fallbackKey] || texts.ERROR;
};

const STATUS_ICONS = {
  completed: 'check-circle',
  pending: 'clock-outline',
  processing: 'sync',
  failed: 'close-circle',
  canceled: 'cancel',
  refunded: 'undo',
};

// FlatList performance (lazy loading)
const FLATLIST_INITIAL_NUM_TO_RENDER = 10;
const FLATLIST_WINDOW_SIZE = 10;
const FLATLIST_MAX_TO_RENDER_PER_BATCH = 10;

const TransactionHistoryScreen = () => {
  const { language } = useLanguage();
  const TEXTS = useMappedSectionTexts('PROFILE', DEFAULT_TEXTS, TRANSACTION_TEXT_MAP);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();

  const STATUS_COLORS = useMemo(
    () => ({
      completed: colors.success,
      pending: colors.warning,
      processing: colors.warning,
      failed: colors.error,
      canceled: colors.textSecondary,
      refunded: colors.textSecondary,
    }),
    [colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        mainFill: {
          flex: 1,
        },
        screenInset: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        centeredVertical: {
          flex: 1,
          justifyContent: 'center',
        },
        /** Mismo criterio que Configuración / Suscripción (`settingsSectionSurface`). */
        sectionShell: {
          padding: 14,
          marginBottom: 18,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.settingsSectionSurface,
          shadowColor: colors.glassShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.1,
          shadowRadius: 10,
          elevation: resolvedScheme === 'dark' ? 4 : 2,
        },
        stateShell: {
          alignItems: 'center',
          paddingVertical: 20,
        },
        centerContainer: {
          alignItems: 'center',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        loadingText: {
          marginTop: 16,
          color: colors.textSecondary,
          fontSize: 16,
        },
        errorText: {
          marginTop: 16,
          marginBottom: 24,
          color: colors.error,
          fontSize: 16,
          textAlign: 'center',
        },
        retryButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
        },
        retryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: 'bold',
        },
        emptyText: {
          marginTop: 16,
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.text,
          textAlign: 'center',
        },
        emptySubtext: {
          marginTop: 8,
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        skeletonInner: {
          paddingTop: 4,
        },
        skeletonCard: {
          marginBottom: 12,
        },
        emptyCtaButton: {
          marginTop: 24,
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 12,
        },
        emptyCtaButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
        listContent: {
          paddingTop: 4,
        },
        listFlex: {
          flex: 1,
        },
        transactionCard: {
          backgroundColor: colors.chromeCard,
          borderRadius: 12,
          padding: SPACING.SCREEN_EDGE_INSET,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        transactionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        },
        transactionInfo: {
          flex: 1,
        },
        transactionDate: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 4,
        },
        planBadge: {
          alignSelf: 'flex-start',
          backgroundColor: `${colors.primary}20`,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          marginTop: 4,
        },
        planText: {
          fontSize: 10,
          fontWeight: 'bold',
          color: colors.primary,
        },
        statusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
        },
        statusText: {
          fontSize: 12,
          fontWeight: '600',
          marginLeft: 4,
        },
        description: {
          fontSize: 14,
          color: colors.text,
          marginBottom: 12,
        },
        transactionFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        amount: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.text,
        },
        type: {
          fontSize: 12,
          color: colors.textSecondary,
        },
        searchContainer: {
          flexDirection: 'row',
          gap: 12,
        },
        searchBar: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.chromeCard,
          borderRadius: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 8,
        },
        searchInput: {
          flex: 1,
          color: colors.text,
          fontSize: 14,
        },
        filterButton: {
          width: 48,
          height: 48,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.chromeCard,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          position: 'relative',
        },
        filterButtonActive: {
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}20`,
        },
        filterBadge: {
          position: 'absolute',
          top: 8,
          right: 8,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        activeFiltersContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        activeFiltersText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        clearFiltersText: {
          fontSize: 14,
          color: colors.primary,
          fontWeight: '600',
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: colors.backdropStrong ?? 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        modalContent: {
          backgroundColor: colors.cardBackground,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '80%',
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        modalTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.text,
        },
        modalBody: {
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        filterSection: {
          marginBottom: 24,
        },
        filterSectionTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 12,
        },
        filterOption: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
          backgroundColor: colors.background,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: colors.border,
        },
        filterOptionActive: {
          borderColor: colors.primary,
          backgroundColor: `${colors.primary}20`,
        },
        filterOptionText: {
          fontSize: 14,
          color: colors.text,
        },
        filterOptionTextActive: {
          color: colors.primary,
          fontWeight: '600',
        },
        modalFooter: {
          flexDirection: 'row',
          padding: SPACING.SCREEN_EDGE_INSET,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        modalButton: {
          flex: 1,
          padding: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 12,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        },
        modalButtonPrimary: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        modalButtonText: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
        },
        modalButtonTextPrimary: {
          color: colors.textOnPrimary,
        },
      }),
    [colors, resolvedScheme],
  );

  const handleViewPlans = () => {
    navigation.navigate('Subscription');
  };
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Cargar transacciones
  const loadTransactions = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      const response = await api.get(ENDPOINTS.PAYMENT_TRANSACTIONS);
      
      if (response.success) {
        setTransactions(response.transactions || []);
      } else {
        setError(TEXTS.ERROR);
      }
    } catch (err) {
      console.error('Error cargando transacciones:', err);
      setError(resolveTransactionHistoryErrorMessage(err, TEXTS, 'ERROR'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [TEXTS]);

  // Cargar al montar
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Recargar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = language === 'en' ? 'en-US' : 'es-CL';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatear monto
  const formatAmount = (amount, currency = 'CLP') => {
    const locale = language === 'en' ? 'en-US' : 'es-CL';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear estado
  const formatStatus = useCallback((status) => {
    const statusMap = {
      completed: TEXTS.STATUS_COMPLETED,
      pending: TEXTS.STATUS_PENDING,
      processing: TEXTS.STATUS_PROCESSING,
      failed: TEXTS.STATUS_FAILED,
      canceled: TEXTS.STATUS_CANCELED,
      refunded: TEXTS.STATUS_REFUNDED,
    };
    return statusMap[status] || status;
  }, [TEXTS]);

  // Filtrar y buscar transacciones
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((transaction) => {
        const description = (transaction.description || '').toLowerCase();
        const amount = transaction.amount?.toString() || '';
        const plan = (transaction.plan || '').toLowerCase();
        const status = formatStatus(transaction.status).toLowerCase();
        const type = (
          transaction.type === 'subscription'
            ? TEXTS.SUBSCRIPTION_TYPE
            : TEXTS.ONE_TIME_TYPE
        ).toLowerCase();
        
        return (
          description.includes(query) ||
          amount.includes(query) ||
          plan.includes(query) ||
          status.includes(query) ||
          type.includes(query)
        );
      });
    }

    // Filtrar por estado
    if (filterStatus) {
      filtered = filtered.filter((transaction) => transaction.status === filterStatus);
    }

    // Filtrar por tipo
    if (filterType) {
      filtered = filtered.filter((transaction) => transaction.type === filterType);
    }

    return filtered;
  }, [transactions, searchQuery, filterStatus, filterType, formatStatus, TEXTS]);

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus(null);
    setFilterType(null);
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = searchQuery.trim() || filterStatus || filterType;

  // Renderizar item de transacción
  const renderTransaction = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || colors.textSecondary;
    const statusIcon = STATUS_ICONS[item.status] || 'help-circle';

    return (
      <TouchableOpacity style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
            {item.plan && (
              <View style={styles.planBadge}>
                <Text style={styles.planText}>{item.plan.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <MaterialCommunityIcons name={statusIcon} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {formatStatus(item.status)}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <View style={styles.transactionFooter}>
          <Text style={styles.amount}>{formatAmount(item.amount, item.currency)}</Text>
          {item.type && (
            <Text style={styles.type}>
              {item.type === 'subscription'
                ? TEXTS.SUBSCRIPTION_TYPE
                : TEXTS.ONE_TIME_TYPE}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar contenido
  const renderContent = () => {
    if (loading && transactions.length === 0) {
      return (
        <View style={styles.mainFill}>
          <View style={styles.screenInset}>
            <View style={styles.sectionShell}>
              <View style={styles.skeletonInner}>
                {Array.from({ length: 6 }, (_, i) => (
                  <SkeletonCard key={`tx-skeleton-${i}`} style={styles.skeletonCard} />
                ))}
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (error && transactions.length === 0) {
      return (
        <View style={styles.mainFill}>
          <View style={[styles.screenInset, styles.centeredVertical]}>
            <View style={[styles.sectionShell, styles.stateShell]}>
              <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => loadTransactions()}>
                  <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (transactions.length === 0) {
      return (
        <View style={styles.mainFill}>
          <View style={[styles.screenInset, styles.centeredVertical]}>
            <View style={[styles.sectionShell, styles.stateShell]}>
              <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="receipt" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyText}>{TEXTS.NO_TRANSACTIONS}</Text>
                <Text style={styles.emptySubtext}>{TEXTS.NO_TRANSACTIONS_DESC}</Text>
                <TouchableOpacity style={styles.emptyCtaButton} onPress={handleViewPlans}>
                  <Text style={styles.emptyCtaButtonText}>{TEXTS.VIEW_PLANS}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (filteredTransactions.length === 0 && hasActiveFilters) {
      return (
        <View style={styles.mainFill}>
          <View style={[styles.screenInset, styles.centeredVertical]}>
            <View style={[styles.sectionShell, styles.stateShell]}>
              <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="filter-remove" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyText}>{TEXTS.NO_FILTERED_TRANSACTIONS}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={clearFilters}>
                  <Text style={styles.retryButtonText}>{TEXTS.CLEAR_FILTERS}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mainFill}>
        <View style={styles.screenInset}>
          <View style={styles.sectionShell}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={TEXTS.SEARCH_PLACEHOLDER}
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                onPress={() => setShowFilterModal(true)}
              >
                <MaterialCommunityIcons
                  name="filter"
                  size={20}
                  color={hasActiveFilters ? colors.primary : colors.textSecondary}
                />
                {hasActiveFilters && <View style={styles.filterBadge} />}
              </TouchableOpacity>
            </View>
            {hasActiveFilters && (
              <View style={styles.activeFiltersContainer}>
                <Text style={styles.activeFiltersText}>
                  {TEXTS.FILTER_COUNT.replace(
                    '{filtered}',
                    String(filteredTransactions.length),
                  ).replace('{total}', String(transactions.length))}
                </Text>
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>{TEXTS.CLEAR_FILTERS}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id || item.id}
          style={styles.listFlex}
          contentContainerStyle={[
            styles.listContent,
            styles.screenInset,
            { paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadTransactions(true);
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={FLATLIST_INITIAL_NUM_TO_RENDER}
          windowSize={FLATLIST_WINDOW_SIZE}
          maxToRenderPerBatch={FLATLIST_MAX_TO_RENDER_PER_BATCH}
        />

        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{TEXTS.FILTER}</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Filtro por estado */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>{TEXTS.FILTER_BY_STATUS}</Text>
                  <TouchableOpacity
                    style={[styles.filterOption, !filterStatus && styles.filterOptionActive]}
                    onPress={() => setFilterStatus(null)}
                  >
                    <Text style={[styles.filterOptionText, !filterStatus && styles.filterOptionTextActive]}>
                      {TEXTS.ALL_STATUSES}
                    </Text>
                    {!filterStatus && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                  {Object.keys(STATUS_COLORS).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.filterOption, filterStatus === status && styles.filterOptionActive]}
                      onPress={() => setFilterStatus(status)}
                    >
                      <Text style={[styles.filterOptionText, filterStatus === status && styles.filterOptionTextActive]}>
                        {formatStatus(status)}
                      </Text>
                      {filterStatus === status && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filtro por tipo */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>{TEXTS.FILTER_BY_TYPE}</Text>
                  <TouchableOpacity
                    style={[styles.filterOption, !filterType && styles.filterOptionActive]}
                    onPress={() => setFilterType(null)}
                  >
                    <Text style={[styles.filterOptionText, !filterType && styles.filterOptionTextActive]}>
                      {TEXTS.ALL_TYPES}
                    </Text>
                    {!filterType && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, filterType === 'subscription' && styles.filterOptionActive]}
                    onPress={() => setFilterType('subscription')}
                  >
                    <Text style={[styles.filterOptionText, filterType === 'subscription' && styles.filterOptionTextActive]}>
                      {TEXTS.SUBSCRIPTION_TYPE}
                    </Text>
                    {filterType === 'subscription' && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, filterType === 'one-time' && styles.filterOptionActive]}
                    onPress={() => setFilterType('one-time')}
                  >
                    <Text style={[styles.filterOptionText, filterType === 'one-time' && styles.filterOptionTextActive]}>
                      {TEXTS.ONE_TIME_TYPE}
                    </Text>
                    {filterType === 'one-time' && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    clearFilters();
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>{TEXTS.CLEAR_FILTERS}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    {TEXTS.APPLY}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      <Header
        greeting=""
        userName=""
        showBackButton={true}
        title={TEXTS.TITLE}
      />
      {renderContent()}
      <FloatingNavBar />
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;

