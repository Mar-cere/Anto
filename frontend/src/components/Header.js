import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { colors } from '../styles/globalStyles';

const Header = memo(({ greeting, userName, userAvatar, title, showBackButton }) => {
  const navigation = useNavigation();
  
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };
  
  const handleProfilePress = () => {
    try {
      // Verificar si estamos dentro de un Tab Navigator
      const tabNavigator = navigation.getParent();
      
      if (tabNavigator && tabNavigator.getState) {
        const state = tabNavigator.getState();
        // Si el estado tiene type 'tab', estamos en un Tab Navigator
        if (state?.type === 'tab') {
          // Navegar usando el Tab Navigator directamente
          tabNavigator.navigate('Perfil');
          return;
        }
      }

      // Si no estamos en un Tab Navigator, navegar a MainTabs con la pantalla específica
      navigation.navigate('MainTabs', { screen: 'Perfil' });
    } catch (error) {
      console.error('Error al navegar a Perfil:', error);
      // Fallback: intentar navegar directamente
      try {
        navigation.navigate('Perfil');
      } catch (e) {
        console.error('Error en fallback de navegación:', e);
      }
    }
  };
  
  // Si se pasa title y showBackButton, renderizar header simple con botón de retroceso
  if (title && showBackButton) {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    );
  }

  // Header original con greeting y avatar
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <Text style={styles.greeting}>{greeting || 'Bienvenido'}</Text>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          onPress={handleProfilePress}
          style={styles.avatarContainer}
        >
          {userAvatar ? (
            <Image 
              source={{ uri: userAvatar }} 
              style={styles.avatar}
              defaultSource={require('../images/avatar.png')}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={24} color="#A3B8E8" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 20,
    color: '#A3B8E8',
    marginBottom: 4,
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: '#1ADDDB',
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header;
