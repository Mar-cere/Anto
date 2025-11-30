/**
 * Pantalla de Historial de Transacciones
 * 
 * Muestra el historial completo de transacciones del usuario,
 * incluyendo pagos, suscripciones y reembolsos.
 * 
 * @author AntoApp Team
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  AMOUNT: 'Monto',
  DATE: 'Fecha',
  STATUS: 'Estado',
  PLAN: 'Plan',
  DESCRIPTION: 'Descripción',
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

    return (
      <FlatList
        data={transactions}
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
});

export default TransactionHistoryScreen;

