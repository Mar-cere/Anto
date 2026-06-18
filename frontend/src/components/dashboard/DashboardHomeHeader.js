import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useNavigationTexts } from '../../hooks/useNavigationTexts';
import { SPACING } from '../../constants/ui';
import { getDashboardDisplayName, getDashboardEyebrow, getProfileInitial } from '../../utils/dashboardHomeUtils';

const DashboardHomeHeader = memo(({ userData }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const DASH = useSectionTranslations('DASH');
  const NAV = useNavigationTexts();

  const eyebrow = useMemo(
    () => getDashboardEyebrow({ language, date: new Date() }),
    [language],
  );
  const displayName = useMemo(() => getDashboardDisplayName(userData), [userData]);
  const initial = useMemo(() => getProfileInitial(userData), [userData]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 8,
          paddingBottom: 12,
        },
        copy: {
          flex: 1,
          minWidth: 0,
          paddingRight: 12,
        },
        eyebrow: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: colors.textMuted,
          marginBottom: 6,
        },
        title: {
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.6,
          color: colors.text,
          lineHeight: 32,
        },
        profileButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.chromeHeaderProfile,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassOutline,
        },
        profileInitial: {
          fontSize: 17,
          fontWeight: '700',
          color: colors.primary,
        },
      }),
    [colors],
  );

  const handleProfilePress = () => {
    try {
      const tabNavigator = navigation.getParent();
      if (tabNavigator?.getState?.()?.type === 'tab') {
        tabNavigator.navigate('Perfil');
        return;
      }
      navigation.navigate('MainTabs', { screen: 'Perfil' });
    } catch {
      navigation.navigate('Perfil');
    }
  };

  const greetingLine = displayName
    ? DASH.HOME_GREETING_NAME.replace('{name}', displayName)
    : DASH.HOME_GREETING_FALLBACK;

  return (
    <View style={styles.container} accessibilityRole="header">
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {greetingLine}
        </Text>
      </View>
      <Pressable
        onPress={handleProfilePress}
        style={({ pressed }) => [styles.profileButton, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel={NAV.HEADER_PROFILE_LABEL}
        accessibilityHint={NAV.HEADER_PROFILE_HINT}
      >
        <Text style={styles.profileInitial}>{initial}</Text>
      </Pressable>
    </View>
  );
});

DashboardHomeHeader.displayName = 'DashboardHomeHeader';

export default DashboardHomeHeader;
