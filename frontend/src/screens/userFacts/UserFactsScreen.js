/**
 * Pantalla de gestión de hechos biográficos del usuario (#63 grounding).
 * Permite visualizar, crear, editar y eliminar hechos que el asistente debe recordar.
 * 
 * @component
 * @description
 * Implementa la interfaz principal para gestionar hechos biográficos del usuario.
 * Los hechos se combinan con extracción automática en el backend para proveer
 * contexto personalizado al LLM y prevenir alucinaciones.
 * 
 * Características:
 * - Lista de hechos agrupados por categoría con iconos
 * - Estados de carga, error y vacío
 * - Acciones inline: editar y eliminar
 * - Confirmación destructiva para eliminación (soft delete)
 * - Validación de datos en renderizado para seguridad
 * - Feedback haptic en interacciones
 * 
 * @example
 * // Uso en navegación:
 * navigation.navigate('UserFacts');
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { fetchUserFacts, deleteUserFact } from '../../services/userFactsService';
import { confirmDestructiveAction } from '../../utils/confirmDestructiveAction';
import UserFactModal from './UserFactModal';

/**
 * Mapa de iconos para cada categoría de hecho.
 * Usa iconos de MaterialCommunityIcons para consistencia visual.
 * 
 * @constant {Object.<string, string>}
 */
const CATEGORY_ICONS = {
  work: 'briefcase-outline',
  family: 'account-group-outline',
  study: 'school-outline',
  health: 'heart-pulse',
  relationships: 'account-heart-outline',
  commitment: 'calendar-check-outline',
  other: 'tag-outline',
};

