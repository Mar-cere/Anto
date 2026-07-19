import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigationTexts } from '../hooks/useNavigationTexts';
import { SPACING } from '../constants/ui';

const Header = memo(({ greeting, userName, title, showBackButton, onBackPress }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const NAV = useNavigationTexts();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: SPACING.CHIP_INSET,
        },
        headerLeft: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.CHIP_INSET,
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
        },
        backButton: {
          padding: SPACING.sm,
          borderRadius: 12,
          backgroundColor: colors.chromeHeaderBack,
        },
        title: {
          fontSize: 22,
          fontWeight: 'bold',
          color: colors.text,
          letterSpacing: 0.5,
        },
        greeting: {
          fontSize: 19,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
          letterSpacing: 0.2,
        },
        profileButton: {
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 20,
          backgroundColor: colors.chromeHeaderProfile,
        },
      }),
    [colors],
  );

  const handleBackPress = () => {
    if (typeof onBackPress === 'function') {
      onBackPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleProfilePress = () => {
    try {
      const tabNavigator = navigation.getParent();

      if (tabNavigator && tabNavigator.getState) {
        const state = tabNavigator.getState();
        if (state?.type === 'tab') {
          tabNavigator.navigate('Perfil');
          return;
        }
      }

      navigation.navigate('MainTabs', { screen: 'Perfil' });
    } catch (error) {
      console.error('Error al navegar a Perfil:', error);
      try {
        navigation.navigate('Perfil');
      } catch (e) {
        console.error('Error en fallback de navegación:', e);
      }
    }
  };

  if (showBackButton && !title) {
    return (
      <View style={styles.headerContainer} accessibilityRole="header">
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={NAV.HEADER_BACK_LABEL}
            accessibilityHint={NAV.HEADER_BACK_HINT}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (title && showBackButton) {
    return (
      <View style={styles.headerContainer} accessibilityRole="header">
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={NAV.HEADER_BACK_LABEL}
            accessibilityHint={NAV.HEADER_BACK_HINT}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        </View>
      </View>
    );
  }

  const resolvedGreeting =
    greeting !== undefined && greeting !== null
      ? greeting
      : NAV.HEADER_DEFAULT_GREETING;

  return (
    <View style={styles.headerContainer} accessibilityRole="header">
      <View style={styles.headerLeft}>
        {resolvedGreeting ? (
          <Text style={styles.greeting} accessibilityRole="header">
            {resolvedGreeting}
          </Text>
        ) : null}
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.profileButton}
          accessibilityRole="button"
          accessibilityLabel={NAV.HEADER_PROFILE_LABEL}
          accessibilityHint={NAV.HEADER_PROFILE_HINT}
        >
          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

Header.displayName = 'Header';

export default Header;
