import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHAT_BACK_TARGET } from '../navigation/navigationHelpers';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';
import { colors } from '../styles/globalStyles';

const RIPPLE = 'rgba(26, 221, 219, 0.18)';

/**
 * @param {string} activeTab - 'home' | 'calendar' | 'chat' | 'pomodoro' | 'settings'
 * @param {function} onTabPress - (screen, tab) => void
 * @param {object} animValues - { translateY, opacity } Animated.Values
 * @param {string} [accessibilityLabel] - etiqueta del tablist (p. ej. desde Dash)
 */
const FloatingNavBar = ({
  activeTab,
  onTabPress,
  animValues = {},
  accessibilityLabel: barAccessibilityLabel,
}) => {
  const { translateY = new Animated.Value(0), opacity = new Animated.Value(1) } = animValues;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const bottomPadding = Math.max(insets.bottom, 8);

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
    <View
      style={[
        styles.floatingBarSlot,
        { transform: [{ translateY: insets.bottom }] },
      ]}
      pointerEvents="box-none"
    >
    <Animated.View
      style={[
        styles.floatingBar,
        {
          transform: [{ translateY }],
          opacity,
          paddingBottom: bottomPadding,
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={barAccessibilityLabel || 'Navegación principal'}
    >
      <NavTab
        active={activeTab === 'home'}
        onPress={() => onNavPress('Dash', 'home')}
        accessibilityLabel="Inicio"
        accessibilityHint="Ir al inicio"
        iconOutline="home-outline"
        iconFilled="home"
      />

      <NavTab
        active={activeTab === 'calendar'}
        onPress={() => onNavPress('Tasks', 'tasks')}
        accessibilityLabel="Recordatorios"
        accessibilityHint="Ver tareas y recordatorios"
        iconOutline="clipboard-outline"
        iconFilled="clipboard"
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
          accessibilityLabel="floating-nav-open-chat"
          accessibilityState={{ selected: activeTab === 'chat' }}
          accessibilityHint="Abrir el chat"
          android_ripple={{ color: RIPPLE, borderless: false }}
        >
          <Image
            source={require('../images/Anto.png')}
            style={styles.centerButtonImage}
            onError={(e) => {
              console.warn('Error al cargar la imagen de Anto:', e.nativeEvent.error);
            }}
          />
        </Pressable>
      </View>

      <NavTab
        active={activeTab === 'pomodoro'}
        onPress={() => onNavPress('Pomodoro', 'pomodoro')}
        accessibilityLabel="Pomodoro"
        accessibilityHint="Abrir temporizador Pomodoro"
        iconOutline="timer-outline"
        iconFilled="timer"
      />

      <NavTab
        active={activeTab === 'settings'}
        onPress={() => onNavPress('Settings', 'settings')}
        accessibilityLabel="Ajustes"
        accessibilityHint="Abrir ajustes"
        iconOutline="settings-outline"
        iconFilled="settings"
      />
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
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.sideButtonPressed]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      accessibilityHint={accessibilityHint}
      android_ripple={{ color: RIPPLE, borderless: true }}
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

const styles = StyleSheet.create({
  floatingBarSlot: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    zIndex: 1000,
  },
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3, 10, 36, 0.96)',
    borderRadius: 22,
    minHeight: 64,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26, 221, 219, 0.35)',
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
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  tabInnerActive: {
    backgroundColor: 'rgba(26, 221, 219, 0.14)',
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
    backgroundColor: 'rgba(3, 10, 36, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(26, 221, 219, 0.25)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  centerButtonActive: {
    borderColor: colors.primary,
    shadowOpacity: 0.55,
  },
  centerButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  centerButtonImage: {
    width: 52,
    height: 52,
    resizeMode: 'cover',
    borderRadius: 26,
  },
});

export default FloatingNavBar;
