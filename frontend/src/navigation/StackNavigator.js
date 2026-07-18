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
import React, { useMemo } from 'react';
import { ROUTES } from '../constants/routes';
import DashScreen from '../screens/DashScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FaQScreen from '../screens/FaQScreen';
import HomeScreen from '../screens/HomeScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';
import PomodoroScreen from '../screens/PomodoroScreen';
import TechniquesHubScreen from '../screens/TechniquesHubScreen';
import RecoverPasswordScreen from '../screens/RecoverPasswordScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SignInScreen from '../screens/SignInScreen';
import TasksAndHabitsScreen from '../screens/TasksAndHabitsScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import SystemHealthScreen from '../screens/SystemHealthScreen';
import CrisisDashboardScreen from '../screens/CrisisDashboardScreen';
import EmergencyAlertsHistoryScreen from '../screens/EmergencyAlertsHistoryScreen';
import InterventionGraphScreen from '../screens/InterventionGraphScreen';
import TechniqueDetailScreen from '../screens/TechniqueDetailScreen';
import TherapeuticTechniquesStatsScreen from '../screens/TherapeuticTechniquesStatsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import BreathingExerciseScreen from '../screens/techniques/BreathingExerciseScreen';
import GroundingTechniqueScreen from '../screens/techniques/GroundingTechniqueScreen';
import SelfCompassionScreen from '../screens/techniques/SelfCompassionScreen';
import CommunicationToolScreen from '../screens/techniques/CommunicationToolScreen';
import GratitudeJournalScreen from '../screens/techniques/GratitudeJournalScreen';
import AbcRecordScreen from '../screens/techniques/AbcRecordScreen';
import ExposureHierarchyScreen from '../screens/techniques/ExposureHierarchyScreen';
import BehavioralActivationScreen from '../screens/techniques/BehavioralActivationScreen';
import AutomaticThoughtRecordScreen from '../screens/techniques/AutomaticThoughtRecordScreen';
import ActivitySuggestionScreen from '../screens/techniques/ActivitySuggestionScreen';
import MindfulnessScreen from '../screens/techniques/MindfulnessScreen';
import SelfCareScreen from '../screens/techniques/SelfCareScreen';
import TimeoutTechniqueScreen from '../screens/techniques/TimeoutTechniqueScreen';
import BoundarySettingScreen from '../screens/techniques/BoundarySettingScreen';
import TaskBreakScreen from '../screens/techniques/TaskBreakScreen';
import GriefSupportScreen from '../screens/techniques/GriefSupportScreen';
import MemoryExerciseScreen from '../screens/techniques/MemoryExerciseScreen';
import ConnectionExerciseScreen from '../screens/techniques/ConnectionExerciseScreen';
import SocialActivityScreen from '../screens/techniques/SocialActivityScreen';
import PsychoeducationLibraryScreen from '../screens/techniques/PsychoeducationLibraryScreen';
import PsychoeducationModuleScreen from '../screens/techniques/PsychoeducationModuleScreen';
import MicroGuideScreen from '../screens/techniques/MicroGuideScreen';
import MicroGuideLibraryScreen from '../screens/techniques/MicroGuideLibraryScreen';
import AboutScreen from '../screens/AboutScreen';
import AIPrivacyScreen from '../screens/AIPrivacyScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import SummaryScreen from '../screens/SummaryScreen';
import SessionInsightScreen from '../screens/SessionInsightScreen';
import WeeklyInsightScreen from '../screens/WeeklyInsightScreen';
import FocusOnboardingScreen from '../screens/focus/FocusOnboardingScreen';
import FocusProgressScreen from '../screens/focus/FocusProgressScreen';
import UserFactsScreen from '../screens/userFacts/UserFactsScreen';
import ExperientialPatternsScreen from '../screens/experientialPatterns/ExperientialPatternsScreen';
import ScheduledSessionsScreen from '../screens/scheduledSessions/ScheduledSessionsScreen';
import { useTheme } from '../context/ThemeContext';
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator();

const HEADER_SHOWN = false;
const HEADER_TITLE_FONT_WEIGHT = 'bold';

