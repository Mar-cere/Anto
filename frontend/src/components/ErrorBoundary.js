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
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';
import { captureBoundaryError } from '../utils/sentry';

// Constantes
const DEFAULT_TEXTS = {
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

    captureBoundaryError(error, errorInfo);
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
        <ErrorBoundaryView
          boundaryProps={{
            state: this.state,
            handleRetry: this.handleRetry,
            handleReload: this.handleReload,
            toggleDetails: this.toggleDetails,
          }}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorBoundaryView({ boundaryProps }) {
  const translated = useSectionTranslations('DASH');
  const TEXTS = React.useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      TITLE: translated?.ERROR_BOUNDARY_TITLE || DEFAULT_TEXTS.TITLE,
      MESSAGE: translated?.ERROR_BOUNDARY_MESSAGE || DEFAULT_TEXTS.MESSAGE,
      RETRY: translated?.ERROR_BOUNDARY_RETRY || DEFAULT_TEXTS.RETRY,
      RELOAD: translated?.ERROR_BOUNDARY_RELOAD || DEFAULT_TEXTS.RELOAD,
      DETAILS: translated?.ERROR_BOUNDARY_DETAILS || DEFAULT_TEXTS.DETAILS,
      HIDE_DETAILS:
        translated?.ERROR_BOUNDARY_HIDE_DETAILS || DEFAULT_TEXTS.HIDE_DETAILS,
    }),
    [translated],
  );
  const { colors } = useTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          padding: SPACING.SCREEN_EDGE_INSET,
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
          color: colors.text,
          textAlign: 'center',
          marginBottom: 12,
        },
        message: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 32,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
        detailsContainer: {
          width: '100%',
          marginTop: 32,
          borderTopWidth: 1,
          borderTopColor: `${colors.textSecondary}30`,
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
          backgroundColor: `${colors.textSecondary}10`,
          borderRadius: 8,
          padding: 12,
          marginTop: 8,
        },
        detailsTitle: {
          color: colors.error,
          fontSize: 12,
          fontFamily: 'monospace',
          marginBottom: 8,
        },
        detailsText: {
          color: colors.textSecondary,
          fontSize: 10,
          fontFamily: 'monospace',
        },
      }),
    [colors],
  );

  const { state, handleRetry, handleReload, toggleDetails } = boundaryProps;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
        </View>

        <Text style={styles.title}>{TEXTS.TITLE}</Text>
        <Text style={styles.message}>{TEXTS.MESSAGE}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={handleRetry}>
            <MaterialCommunityIcons name="refresh" size={20} color={colors.textOnPrimary} />
            <Text style={styles.buttonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.reloadButton]} onPress={handleReload}>
            <MaterialCommunityIcons name="restart" size={20} color={colors.textOnPrimary} />
            <Text style={styles.buttonText}>{TEXTS.RELOAD}</Text>
          </TouchableOpacity>
        </View>

        {state.error && (typeof __DEV__ !== 'undefined' && __DEV__) ? (
          <View style={styles.detailsContainer}>
            <TouchableOpacity style={styles.detailsToggle} onPress={toggleDetails}>
              <Text style={styles.detailsToggleText}>
                {state.showDetails ? TEXTS.HIDE_DETAILS : TEXTS.DETAILS}
              </Text>
              <MaterialCommunityIcons
                name={state.showDetails ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {state.showDetails ? (
              <View style={styles.detailsContent}>
                <Text style={styles.detailsTitle}>{state.error.toString()}</Text>
                {state.errorInfo ? (
                  <Text style={styles.detailsText}>{state.errorInfo.componentStack}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default ErrorBoundary;

