/**
 * Error Boundary Component
 * 
 * Captura errores de React y muestra una pantalla de error amigable
 * en lugar de que la app se rompa completamente.
 * 
 * @author AntoApp Team
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';

// Constantes
const TEXTS = {
  TITLE: 'Oops! Algo salió mal',
  MESSAGE: 'Lo sentimos, ha ocurrido un error inesperado.',
  RETRY: 'Reintentar',
  RELOAD: 'Recargar App',
  DETAILS: 'Detalles del error',
  HIDE_DETAILS: 'Ocultar detalles',
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para que la próxima renderización muestre la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error (solo en desarrollo)
    if (__DEV__) {
      console.error('[ErrorBoundary] Error capturado:', error);
      console.error('[ErrorBoundary] Error Info:', errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Aquí podrías enviar el error a un servicio de logging como Sentry
    // if (Sentry) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    // Recargar la app (en React Native esto requiere reiniciar)
    // En una app real, podrías usar un servicio de actualización
    this.handleRetry();
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={64}
                color={colors.error || '#FF6464'}
              />
            </View>

            <Text style={styles.title}>{TEXTS.TITLE}</Text>
            <Text style={styles.message}>{TEXTS.MESSAGE}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color={colors.white}
                />
                <Text style={styles.buttonText}>{TEXTS.RETRY}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.reloadButton]}
                onPress={this.handleReload}
              >
                <MaterialCommunityIcons
                  name="restart"
                  size={20}
                  color={colors.white}
                />
                <Text style={styles.buttonText}>{TEXTS.RELOAD}</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && this.state.error && (
              <View style={styles.detailsContainer}>
                <TouchableOpacity
                  style={styles.detailsToggle}
                  onPress={this.toggleDetails}
                >
                  <Text style={styles.detailsToggleText}>
                    {this.state.showDetails
                      ? TEXTS.HIDE_DETAILS
                      : TEXTS.DETAILS}
                  </Text>
                  <MaterialCommunityIcons
                    name={this.state.showDetails ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {this.state.showDetails && (
                  <View style={styles.detailsContent}>
                    <Text style={styles.detailsTitle}>
                      {this.state.error.toString()}
                    </Text>
                    {this.state.errorInfo && (
                      <Text style={styles.detailsText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  reloadButton: {
    backgroundColor: colors.textSecondary,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    width: '100%',
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '30',
    paddingTop: 20,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailsToggleText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailsContent: {
    backgroundColor: colors.textSecondary + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailsTitle: {
    color: colors.error || '#FF6464',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  detailsText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;