// Nombres de rutas adicionales (no definidas en ROUTES)
const ROUTE_NAMES = {
  FAQ: 'FaQ',
  HOME: 'Home',
  TASKS: 'Tasks',
  HABITS: 'Habits',
  EDIT_PROFILE: 'EditProfile',
  POMODORO: 'Pomodoro',
  TECHNIQUES: 'Techniques',
  SYSTEM_HEALTH: 'SystemHealth',
  CRISIS_DASHBOARD: 'CrisisDashboard',
  EMERGENCY_ALERTS_HISTORY: 'EmergencyAlertsHistory',
  INTERVENTION_GRAPH: 'InterventionGraph',
  THERAPEUTIC_TECHNIQUES: 'TherapeuticTechniques',
  TECHNIQUE_DETAIL: 'TechniqueDetail',
  THERAPEUTIC_TECHNIQUES_STATS: 'TherapeuticTechniquesStats',
  SUBSCRIPTION: 'Subscription',
  TRANSACTION_HISTORY: 'TransactionHistory',
  ABOUT: 'About',
  AI_PRIVACY: 'AIPrivacy',
  ACTIVITY_SUMMARY: 'ActivitySummary',
  SESSION_INSIGHT: 'SessionInsight',
  WEEKLY_INSIGHT: 'WeeklyInsight',
  CHANGE_PASSWORD: 'ChangePassword',
};

/**
 * Componente Stack Navigator
 * 
 * Configura la navegación en stack como navegador principal de la aplicación.
 * Incluye:
 * - Pantallas de autenticación (SignIn, Register, RecoverPassword, etc.)
 * - TabNavigator para las pantallas principales con tabs
 * - Otras pantallas (Tasks, Habits, Pomodoro, EditProfile, FAQ, etc.)
 * 
 * El header está oculto por defecto para permitir headers personalizados
 * en cada pantalla.
 * 
 * @returns {JSX.Element} Stack Navigator con todas las pantallas configuradas
 */
const StackNavigator = ({ initialRouteName = ROUTE_NAMES.HOME }) => {
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.navigationHeader },
      headerTintColor: colors.white,
      headerShown: HEADER_SHOWN,
      headerTitleStyle: { fontWeight: HEADER_TITLE_FONT_WEIGHT },
      cardStyle: { backgroundColor: colors.navigationCard },
    }),
    [colors],
  );

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={screenOptions}
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
      />
      <Stack.Screen
        name={ROUTES.VERIFY_EMAIL}
        component={VerifyEmailScreen}
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
        options={{ headerShown: false, animation: 'none' }}
      />
      
      {/* Otras pantallas */}
      <Stack.Screen 
        name={ROUTES.DASHBOARD} 
        component={DashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.TASKS} 
        component={TasksAndHabitsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.HABITS} 
        component={TasksAndHabitsScreen}
        initialParams={{ tab: 'habits' }}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.TECHNIQUES} 
        component={TechniquesHubScreen}
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
        name={ROUTE_NAMES.FAQ} 
        component={FaQScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.ACTIVITY_SUMMARY}
        component={SummaryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.SESSION_INSIGHT}
        component={SessionInsightScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.WEEKLY_INSIGHT}
        component={WeeklyInsightScreen}
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
        name={ROUTE_NAMES.INTERVENTION_GRAPH}
        component={InterventionGraphScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ROUTE_NAMES.THERAPEUTIC_TECHNIQUES} 
        component={TechniquesHubScreen}
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
      <Stack.Screen
        name="GratitudeJournal"
        component={GratitudeJournalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AbcRecord"
        component={AbcRecordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExposureHierarchy"
        component={ExposureHierarchyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BehavioralActivation"
        component={BehavioralActivationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AutomaticThoughtRecord"
        component={AutomaticThoughtRecordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActivitySuggestion"
        component={ActivitySuggestionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Mindfulness"
        component={MindfulnessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelfCare"
        component={SelfCareScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TimeoutTechnique"
        component={TimeoutTechniqueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BoundarySetting"
        component={BoundarySettingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskBreak"
        component={TaskBreakScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GriefSupport"
        component={GriefSupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MemoryExercise"
        component={MemoryExerciseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConnectionExercise"
        component={ConnectionExerciseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SocialActivity"
        component={SocialActivityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PsychoeducationLibrary"
        component={PsychoeducationLibraryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PsychoeducationModule"
        component={PsychoeducationModuleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MicroGuideLibrary"
        component={MicroGuideLibraryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MicroGuide"
        component={MicroGuideScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.ABOUT}
        component={AboutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.AI_PRIVACY}
        component={AIPrivacyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.CHANGE_PASSWORD}
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      
      {/* Focus accompaniment screens (#2) */}
      <Stack.Screen
        name={ROUTES.FOCUS_ONBOARDING}
        component={FocusOnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.FOCUS_PROGRESS}
        component={FocusProgressScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.USER_FACTS}
        component={UserFactsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.EXPERIENTIAL_PATTERNS}
        component={ExperientialPatternsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.SCHEDULED_SESSIONS}
        component={ScheduledSessionsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
