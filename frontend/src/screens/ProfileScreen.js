/**
 * Pantalla de perfil de usuario
 * 
 * Permite a los usuarios ver su perfil, estadísticas, editar perfil y cerrar sesión.
 * Incluye avatar, estadísticas de tareas y hábitos, y opciones de navegación.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { api } from '../config/api';
import { ROUTES } from '../constants/routes';
import { colors } from '../styles/globalStyles';

// Constantes de textos
const TEXTS = {
  LOADING: 'Cargando perfil...',
  ERROR_LOAD: 'Error',
  ERROR_LOAD_MESSAGE: 'No se pudieron cargar los datos del perfil',
  LOGOUT_TITLE: 'Cerrar Sesión',
  LOGOUT_MESSAGE: '¿Estás seguro que deseas cerrar sesión?',
  CANCEL: 'Cancelar',
  LOGOUT: 'Cerrar Sesión',
  ERROR_LOGOUT: 'Error',
  ERROR_LOGOUT_MESSAGE: 'No se pudo cerrar sesión. Por favor, intenta nuevamente.',
  PROFILE_TITLE: 'Mi Perfil',
  STATS_TITLE: 'Estadísticas',
  TASKS_COMPLETED: 'Tareas Completadas',
  HABITS_ACTIVE: 'Hábitos Activos',
  CURRENT_STREAK: 'Racha Actual',
  THIS_WEEK: 'esta semana',
  COMPLETED_TODAY: 'completados hoy',
  BEST: 'Mejor',
  DAYS: 'días',
  EDIT_PROFILE: 'Editar Perfil',
  HELP: 'Ayuda',
  BACK: 'Volver',
  SETTINGS: 'Ir a configuración',
  EDIT_PROFILE_LABEL: 'Editar perfil',
  HELP_LABEL: 'Ayuda',
  LOGOUT_LABEL: 'Cerrar sesión',
};

// Constantes de estilos
const BACKGROUND_OPACITY = 0.1;
const REFRESH_ANIMATION_DURATION = 300;
const REFRESH_SCALE_MAX = 1.05;
const REFRESH_OPACITY_MIN = 0.7;
const SCROLL_PADDING_BOTTOM = 48;
const HEADER_PADDING_HORIZONTAL = 16;
const HEADER_PADDING_VERTICAL = 12;
const HEADER_BUTTON_SIZE = 40;
const HEADER_BUTTON_BORDER_RADIUS = 20;
const HEADER_BORDER_WIDTH = 1;
const PROFILE_SECTION_PADDING = 20;
const AVATAR_CONTAINER_MARGIN_BOTTOM = 16;
const AVATAR_SIZE = 120;
const AVATAR_BORDER_RADIUS = 60;
const USER_NAME_MARGIN_BOTTOM = 4;
const USER_EMAIL_MARGIN_BOTTOM = 16;
const STATS_CONTAINER_PADDING = 16;
const SECTION_TITLE_MARGIN_BOTTOM = 16;
const STATS_GRID_PADDING_VERTICAL = 4;
const STAT_ITEM_WIDTH = 160;
const STAT_ITEM_BORDER_RADIUS = 12;
const STAT_ITEM_PADDING = 16;
const STAT_ITEM_MARGIN_RIGHT = 12;
const STAT_ITEM_BORDER_WIDTH = 1;
const STAT_VALUE_MARGIN_VERTICAL = 8;
const STAT_SUB_LABEL_MARGIN_TOP = 4;
const OPTIONS_CONTAINER_PADDING = 16;
const OPTION_BUTTON_BORDER_RADIUS = 12;
const OPTION_BUTTON_PADDING = 16;
const OPTION_BUTTON_MARGIN_BOTTOM = 12;
const OPTION_BUTTON_BORDER_WIDTH = 1;
const OPTION_TEXT_MARGIN_LEFT = 16;
const LOGOUT_BUTTON_BORDER_RADIUS = 12;
const LOGOUT_BUTTON_PADDING = 16;
const LOGOUT_BUTTON_MARGIN = 16;
const LOGOUT_BUTTON_BORDER_WIDTH = 1;
const LOGOUT_TEXT_MARGIN_LEFT = 8;
const LOADING_TEXT_MARGIN_TOP = 10;
const ICON_SIZE = 24;
const STAT_ICON_SIZE = 24;
const AVATAR_DEFAULT = require('../images/avatar.png');
const BACKGROUND_IMAGE = require('../images/back.png');

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  GOLD: '#FFD700',
  ORANGE: '#FF9F1C',
  ERROR: '#FF6B6B',
  HEADER_BACKGROUND: 'rgba(3, 10, 36, 0.8)',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.1)',
  HEADER_BUTTON_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  CARD_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  CARD_BORDER: 'rgba(26, 221, 219, 0.1)',
  REFRESH_PROGRESS_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  LOGOUT_BUTTON_BACKGROUND: 'rgba(255, 107, 107, 0.1)',
  LOGOUT_BUTTON_BORDER: 'rgba(255, 107, 107, 0.3)',
  AVATAR_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
};

// Constantes de valores por defecto
const DEFAULT_USER_DATA = {
  username: '',
  email: '',
  avatar: null,
  lastLogin: null,
  preferences: {
    theme: 'light',
    notifications: true
  },
  stats: {
    tasksCompleted: 0,
    habitsStreak: 0,
    lastActive: null
  },
};

const DEFAULT_DETAILED_STATS = {
  totalTasks: 0,
  tasksCompleted: 0,
  tasksThisWeek: 0,
  habitsActive: 0,
  habitsCompleted: 0,
  totalHabits: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActive: null
};

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  USER_PREFERENCES: 'userPreferences',
};

// Constantes de animación
const REFRESH_ANIMATION_INPUT_RANGE = [0, 1];
const REFRESH_SCALE_OUTPUT_RANGE = [1, REFRESH_SCALE_MAX];
const REFRESH_OPACITY_OUTPUT_RANGE = [1, REFRESH_OPACITY_MIN];


const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(DEFAULT_USER_DATA);
  const [detailedStats, setDetailedStats] = useState(DEFAULT_DETAILED_STATS);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [refreshAnim] = useState(new Animated.Value(0));

  // Obtener URL del avatar
  const fetchAvatarUrl = useCallback(async (publicId) => {
    if (!publicId) return null;
    try {
      const response = await api.get(`/api/users/avatar-url/${publicId}`);
      return response.url || null;
    } catch (error) {
      console.log('Error obteniendo avatar:', error);
      return null;
    }
  }, []);

  // Cargar datos del usuario
  const loadUserData = useCallback(async () => {
    try {
      const storedUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(prevData => ({
          ...prevData,
          ...parsedUserData,
          stats: {
            ...parsedUserData.stats,
            lastActive: new Date()
          }
        }));
        
        // Calcular estadísticas detalladas
        setDetailedStats(prev => ({
          ...prev,
          currentStreak: parsedUserData.stats?.habitsStreak ?? 0,
          bestStreak: parsedUserData.stats?.bestStreak ?? 0,
          lastActive: parsedUserData.stats?.lastActive ?? null,
          tasksCompleted: parsedUserData.stats?.tasksCompleted ?? 0,
          habitsActive: parsedUserData.stats?.habitsActive ?? 0,
          habitsCompleted: parsedUserData.stats?.habitsCompleted ?? 0,
          tasksThisWeek: parsedUserData.stats?.tasksThisWeek ?? 0,
          totalTasks: parsedUserData.stats?.totalTasks ?? 0,
          totalHabits: parsedUserData.stats?.totalHabits ?? 0,
        }));
        
        // Cargar avatar
        if (parsedUserData.avatar) {
          const url = await fetchAvatarUrl(parsedUserData.avatar);
          setAvatarUrl(url || AVATAR_DEFAULT);
        } else {
          setAvatarUrl(AVATAR_DEFAULT);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del perfil:', error);
      Alert.alert(TEXTS.ERROR_LOAD, TEXTS.ERROR_LOAD_MESSAGE);
      setAvatarUrl(AVATAR_DEFAULT);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAvatarUrl]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Animación de refresh
  const triggerRefreshAnim = useCallback(() => {
    Animated.sequence([
      Animated.timing(refreshAnim, {
        toValue: 1,
        duration: REFRESH_ANIMATION_DURATION,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(refreshAnim, {
        toValue: 0,
        duration: REFRESH_ANIMATION_DURATION,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      })
    ]).start();
  }, [refreshAnim]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    triggerRefreshAnim();
    loadUserData();
  }, [loadUserData, triggerRefreshAnim]);

  // Cerrar sesión
  const handleLogout = useCallback(() => {
    Alert.alert(
      TEXTS.LOGOUT_TITLE,
      TEXTS.LOGOUT_MESSAGE,
      [
        { text: TEXTS.CANCEL, style: 'cancel' },
        {
          text: TEXTS.LOGOUT,
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Limpiar datos de la sesión
              const keysToRemove = [
                STORAGE_KEYS.USER_TOKEN,
                STORAGE_KEYS.USER_DATA,
                STORAGE_KEYS.USER_PREFERENCES
              ];
              
              await Promise.all(
                keysToRemove.map(key => AsyncStorage.removeItem(key))
              );

              // Reiniciar el estado local
              setUserData(DEFAULT_USER_DATA);
              setDetailedStats(DEFAULT_DETAILED_STATS);
              setAvatarUrl(null);

              // Navegar a la pantalla de inicio de sesión
              navigation.reset({
                index: 0,
                routes: [{ name: ROUTES.SIGN_IN }],
              });
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert(
                TEXTS.ERROR_LOGOUT,
                TEXTS.ERROR_LOGOUT_MESSAGE
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.PRIMARY}
              colors={[COLORS.PRIMARY]}
              progressBackgroundColor={COLORS.REFRESH_PROGRESS_BACKGROUND}
            />
          }
          contentContainerStyle={{ paddingBottom: SCROLL_PADDING_BOTTOM }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel={TEXTS.BACK}
            >
              <MaterialCommunityIcons 
                name="arrow-left" 
                size={ICON_SIZE} 
                color={COLORS.WHITE} 
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{TEXTS.PROFILE_TITLE}</Text>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel={TEXTS.SETTINGS}
            >
              <MaterialCommunityIcons 
                name="cog" 
                size={ICON_SIZE} 
                color={COLORS.WHITE} 
              />
            </TouchableOpacity>
          </View>

          {/* Perfil Principal */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Animated.View style={{
                transform: [{ 
                  scale: refreshAnim.interpolate({ 
                    inputRange: REFRESH_ANIMATION_INPUT_RANGE, 
                    outputRange: REFRESH_SCALE_OUTPUT_RANGE 
                  }) 
                }],
                opacity: refreshAnim.interpolate({ 
                  inputRange: REFRESH_ANIMATION_INPUT_RANGE, 
                  outputRange: REFRESH_OPACITY_OUTPUT_RANGE 
                })
              }}>
                {avatarUrl ? (
                  <Image 
                    source={typeof avatarUrl === 'string' ? { uri: avatarUrl } : avatarUrl} 
                    style={styles.avatar}
                  />
                ) : (
                  <Image 
                    source={AVATAR_DEFAULT} 
                    style={styles.avatar}
                  />
                )}
              </Animated.View>
            </View>
            <Text style={styles.userName}>{userData.username}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
          </View>

          {/* Estadísticas */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>{TEXTS.STATS_TITLE}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsGrid}
            >
              <View style={styles.statItem}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={STAT_ICON_SIZE} 
                  color={COLORS.PRIMARY} 
                />
                <Text style={styles.statValue}>{userData.stats.tasksCompleted}</Text>
                <Text style={styles.statLabel}>{TEXTS.TASKS_COMPLETED}</Text>
                <Text style={styles.statSubLabel}>
                  {detailedStats.tasksThisWeek} {TEXTS.THIS_WEEK}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons 
                  name="lightning-bolt" 
                  size={STAT_ICON_SIZE} 
                  color={COLORS.GOLD} 
                />
                <Text style={styles.statValue}>{detailedStats.habitsActive}</Text>
                <Text style={styles.statLabel}>{TEXTS.HABITS_ACTIVE}</Text>
                <Text style={styles.statSubLabel}>
                  {detailedStats.habitsCompleted} {TEXTS.COMPLETED_TODAY}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons 
                  name="fire" 
                  size={STAT_ICON_SIZE} 
                  color={COLORS.ORANGE} 
                />
                <Text style={styles.statValue}>{userData.stats.habitsStreak}</Text>
                <Text style={styles.statLabel}>{TEXTS.CURRENT_STREAK}</Text>
                <Text style={styles.statSubLabel}>
                  {TEXTS.BEST}: {detailedStats.bestStreak} {TEXTS.DAYS}
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Opciones */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => navigation.navigate('EditProfile')}
              accessibilityLabel={TEXTS.EDIT_PROFILE_LABEL}
            >
              <MaterialCommunityIcons 
                name="account-edit" 
                size={ICON_SIZE} 
                color={COLORS.PRIMARY} 
              />
              <Text style={styles.optionText}>{TEXTS.EDIT_PROFILE}</Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={ICON_SIZE} 
                color={COLORS.ACCENT} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => navigation.navigate('FaQ')}
              accessibilityLabel={TEXTS.HELP_LABEL}
            >
              <MaterialCommunityIcons 
                name="help-circle" 
                size={ICON_SIZE} 
                color={COLORS.PRIMARY} 
              />
              <Text style={styles.optionText}>{TEXTS.HELP}</Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={ICON_SIZE} 
                color={COLORS.ACCENT} 
              />
            </TouchableOpacity>
          </View>

          {/* Botón de Cerrar Sesión */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityLabel={TEXTS.LOGOUT_LABEL}
          >
            <MaterialCommunityIcons 
              name="logout" 
              size={ICON_SIZE} 
              color={COLORS.ERROR} 
            />
            <Text style={styles.logoutText}>{TEXTS.LOGOUT}</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  background: {
    flex: 1,
  },
  imageStyle: {
    opacity: BACKGROUND_OPACITY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    color: COLORS.ACCENT,
    fontSize: 18,
    marginTop: LOADING_TEXT_MARGIN_TOP,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingVertical: HEADER_PADDING_VERTICAL,
    backgroundColor: COLORS.HEADER_BACKGROUND,
    borderBottomWidth: HEADER_BORDER_WIDTH,
    borderBottomColor: COLORS.HEADER_BORDER,
  },
  headerButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: HEADER_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.HEADER_BUTTON_BACKGROUND,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    padding: PROFILE_SECTION_PADDING,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: AVATAR_CONTAINER_MARGIN_BOTTOM,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_BORDER_RADIUS,
    backgroundColor: COLORS.AVATAR_BACKGROUND,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: USER_NAME_MARGIN_BOTTOM,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.ACCENT,
    marginBottom: USER_EMAIL_MARGIN_BOTTOM,
  },
  statsContainer: {
    padding: STATS_CONTAINER_PADDING,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: STATS_GRID_PADDING_VERTICAL,
  },
  statItem: {
    width: STAT_ITEM_WIDTH,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: STAT_ITEM_BORDER_RADIUS,
    padding: STAT_ITEM_PADDING,
    alignItems: 'center',
    marginRight: STAT_ITEM_MARGIN_RIGHT,
    borderWidth: STAT_ITEM_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginVertical: STAT_VALUE_MARGIN_VERTICAL,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.ACCENT,
    textAlign: 'center',
  },
  optionsContainer: {
    padding: OPTIONS_CONTAINER_PADDING,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: OPTION_BUTTON_BORDER_RADIUS,
    padding: OPTION_BUTTON_PADDING,
    marginBottom: OPTION_BUTTON_MARGIN_BOTTOM,
    borderWidth: OPTION_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
  },
  optionText: {
    flex: 1,
    marginLeft: OPTION_TEXT_MARGIN_LEFT,
    fontSize: 16,
    color: COLORS.WHITE,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.LOGOUT_BUTTON_BACKGROUND,
    borderRadius: LOGOUT_BUTTON_BORDER_RADIUS,
    padding: LOGOUT_BUTTON_PADDING,
    margin: LOGOUT_BUTTON_MARGIN,
    borderWidth: LOGOUT_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.LOGOUT_BUTTON_BORDER,
  },
  logoutText: {
    marginLeft: LOGOUT_TEXT_MARGIN_LEFT,
    fontSize: 16,
    color: COLORS.ERROR,
    fontWeight: '500',
  },
  statSubLabel: {
    fontSize: 10,
    color: COLORS.ACCENT,
    textAlign: 'center',
    marginTop: STAT_SUB_LABEL_MARGIN_TOP,
  },
});

export default ProfileScreen;