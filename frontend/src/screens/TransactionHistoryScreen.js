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
  ActivityIndicator,
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
import { colors } from '../styles/globalStyles';
import api from '../config/api';

// Constantes
const TEXTS = {
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
};

const STATUS_COLORS = {
  completed: colors.success,
  pending: colors.warning,
  processing: colors.warning,
  failed: colors.error,
  canceled: colors.textSecondary,
  refunded: colors.textSecondary,
};

const STATUS_ICONS = {
  completed: 'check-circle',
  pending: 'clock-outline',
  processing: 'sync',
  failed: 'close-circle',
  canceled: 'cancel',
  refunded: 'undo',
};

const TransactionHistoryScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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

      const response = await api.get(api.ENDPOINTS.PAYMENT_TRANSACTIONS);
      
      if (response.success) {
        setTransactions(response.transactions || []);
      } else {
        setError(response.error || TEXTS.ERROR);
      }
    } catch (err) {
      console.error('Error cargando transacciones:', err);
      setError(TEXTS.ERROR);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatear monto
  const formatAmount = (amount, currency = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Formatear estado
  const formatStatus = (status) => {
    const statusMap = {
      completed: 'Completado',
      pending: 'Pendiente',
      processing: 'Procesando',
      failed: 'Fallido',
      canceled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return statusMap[status] || status;
  };

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
        const type = (transaction.type === 'subscription' ? 'suscripción' : 'pago único').toLowerCase();
        
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
  }, [transactions, searchQuery, filterStatus, filterType]);

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
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
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
              {item.type === 'subscription' ? 'Suscripción' : 'Pago único'}
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
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      );
    }

    if (error && transactions.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadTransactions()}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (transactions.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="receipt" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>{TEXTS.NO_TRANSACTIONS}</Text>
          <Text style={styles.emptySubtext}>{TEXTS.NO_TRANSACTIONS_DESC}</Text>
        </View>
      );
    }

    if (filteredTransactions.length === 0 && hasActiveFilters) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="filter-remove" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>{TEXTS.NO_FILTERED_TRANSACTIONS}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearFilters}>
            <Text style={styles.retryButtonText}>{TEXTS.CLEAR_FILTERS}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {/* Barra de búsqueda y filtros */}
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

        {/* Indicador de filtros activos */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersText}>
              {filteredTransactions.length} de {transactions.length} transacciones
            </Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>{TEXTS.CLEAR_FILTERS}</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContent}
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
        />

        {/* Modal de filtros */}
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
                      Suscripción
                    </Text>
                    {filterType === 'subscription' && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, filterType === 'one-time' && styles.filterOptionActive]}
                    onPress={() => setFilterType('one-time')}
                  >
                    <Text style={[styles.filterOptionText, filterType === 'one-time' && styles.filterOptionTextActive]}>
                      Pago único
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
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    color: colors.white,
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
  listContent: {
    padding: 16,
  },
  transactionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
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
    backgroundColor: colors.primary + '20',
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
    padding: 16,
    gap: 12,
    backgroundColor: colors.background,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
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
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
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
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
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
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    padding: 16,
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
    color: colors.white,
  },
});

export default TransactionHistoryScreen;

