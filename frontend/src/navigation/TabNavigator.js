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
import React from 'react';
import ChatScreen from '../screens/ChatScreen';
import DashScreen from '../screens/DashScreen';
import FaQScreen from '../screens/FaQScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../styles/globalStyles';

const Tab = createBottomTabNavigator();

// Constantes de estilos del Tab Bar
const TAB_BAR_BACKGROUND = '#1D1B70';
const TAB_BAR_ACTIVE_TINT = colors.white;
const TAB_BAR_INACTIVE_TINT = '#A3ADDB';

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICONS[route.name] || 'help-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: { backgroundColor: TAB_BAR_BACKGROUND },
        tabBarActiveTintColor: TAB_BAR_ACTIVE_TINT,
        tabBarInactiveTintColor: TAB_BAR_INACTIVE_TINT,
      })}
    >
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

