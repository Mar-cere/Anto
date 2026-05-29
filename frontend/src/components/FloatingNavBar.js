import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHAT_BACK_TARGET } from '../navigation/navigationHelpers';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigationTexts } from '../hooks/useNavigationTexts';
import { SPACING } from '../constants/ui';

const BAR_BLUR = Platform.OS === 'ios' ? 76 : 48;

/** Anto.png tiene fondo negro opaco: en modo oscuro desaparece sobre surface oscuro. */
const CENTER_NAV_ICON = {
  light: require('../images/Anto.png'),
  dark: require('../../assets/icon.png'),
};

/**
 * @param {string} activeTab - 'home' | 'calendar' | 'chat' | 'pomodoro' | 'settings'
 * @param {function} onTabPress - (screen, tab) => void
 * @param {object} animValues - { translateY, opacity } Animated.Values
 * @param {string} [accessibilityLabel] - etiqueta del tablist (p. ej. desde Dash)
 * @param {number} [extraBottomOffset] - píxeles extra al offset del dock (casos raros; suma al resultado final)
 * @param {number} [slotBottomOffset] - @deprecated mismo uso que extraBottomOffset (compat con llamadas antiguas)
 */
const FloatingNavBar = ({
  activeTab,
  onTabPress,
  animValues = {},
  accessibilityLabel: barAccessibilityLabel,
  extraBottomOffset,
  slotBottomOffset,
}) => {
  const insets = useSafeAreaInsets();
  const { translateY = new Animated.Value(0), opacity = new Animated.Value(1) } = animValues;
  const navigation = useNavigation();
  const { colors, resolvedScheme } = useTheme();
  const NAV = useNavigationTexts();
  const rawBottomInset = Number(insets?.bottom);
  const safeBottomInset =
    Number.isFinite(rawBottomInset) && rawBottomInset >= 0 ? rawBottomInset : 0;
  const rawExtra = Number(extraBottomOffset ?? slotBottomOffset ?? 0);
  const bottomExtra = Number.isFinite(rawExtra) ? rawExtra : 0;
  const relief = Math.max(0, Number(SPACING.FLOATING_NAV_DOCK_INSET_RELIEF) || 0);
  const aboveSafe = Number(SPACING.FLOATING_NAV_DOCK_ABOVE_SAFE) || 0;
  const minDock = Math.max(0, Number(SPACING.FLOATING_NAV_DOCK_MIN_FROM_BOTTOM) || 0);
  const webFallback = Math.max(0, Number(SPACING.FLOATING_NAV_DOCK_FALLBACK_BOTTOM_WEB) || 0);

  const bottomInsetEffective =
    safeBottomInset > 0 ? safeBottomInset : Platform.OS === 'web' ? webFallback : 0;
  const dockBottom = Math.max(
    minDock,
    bottomInsetEffective - relief + aboveSafe + bottomExtra,
  );
  const barBlurTint = resolvedScheme === 'dark' ? 'dark' : 'light';
  const isDarkNav = resolvedScheme === 'dark';
  const centerIconSource = CENTER_NAV_ICON[isDarkNav ? 'dark' : 'light'];
  const rippleColor = useMemo(
    () => `${colors.primary}38`,
    [colors.primary],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        floatingBarSlot: {
          position: 'absolute',
          left: SPACING.SCREEN_EDGE_INSET,
          right: SPACING.SCREEN_EDGE_INSET,
          zIndex: 1000,
        },
        barChrome: {
          borderRadius: 22,
          minHeight: 64,
          overflow: 'visible',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassOutline,
          shadowColor: colors.glassShadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 22,
          elevation: 12,
        },
        /** Solo el fondo blur/tint se recorta; el logo central puede sobresalir hacia arriba. */
        barBackgroundClip: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: 22,
          overflow: 'hidden',
        },
        blurLayer: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: 22,
        },
        barTintFallback: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor:
            resolvedScheme === 'dark' ? 'rgba(8, 12, 28, 0.78)' : 'rgba(255, 255, 255, 0.58)',
          borderRadius: 22,
        },
        barContent: {
          position: 'relative',
          zIndex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          paddingTop: 6,
          backgroundColor: 'transparent',
        },
        button: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        sideButtonPressed: {
          opacity: 0.85,
        },
        tabInner: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 14,
        },
        tabInnerActive: {
          backgroundColor: colors.accentLineSoft,
        },
        activeDot: {
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.primary,
          marginTop: 4,
        },
        centerButtonContainer: {
          width: 64,
          height: 64,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: -22,
        },
        centerButton: {
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkNav ? colors.white : colors.surface,
          borderWidth: 2,
          borderColor: isDarkNav ? colors.primary : colors.accentLine,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 12,
          elevation: 10,
          overflow: 'hidden',
        },
        centerButtonActive: {
          borderColor: colors.primary,
          shadowOpacity: 0.35,
        },
        centerButtonPressed: {
          opacity: 0.92,
          transform: [{ scale: 0.97 }],
        },
        centerButtonImage: {
          width: isDarkNav ? 48 : 52,
          height: isDarkNav ? 48 : 52,
          resizeMode: 'contain',
          borderRadius: isDarkNav ? 24 : 26,
        },
      }),
    [colors, isDarkNav],
  );

  // Altura visual fija para mantener la barra en la misma posición en todas las pantallas.
  const bottomPadding = 8;

  const handleTabPress = useCallback(
    (screen, tab) => {
      try {
        if (onTabPress) {
          onTabPress(screen, tab);
          return;
        }

        const routeMap = {
          Dash: 'Inicio',
          Inicio: 'Inicio',
          Chat: 'Chat',
          Profile: 'Perfil',
          Perfil: 'Perfil',
          Settings: 'Ajustes',
          Ajustes: 'Ajustes',
          Calendar: 'Tasks',
          Tasks: 'Tasks',
          Pomodoro: 'Pomodoro',
        };

        const routeName = routeMap[screen] || screen;
        const tabNavigatorRoutes = ['Inicio', 'Chat', 'Perfil', 'Ajustes', 'FaQ'];
        const isTabNavigatorRoute = tabNavigatorRoutes.includes(routeName);

        if (isTabNavigatorRoute) {
          const tabNavigator = navigation.getParent();
          if (tabNavigator && tabNavigator.getState) {
            const state = tabNavigator.getState();
            if (state?.type === 'tab') {
              if (routeName === 'Chat') {
                void (async () => {
                  await setChatEntryBackTarget('dash');
                  tabNavigator.navigate('Chat', { chatBackTarget: CHAT_BACK_TARGET.DASH });
                })();
              } else {
                tabNavigator.navigate(routeName);
              }
              return;
            }
          }
          if (routeName === 'Chat') {
            void (async () => {
              await setChatEntryBackTarget('dash');
              navigation.navigate('MainTabs', {
                screen: 'Chat',
                params: { chatBackTarget: CHAT_BACK_TARGET.DASH },
              });
            })();
          } else {
            navigation.navigate('MainTabs', { screen: routeName });
          }
          return;
        }

        navigation.navigate(routeName);
      } catch (error) {
        console.error('Error al navegar:', error);
      }
    },
    [navigation, onTabPress]
  );

  const onNavPress = useCallback(
    (screen, tabKey) => {
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync().catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      handleTabPress(screen, tabKey);
    },
    [handleTabPress]
  );

  return (
    <View style={[styles.floatingBarSlot, { bottom: dockBottom }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.barChrome,
          {
            transform: [{ translateY }],
            opacity,
            paddingBottom: bottomPadding,
          },
        ]}
        accessibilityRole="tablist"
        accessibilityLabel={barAccessibilityLabel || NAV.MAIN_TABLIST_A11Y}
      >
        <View style={styles.barBackgroundClip} pointerEvents="none">
          <BlurView
            intensity={BAR_BLUR}
            tint={barBlurTint}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={styles.blurLayer}
          />
          <View style={styles.barTintFallback} pointerEvents="none" />
        </View>
        <View style={styles.barContent}>
          <NavTab
            active={activeTab === 'home'}
            onPress={() => onNavPress('Dash', 'home')}
            accessibilityLabel={NAV.TAB_HOME_LABEL}
            accessibilityHint={NAV.TAB_HOME_HINT}
            iconOutline="home-outline"
            iconFilled="home"
            styles={styles}
            colors={colors}
            rippleColor={rippleColor}
          />

          <NavTab
            active={activeTab === 'calendar'}
            onPress={() => onNavPress('Tasks', 'tasks')}
            accessibilityLabel={NAV.TAB_TASKS_LABEL}
            accessibilityHint={NAV.TAB_TASKS_HINT}
            iconOutline="clipboard-outline"
            iconFilled="clipboard"
            styles={styles}
            colors={colors}
            rippleColor={rippleColor}
          />

          <View style={styles.centerButtonContainer}>
            <Pressable
              testID="floating-nav-open-chat"
              style={({ pressed }) => [
                styles.centerButton,
                activeTab === 'chat' && styles.centerButtonActive,
                pressed && styles.centerButtonPressed,
              ]}
              onPress={() => onNavPress('Chat')}
              accessibilityRole="tab"
              accessibilityLabel={NAV.TAB_CHAT_LABEL}
              accessibilityState={{ selected: activeTab === 'chat' }}
              accessibilityHint={NAV.TAB_CHAT_HINT}
              android_ripple={{ color: rippleColor, borderless: false }}
            >
              <Image
                source={centerIconSource}
                style={styles.centerButtonImage}
                accessibilityIgnoresInvertColors
                onError={(e) => {
                  console.warn('Error al cargar el icono central de la navbar:', e.nativeEvent.error);
                }}
              />
            </Pressable>
          </View>

          <NavTab
            active={activeTab === 'pomodoro'}
            onPress={() => onNavPress('Pomodoro', 'pomodoro')}
            accessibilityLabel={NAV.TAB_POMODORO_LABEL}
            accessibilityHint={NAV.TAB_POMODORO_HINT}
            iconOutline="timer-outline"
            iconFilled="timer"
            styles={styles}
            colors={colors}
            rippleColor={rippleColor}
          />

          <NavTab
            active={activeTab === 'settings'}
            onPress={() => onNavPress('Settings', 'settings')}
            accessibilityLabel={NAV.TAB_SETTINGS_LABEL}
            accessibilityHint={NAV.TAB_SETTINGS_HINT}
            iconOutline="settings-outline"
            iconFilled="settings"
            styles={styles}
            colors={colors}
            rippleColor={rippleColor}
          />
        </View>
      </Animated.View>
    </View>
  );
};

function NavTab({
  active,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  iconOutline,
  iconFilled,
  styles,
  colors,
  rippleColor,
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.sideButtonPressed]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      accessibilityHint={accessibilityHint}
      android_ripple={{ color: rippleColor, borderless: true }}
      hitSlop={{ top: 6, bottom: 10, left: 4, right: 4 }}
    >
      <View style={[styles.tabInner, active && styles.tabInnerActive]}>
        <Ionicons
          name={active ? iconFilled : iconOutline}
          size={24}
          color={active ? colors.primary : colors.textSecondary}
        />
        {active ? <View style={styles.activeDot} importantForAccessibility="no" /> : null}
      </View>
    </Pressable>
  );
}

export default FloatingNavBar;
