/**
 * Pantalla de Métodos de Pago
 * 
 * Muestra información sobre el método de pago actual y permite actualizarlo.
 * 
 * @author AntoApp Team
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import FloatingNavBar from '../components/FloatingNavBar';
import paymentService from '../services/paymentService';
import { colors } from '../styles/globalStyles';

// Constantes
const TEXTS = {
  TITLE: 'Método de Pago',
  CURRENT_METHOD: 'Método de Pago Actual',
  UPDATE_METHOD: 'Actualizar Método de Pago',
  LOADING: 'Cargando información...',
  ERROR: 'Error al cargar la información',
  RETRY: 'Reintentar',
  NO_METHOD: 'No hay método de pago configurado',
  NO_METHOD_DESC: 'Configura un método de pago para suscribirte',
  UPDATE_SUCCESS: 'Método de pago actualizado exitosamente',
  UPDATE_ERROR: 'Error al actualizar el método de pago',
  UPDATE_CONFIRM: '¿Deseas actualizar tu método de pago?',
  MERCADOPAGO_INFO: 'Los métodos de pago se gestionan a través de Mercado Pago',
  MERCADOPAGO_DESC: 'Al suscribirte o actualizar tu suscripción, podrás elegir tu método de pago preferido.',
  SUPPORTED_METHODS: 'Métodos de Pago Soportados',
  CARD: 'Tarjeta de Crédito/Débito',
  BANK_TRANSFER: 'Transferencia Bancaria',
  OTHER: 'Otros métodos',
};

const PaymentMethodScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Cargar información de suscripción
  const loadSubscriptionStatus = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await paymentService.getSubscriptionStatus();
      if (response.success) {
        setSubscriptionStatus(response);
      } else {
        setError(response.error || TEXTS.ERROR);
      }
    } catch (err) {
      console.error('Error cargando estado de suscripción:', err);
      setError(TEXTS.ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  // Recargar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadSubscriptionStatus();
    }, [loadSubscriptionStatus])
  );

  // Manejar actualización de método de pago
  const handleUpdatePaymentMethod = useCallback(async () => {
    Alert.alert(
      TEXTS.UPDATE_METHOD,
      TEXTS.UPDATE_CONFIRM + '\n\n' + TEXTS.MERCADOPAGO_DESC,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Actualizar',
          onPress: async () => {
            try {
              setUpdating(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              // Navegar a la pantalla de suscripción para actualizar el método de pago
              navigation.navigate('Subscription');
              
              Alert.alert(
                'Actualizar Método de Pago',
                'Serás redirigido a la pantalla de suscripción donde podrás actualizar tu método de pago.',
                [{ text: 'OK' }]
              );
            } catch (err) {
              console.error('Error actualizando método de pago:', err);
              Alert.alert(TEXTS.UPDATE_ERROR, err.message || 'Ocurrió un error al intentar actualizar el método de pago');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  }, [navigation]);

  // Renderizar método de pago actual
  const renderCurrentMethod = () => {
    if (!subscriptionStatus || !subscriptionStatus.hasActiveSubscription) {
      return (
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="credit-card-off" size={48} color={colors.textSecondary} />
          <Text style={styles.infoTitle}>{TEXTS.NO_METHOD}</Text>
          <Text style={styles.infoText}>{TEXTS.NO_METHOD_DESC}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.primaryButtonText}>Ver Planes</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="credit-card" size={48} color={colors.primary} />
        <Text style={styles.infoTitle}>{TEXTS.CURRENT_METHOD}</Text>
        <Text style={styles.infoText}>
          {subscriptionStatus.paymentMethod || 'Mercado Pago'}
        </Text>
        {subscriptionStatus.hasActiveSubscription && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleUpdatePaymentMethod}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>{TEXTS.UPDATE_METHOD}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Renderizar métodos soportados
  const renderSupportedMethods = () => {
    const methods = [
      { icon: 'credit-card', name: TEXTS.CARD, description: 'Visa, Mastercard, Amex' },
      { icon: 'bank', name: TEXTS.BANK_TRANSFER, description: 'Transferencia bancaria' },
      { icon: 'wallet', name: TEXTS.OTHER, description: 'Mercado Pago, otros' },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.SUPPORTED_METHODS}</Text>
        {methods.map((method, index) => (
          <View key={index} style={styles.methodCard}>
            <MaterialCommunityIcons name={method.icon} size={32} color={colors.primary} />
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Renderizar contenido
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      );
    }

    if (error && !subscriptionStatus) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSubscriptionStatus}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentMethod()}
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={32} color={colors.primary} />
          <Text style={styles.infoTitle}>{TEXTS.MERCADOPAGO_INFO}</Text>
          <Text style={styles.infoText}>{TEXTS.MERCADOPAGO_DESC}</Text>
        </View>

        {renderSupportedMethods()}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodInfo: {
    flex: 1,
    marginLeft: 16,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default PaymentMethodScreen;

