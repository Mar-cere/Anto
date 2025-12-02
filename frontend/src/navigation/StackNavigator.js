/**
 * Stack Navigator
 * 
 * Define la navegación en stack (pantallas apiladas) de la aplicación.
 * Incluye todas las pantallas principales y de autenticación, con
 * configuración de estilos globales para el header y las tarjetas.
 * 
 * @author AntoApp Team
 */

import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { ROUTES } from '../constants/routes';
import DashScreen from '../screens/DashScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FaQScreen from '../screens/FaQScreen';
import HabitsScreen from '../screens/HabitsScreen';
import HelpScreen from '../screens/HelpScreen';
import HomeScreen from '../screens/HomeScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';
import PomodoroScreen from '../screens/PomodoroScreen';
import RecoverPasswordScreen from '../screens/RecoverPasswordScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SignInScreen from '../screens/SignInScreen';
import TaskScreen from '../screens/TaskScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import CrisisDashboardScreen from '../screens/CrisisDashboardScreen';
import EmergencyAlertsHistoryScreen from '../screens/EmergencyAlertsHistoryScreen';
import SystemHealthScreen from '../screens/SystemHealthScreen';
import TherapeuticTechniquesScreen from '../screens/TherapeuticTechniquesScreen';
import TechniqueDetailScreen from '../screens/TechniqueDetailScreen';
import TherapeuticTechniquesStatsScreen from '../screens/TherapeuticTechniquesStatsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import BreathingExerciseScreen from '../screens/techniques/BreathingExerciseScreen';
import GroundingTechniqueScreen from '../screens/techniques/GroundingTechniqueScreen';
import SelfCompassionScreen from '../screens/techniques/SelfCompassionScreen';
import CommunicationToolScreen from '../screens/techniques/CommunicationToolScreen';
import { colors } from '../styles/globalStyles';
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator();

// Constantes de estilos del header
const HEADER_BACKGROUND = '#1D1B70';
const HEADER_TINT_COLOR = colors.white;
const HEADER_SHOWN = false;
const HEADER_TITLE_FONT_WEIGHT = 'bold';
const CARD_BACKGROUND = colors.background;

// Nombres de rutas adicionales (no definidas en ROUTES)
const ROUTE_NAMES = {
  FAQ: 'FaQ',
  HOME: 'Home',
  TASKS: 'Tasks',
  HABITS: 'Habits',
  EDIT_PROFILE: 'EditProfile',
  HELP: 'Help',
  POMODORO: 'Pomodoro',
  CRISIS_DASHBOARD: 'CrisisDashboard',
  EMERGENCY_ALERTS_HISTORY: 'EmergencyAlertsHistory',
  SYSTEM_HEALTH: 'SystemHealth',
  THERAPEUTIC_TECHNIQUES: 'TherapeuticTechniques',
  TECHNIQUE_DETAIL: 'TechniqueDetail',
  THERAPEUTIC_TECHNIQUES_STATS: 'TherapeuticTechniquesStats',
  SUBSCRIPTION: 'Subscription',
  TRANSACTION_HISTORY: 'TransactionHistory',
};

/**
 * Componente Stack Navigator
 * 
 * Configura la navegación en stack como navegador principal de la aplicación.
 * Incluye:
 * - Pantallas de autenticación (SignIn, Register, RecoverPassword, etc.)
 * - TabNavigator para las pantallas principales con tabs
 * - Otras pantallas (Tasks, Habits, Pomodoro, EditProfile, Help, etc.)
 * 
 * El header está oculto por defecto para permitir headers personalizados
 * en cada pantalla.
 * 
 * @returns {JSX.Element} Stack Navigator con todas las pantallas configuradas
 */
const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTE_NAMES.HOME}
      screenOptions={{
        headerStyle: { backgroundColor: HEADER_BACKGROUND },
        headerTintColor: HEADER_TINT_COLOR,
        headerShown: HEADER_SHOWN,
        headerTitleStyle: { fontWeight: HEADER_TITLE_FONT_WEIGHT },
        cardStyle: { backgroundColor: CARD_BACKGROUND }
      }}
    >
      {/* Pantalla inicial */}
      <Stack.Screen 
        name={ROUTE_NAMES.HOME} 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      
      {/* Pantallas de autenticación */}
      <Stack.Screen 
        name={ROUTES.SIGN_IN} 
        component={SignInScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.REGISTER} 
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.RECOVER_PASSWORD} 
        component={RecoverPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.VERIFY_CODE} 
        component={VerifyCodeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTES.NEW_PASSWORD} 
        component={NewPasswordScreen}
        options={{ headerShown: false }}
      />
      
      {/* Tab Navigator para pantallas principales */}
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      
      {/* Otras pantallas */}
      <Stack.Screen 
        name={ROUTES.DASHBOARD} 
        component={DashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.TASKS} 
        component={TaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.HABITS} 
        component={HabitsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.POMODORO} 
        component={PomodoroScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.EDIT_PROFILE} 
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.HELP} 
        component={HelpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.FAQ} 
        component={FaQScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.CRISIS_DASHBOARD} 
        component={CrisisDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.EMERGENCY_ALERTS_HISTORY} 
        component={EmergencyAlertsHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.SYSTEM_HEALTH} 
        component={SystemHealthScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.THERAPEUTIC_TECHNIQUES} 
        component={TherapeuticTechniquesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.TECHNIQUE_DETAIL} 
        component={TechniqueDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.THERAPEUTIC_TECHNIQUES_STATS} 
        component={TherapeuticTechniquesStatsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.SUBSCRIPTION} 
        component={SubscriptionScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name={ROUTE_NAMES.TRANSACTION_HISTORY}
        component={TransactionHistoryScreen}
        options={{ headerShown: false }}
      />
      
      {/* Pantallas de técnicas interactivas */}
      <Stack.Screen
        name="BreathingExercise"
        component={BreathingExerciseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroundingTechnique"
        component={GroundingTechniqueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelfCompassion"
        component={SelfCompassionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CommunicationTool"
        component={CommunicationToolScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