const UserFactsScreen = () => {
  const translated = useSectionTranslations('USER_FACTS');
  const T = useMemo(
    () => ({
      SCREEN_TITLE: translated?.SCREEN_TITLE || 'Hechos sobre mí',
      EMPTY_TITLE: translated?.EMPTY_TITLE || 'Aún no hay hechos guardados',
      EMPTY_MESSAGE:
        translated?.EMPTY_MESSAGE ||
        'Aquí podrás guardar información sobre ti que quieras que el asistente recuerde siempre.',
      EMPTY_CTA: translated?.EMPTY_CTA || 'Agregar primer hecho',
      ADD_FACT_CTA: translated?.ADD_FACT_CTA || 'Agregar hecho',
      FACT_CARD_EDIT: translated?.FACT_CARD_EDIT || 'Editar',
      FACT_CARD_DELETE: translated?.FACT_CARD_DELETE || 'Eliminar',
      DELETE_CONFIRM_TITLE: translated?.DELETE_CONFIRM_TITLE || 'Eliminar hecho',
      DELETE_CONFIRM_MESSAGE:
        translated?.DELETE_CONFIRM_MESSAGE ||
        'Este hecho se eliminará permanentemente. Esta acción no se puede deshacer.',
      DELETE_CANCEL: translated?.DELETE_CANCEL || 'Cancelar',
      DELETE_CONFIRM: translated?.DELETE_CONFIRM || 'Eliminar',
      TOAST_DELETED: translated?.TOAST_DELETED || 'Hecho eliminado',
      TOAST_ERROR: translated?.TOAST_ERROR || 'No se pudo completar. Intenta de nuevo.',
      LOADING: translated?.LOADING || 'Cargando hechos…',
      ERROR_LOADING: translated?.ERROR_LOADING || 'No se pudieron cargar los hechos',
      RETRY: translated?.RETRY || 'Reintentar',
      CATEGORY_WORK: translated?.CATEGORY_WORK || 'Trabajo',
      CATEGORY_FAMILY: translated?.CATEGORY_FAMILY || 'Familia',
      CATEGORY_STUDY: translated?.CATEGORY_STUDY || 'Estudios',
      CATEGORY_HEALTH: translated?.CATEGORY_HEALTH || 'Salud',
      CATEGORY_RELATIONSHIPS: translated?.CATEGORY_RELATIONSHIPS || 'Relaciones',
      CATEGORY_COMMITMENT: translated?.CATEGORY_COMMITMENT || 'Compromisos',
      CATEGORY_OTHER: translated?.CATEGORY_OTHER || 'Otro',
    }),
    [translated]
  );

  const { colors, resolvedScheme } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFact, setEditingFact] = useState(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        contentContainer: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: SPACING.HERO_INSET,
          paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          marginTop: SPACING.md,
          fontSize: 15,
          color: colors.textSecondary,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        errorText: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: SPACING.lg,
        },
        retryButton: {
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.CHIP_INSET,
          backgroundColor: colors.primary,
          borderRadius: 999,
        },
        retryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: SPACING.xxl,
        },
        emptyIcon: {
          marginBottom: SPACING.lg,
        },
        emptyTitle: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: SPACING.sm,
        },
        emptyMessage: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: SPACING.xl,
        },
        emptyButton: {
          paddingVertical: SPACING.CHIP_INSET,
          paddingHorizontal: SPACING.HERO_INSET,
          backgroundColor: colors.primary,
          borderRadius: 999,
        },
        emptyButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
        addButton: {
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.CHIP_INSET,
          backgroundColor: colors.primary,
          borderRadius: 999,
          marginBottom: SPACING.md,
        },
        addButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
        factCard: {
          backgroundColor: colors.chromeCard,
          borderRadius: 20,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeCardBorder,
          padding: SPACING.CARD_INNER_INSET,
          marginBottom: SPACING.md,
          shadowColor: colors.glassShadow,
          shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.14,
          shadowRadius: resolvedScheme === 'dark' ? 12 : 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
        factHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: SPACING.sm,
        },
        factIconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accentLine,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: SPACING.sm,
        },
        factHeaderText: {
          flex: 1,
        },
        factCategory: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        factDate: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
        factText: {
          fontSize: 16,
          color: colors.text,
          lineHeight: 22,
          marginBottom: SPACING.sm,
        },
        factActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        },
        factActionButton: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.xs,
          paddingHorizontal: SPACING.sm,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
        },
        editButton: {
          backgroundColor: colors.accentLineSoft,
          borderColor: colors.accentLine,
        },
        deleteButton: {
          backgroundColor: colors.dangerSoft,
          borderColor: colors.dangerBorder,
        },
        factActionText: {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 4,
        },
        editButtonText: {
          color: colors.primary,
        },
        deleteButtonText: {
          color: colors.error,
        },
      }),
    [colors, resolvedScheme, insets]
  );

  /**
   * Carga los hechos biográficos del usuario desde la API.
   * Valida y filtra respuestas inválidas para seguridad.
   * 
   * @async
   * @function
   * @returns {Promise<void>}
   */
  const loadFacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFacts = await fetchUserFacts({ limit: 100 });
      
      // Validar que la respuesta es un array
      if (!Array.isArray(fetchedFacts)) {
        console.warn('[UserFactsScreen] fetchUserFacts did not return an array:', fetchedFacts);
        setFacts([]);
        return;
      }
      
      // Validar y filtrar hechos inválidos
      const validFacts = fetchedFacts.filter((fact) => {
        if (!fact || typeof fact !== 'object') return false;
        if (!fact._id || typeof fact._id !== 'string') return false;
        if (!fact.fact || typeof fact.fact !== 'string') return false;
        return true;
      });
      
      if (validFacts.length !== fetchedFacts.length) {
        console.warn(
          `[UserFactsScreen] Filtered out ${fetchedFacts.length - validFacts.length} invalid facts`
        );
      }
      
      setFacts(validFacts);
    } catch (err) {
      console.error('[UserFactsScreen] Error loading facts:', err);
      setError(err.message || T.ERROR_LOADING);
    } finally {
      setLoading(false);
    }
  }, [T.ERROR_LOADING]);

  useFocusEffect(
    useCallback(() => {
      loadFacts();
    }, [loadFacts])
  );

  /**
   * Obtiene la etiqueta traducida para una categoría de hecho.
   * 
   * @function
   * @param {string} category - Valor de categoría ('work', 'family', etc.)
   * @returns {string} Etiqueta traducida o fallback
   */
  const getCategoryLabel = useCallback(
    (category) => {
      const categoryMap = {
        work: T.CATEGORY_WORK,
        family: T.CATEGORY_FAMILY,
        study: T.CATEGORY_STUDY,
        health: T.CATEGORY_HEALTH,
        relationships: T.CATEGORY_RELATIONSHIPS,
        commitment: T.CATEGORY_COMMITMENT,
        other: T.CATEGORY_OTHER,
      };
      return categoryMap[category] || T.CATEGORY_OTHER;
    },
    [T]
  );

  /**
   * Abre el modal para crear un nuevo hecho.
   * 
   * @function
   */
  const handleAddFact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingFact(null);
    setModalVisible(true);
  }, []);

  /**
   * Abre el modal para editar un hecho existente.
   * 
   * @function
   * @param {Object} fact - Hecho a editar
   * @param {string} fact._id - ID del hecho
   * @param {string} fact.fact - Texto del hecho
   * @param {string} fact.category - Categoría del hecho
   */
  const handleEditFact = useCallback((fact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingFact(fact);
    setModalVisible(true);
  }, []);

  /**
   * Elimina un hecho después de confirmación destructiva.
   * Usa soft delete en el backend.
   * 
   * @async
   * @function
   * @param {Object} fact - Hecho a eliminar
   * @param {string} fact._id - ID del hecho
   */
  const handleDeleteFact = useCallback(
    async (fact) => {
      // Validar que el fact tiene los datos necesarios
      if (!fact || !fact._id) {
        console.error('[UserFactsScreen] Cannot delete fact: missing _id');
        showToast(T.TOAST_ERROR);
        return;
      }

      const confirmed = await confirmDestructiveAction({
        title: T.DELETE_CONFIRM_TITLE,
        message: T.DELETE_CONFIRM_MESSAGE,
        confirmLabel: T.DELETE_CONFIRM,
        cancelLabel: T.DELETE_CANCEL,
        isDestructive: true,
      });

      if (!confirmed) return;

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await deleteUserFact(fact._id, false); // soft delete
        setFacts((prev) => prev.filter((f) => f._id !== fact._id));
        showToast(T.TOAST_DELETED);
      } catch (err) {
        console.error('[UserFactsScreen] Error deleting fact:', err);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast(T.TOAST_ERROR);
      }
    },
    [T, showToast]
  );

  /**
   * Cierra el modal de edición/creación y reinicia estado.
   * 
   * @function
   */
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setEditingFact(null);
  }, []);

  /**
   * Callback ejecutado después de guardar un hecho.
   * Cierra el modal y recarga la lista.
   * 
   * @function
   */
  const handleFactSaved = useCallback(() => {
    setModalVisible(false);
    setEditingFact(null);
    loadFacts();
  }, [loadFacts]);

  /**
   * Renderiza una tarjeta de hecho con validación exhaustiva.
   * Filtra datos inválidos para prevenir errores de UI.
   * 
   * @function
   * @param {Object} props
   * @param {Object} props.item - Hecho a renderizar
   * @param {string} props.item._id - ID del hecho
   * @param {string} props.item.fact - Texto del hecho
   * @param {string} props.item.category - Categoría
   * @param {string} [props.item.createdAt] - Fecha de creación (ISO)
   * @returns {React.Element|null} Tarjeta renderizada o null si inválido
   */
  const renderFactCard = useCallback(
    ({ item }) => {
      // Validar que item tiene los datos necesarios
      if (!item || !item._id || !item.fact) {
        console.warn('[UserFactsScreen] Skipping invalid fact item:', item);
        return null;
      }

      // Formatear fecha de forma segura
      let factDate = '';
      if (item.createdAt) {
        try {
          const date = new Date(item.createdAt);
          if (!isNaN(date.getTime())) {
            factDate = date.toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
          }
        } catch (err) {
          console.warn('[UserFactsScreen] Invalid date format:', item.createdAt);
        }
      }

      // Asegurar que fact es string y no está vacío
      const factText = String(item.fact || '').trim();
      if (!factText) {
        console.warn('[UserFactsScreen] Empty fact text for item:', item._id);
        return null;
      }

      return (
        <View style={styles.factCard}>
          <View style={styles.factHeader}>
            <View style={styles.factIconWrap}>
              <MaterialCommunityIcons
                name={CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.factHeaderText}>
              <Text style={styles.factCategory}>{getCategoryLabel(item.category)}</Text>
              {factDate && <Text style={styles.factDate}>{factDate}</Text>}
            </View>
          </View>
          <Text style={styles.factText}>{factText}</Text>
          <View style={styles.factActions}>
            <TouchableOpacity
              style={[styles.factActionButton, styles.editButton]}
              onPress={() => handleEditFact(item)}
              activeOpacity={0.7}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
              <Text style={[styles.factActionText, styles.editButtonText]}>
                {T.FACT_CARD_EDIT}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.factActionButton, styles.deleteButton]}
              onPress={() => handleDeleteFact(item)}
              activeOpacity={0.7}>
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
              <Text style={[styles.factActionText, styles.deleteButtonText]}>
                {T.FACT_CARD_DELETE}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [styles, colors, T, getCategoryLabel, handleEditFact, handleDeleteFact]
  );

  /**
   * Renderiza el estado vacío cuando no hay hechos guardados.
   * 
   * @function
   * @returns {React.Element|null}
   */
  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="information-outline"
          size={64}
          color={colors.textMuted}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>{T.EMPTY_TITLE}</Text>
        <Text style={styles.emptyMessage}>{T.EMPTY_MESSAGE}</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={handleAddFact} activeOpacity={0.8}>
          <Text style={styles.emptyButtonText}>{T.EMPTY_CTA}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, styles, colors, T, handleAddFact]);

  if (loading && facts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header title={T.SCREEN_TITLE} onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{T.LOADING}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && facts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header title={T.SCREEN_TITLE} onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFacts} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>{T.RETRY}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header title={T.SCREEN_TITLE} onBack={() => navigation.goBack()} />
      <FlatList
        data={facts}
        renderItem={renderFactCard}
        keyExtractor={(item, index) => (item && item._id) || `fact-${index}`}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
          facts.length > 0 ? (
            <TouchableOpacity style={styles.addButton} onPress={handleAddFact} activeOpacity={0.8}>
              <Text style={styles.addButtonText}>{T.ADD_FACT_CTA}</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
      />
      <UserFactModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSaved={handleFactSaved}
        editingFact={editingFact}
      />
    </SafeAreaView>
  );
};

export default UserFactsScreen;
