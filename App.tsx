import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; 
import HomeScreen from './screens/HomeScreen'; 
import SignInScreen from './screens/SignInScreen'; 
import LogScreen from './screens/LogScreen';
import DashScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import HelpScreen from './screens/HelpScreen';
import RecoverScreen from './screens/RecoverScreen';
import HabitsScreen from './screens/HabitsScreen';
import TaskScreen from './screens/TaskScreen';
import AlarmScreen from './screens/AlarmScreen';
import JournalScreen from './screens/JournalScreen';
import TimerScreen from './screens/TimerScreen';
import ProfileScreen from './screens/ProfileScreen';


// Crea el stack de navegación
const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        {/* Pantalla de inicio */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} // Oculta el encabezado predeterminado
        />
        <Stack.Screen 
          name="SignIn" 
          component={SignInScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="LogIn" 
          component={LogScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Dash" 
          component={DashScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Help" 
          component={HelpScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Recover" 
          component={RecoverScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Habits" 
          component={HabitsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Tasks" 
          component={TaskScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Alarms" 
          component={AlarmScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Journal" 
          component={JournalScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Timer" 
          component={TimerScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;