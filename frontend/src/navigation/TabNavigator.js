/**
 * Tab Navigator
 * 
 * Define la navegación con pestañas inferiores (Bottom Tabs) de la aplicación.
 * Se usa dentro del StackNavigator para las pantallas principales de la app.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useCallback } from 'react';
import ChatScreen from '../screens/ChatScreen';
import DashScreen from '../screens/DashScreen';
import FaQScreen from '../screens/FaQScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

// Nombres de las pestañas
const TAB_NAMES = {
  INICIO: 'Inicio',
  CHAT: 'Chat',
  PERFIL: 'Perfil',
  AJUSTES: 'Ajustes',
  FAQ: 'FaQ',
};

// Mapeo de nombres de pestañas a iconos de Ionicons
const TAB_ICONS = {
  [TAB_NAMES.INICIO]: 'home-outline',
  [TAB_NAMES.CHAT]: 'chatbubble-outline',
  [TAB_NAMES.PERFIL]: 'person-outline',
  [TAB_NAMES.AJUSTES]: 'settings-outline',
};

/**
 * Componente Tab Navigator
 * 
 * Configura la navegación con pestañas inferiores, incluyendo iconos
 * personalizados y estilos consistentes con el diseño de la aplicación.
 * 
 * @returns {JSX.Element} Tab Navigator con todas las pestañas configuradas
 */
const TabNavigator = () => {
  const { colors } = useTheme();
  const screenOptions = useCallback(
    ({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        const iconName = TAB_ICONS[route.name] || 'help-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarStyle: {
        height: 0,
        opacity: 0,
        elevation: 0,
        backgroundColor: colors.navigationHeader,
      },
      tabBarActiveTintColor: colors.white,
      tabBarInactiveTintColor: colors.tabBarInactive,
    }),
    [colors],
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen 
        name={TAB_NAMES.INICIO} 
        component={DashScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name={TAB_NAMES.CHAT} 
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name={TAB_NAMES.PERFIL} 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name={TAB_NAMES.AJUSTES} 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name={TAB_NAMES.FAQ} 
        component={FaQScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

