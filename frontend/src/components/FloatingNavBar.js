import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Componente de barra de navegación flotante
 * 
 * @param {string} activeTab - Tab activo actualmente
 * @param {function} onTabPress - Función a llamar cuando se presiona un tab
 * @param {object} animValues - Valores de animación (translateY, opacity)
 */
const FloatingNavBar = ({ activeTab, onTabPress, animValues = {} }) => {
  const { translateY = new Animated.Value(0), opacity = new Animated.Value(1) } = animValues;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // Calcular el padding inferior basado en el safe area
  const bottomPadding = Math.max(insets.bottom, 10);
  
  // Función actualizada para manejar la navegación
  const handleTabPress = (screen, tab) => {
    try {
      // Si onTabPress existe, úsalo
      if (onTabPress) {
        onTabPress(screen, tab);
        return;
      }

      // Mapeo de nombres de pantalla a nombres de ruta del TabNavigator
      const routeMap = {
        'Dash': 'Inicio',
        'Inicio': 'Inicio',
        'Chat': 'Chat',
        'Profile': 'Perfil',
        'Perfil': 'Perfil',
        'Settings': 'Ajustes',
        'Ajustes': 'Ajustes',
        'Calendar': 'Tasks',
        'Tasks': 'Tasks',
        'Pomodoro': 'Pomodoro'
      };

      // Obtener el nombre de ruta correcto
      const routeName = routeMap[screen] || screen;

      // Verificar si la ruta está en el TabNavigator (Inicio, Chat, Perfil, Ajustes, FaQ)
      const tabNavigatorRoutes = ['Inicio', 'Chat', 'Perfil', 'Ajustes', 'FaQ'];
      const isTabNavigatorRoute = tabNavigatorRoutes.includes(routeName);

      if (isTabNavigatorRoute) {
        // Intentar obtener el Tab Navigator padre
        const tabNavigator = navigation.getParent();
        
        // Verificar si estamos dentro de un Tab Navigator
        if (tabNavigator && tabNavigator.getState) {
          const state = tabNavigator.getState();
          // Si el estado tiene type 'tab', estamos en un Tab Navigator
          if (state?.type === 'tab') {
            // Navegar usando el Tab Navigator directamente
            tabNavigator.navigate(routeName);
            return;
          }
        }

        // Si no estamos en un Tab Navigator, navegar a MainTabs con la pantalla específica
        navigation.navigate('MainTabs', { screen: routeName });
        return;
      }

      // Para rutas que NO están en el TabNavigator (Tasks, Pomodoro, etc.), navegar directamente
      navigation.navigate(routeName);
    } catch (error) {
      console.error('Error al navegar:', error);
    }
  };


  return (
    <Animated.View 
      style={[
        styles.floatingBar,
        {
          transform: [{ translateY }],
          opacity,
          paddingBottom: bottomPadding
        }
      ]}
    >
      {/* Botón Home */}
      <TouchableOpacity 
        style={[styles.button, activeTab === 'home' && styles.activeButton]} 
        onPress={() => handleTabPress('Dash', 'home')}
        accessibilityRole="tab"
        accessibilityLabel="Inicio"
        accessibilityState={{ selected: activeTab === 'home' }}
        accessibilityHint="Doble toque para ir al inicio"
      >
        <View style={styles.iconContainer}>
          {/* Usar un icono de texto como fallback */}
          <Text style={[styles.iconText, activeTab === 'home' && styles.activeIconText]}>🏠</Text>
        </View>
      </TouchableOpacity>
      
      {/* Botón Recordatorios */}
      <TouchableOpacity 
        style={[styles.button, activeTab === 'calendar' && styles.activeButton]} 
        onPress={() => handleTabPress('Tasks', 'tasks')}
        accessibilityRole="tab"
        accessibilityLabel="Recordatorios"
        accessibilityState={{ selected: activeTab === 'calendar' }}
        accessibilityHint="Doble toque para ver tareas y recordatorios"
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.iconText, activeTab === 'calendar' && styles.activeIconText]}>📋</Text>
        </View>
      </TouchableOpacity>
      
      {/* Botón central Chat con imagen de Anto */}
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity 
          style={styles.centerButton}
          onPress={() => handleTabPress('Chat')}
          accessibilityRole="tab"
          accessibilityLabel="Chat con Anto"
          accessibilityState={{ selected: activeTab === 'chat' }}
          accessibilityHint="Doble toque para abrir el chat"
        >
          {/* Intentar cargar la imagen de Anto, con fallback a emoji */}
          <Image 
            source={require('../images/Anto.png')}
            style={styles.centerButtonImage}
            onError={(e) => {
              console.warn('Error al cargar la imagen de Anto:', e.nativeEvent.error);
            }}
          />
        </TouchableOpacity>
      </View>

      {/* Botón Pomodoro */}
      <TouchableOpacity 
        style={[styles.button, activeTab === 'pomodoro' && styles.activeButton]} 
        onPress={() => handleTabPress('Pomodoro', 'pomodoro')}
        accessibilityRole="tab"
        accessibilityLabel="Pomodoro"
        accessibilityState={{ selected: activeTab === 'pomodoro' }}
        accessibilityHint="Doble toque para temporizador Pomodoro"
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.iconText, activeTab === 'pomodoro' && styles.activeIconText]}>⏲️</Text>
        </View>
      </TouchableOpacity>
      
      {/* Botón Ajustes */}
      <TouchableOpacity 
        style={[styles.button, activeTab === 'settings' && styles.activeButton]} 
        onPress={() => handleTabPress('Settings', 'settings')}
        accessibilityRole="tab"
        accessibilityLabel="Ajustes"
        accessibilityState={{ selected: activeTab === 'settings' }}
        accessibilityHint="Doble toque para abrir ajustes"
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.iconText, activeTab === 'settings' && styles.activeIconText]}>⚙️</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingBar: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(3, 10, 36, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 80, // Altura base
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 7,
    borderWidth: 2,
    borderColor: 'rgba(26, 221, 219, 0.3)',
    borderBottomWidth: 0,
    zIndex: 1000, // Asegurar que esté por encima de otros elementos
  },
  button: {
    flex: 1,
    height: '96%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 1,
  },
  activeButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#1ADDDB',
    backgroundColor: 'rgba(26, 221, 219, 0.08)',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 26,
    height: 26,
    tintColor: '#A3B8E8',
  },
  activeIcon: {
    width: 28,
    height: 28,
    tintColor: '#1ADDDB',
  },
  iconText: {
    fontSize: 26,
    color: '#A3B8E8',
  },
  activeIconText: {
    color: '#1ADDDB',
    fontSize: 28,
  },
  text: {
    fontSize: 10,
    color: '#A3B8E8',
  },
  activeText: {
    color: '#1ADDDB',
  },
  centerButtonContainer: {
    width: 62,
    height: 62,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1ADDDB',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden', // Para asegurar que la imagen respete el borderRadius
  },
  centerButtonImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});

export default FloatingNavBar; 