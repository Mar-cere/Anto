/**
 * Tests unitarios para SubscriptionLegalSection.
 * @author AntoApp Team
 */

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#1E83D3',
      text: '#24234F',
      textSecondary: '#5C5A78',
      chromeCard: 'rgba(255,255,255,0.82)',
      border: 'rgba(36,35,79,0.12)',
    },
  }),
}));

jest.mock('../../../styles/globalStyles', () => ({ colors: { primary: '#0f0', white: '#fff', textSecondary: '#888' } }));
jest.mock('../../../screens/subscription/subscriptionScreenConstants', () => ({
  LEGAL_URLS: { TERMS_EULA: 'https://terms.test', PRIVACY: 'https://privacy.test' },
  TEXTS: { LEGAL_TITLE: 'Legal', TERMS_EULA_LABEL: 'Términos', PRIVACY_LABEL: 'Privacidad' },
}));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('react-native/Libraries/Linking/Linking', () => ({ openURL: jest.fn().mockResolvedValue(undefined) }));

import React from 'react';
import TestRenderer from 'react-test-renderer';
import SubscriptionLegalSection from '../SubscriptionLegalSection';

describe('SubscriptionLegalSection', () => {
  it('debe montar sin lanzar con props por defecto', () => {
    expect(() => TestRenderer.create(<SubscriptionLegalSection />)).not.toThrow();
  });

  it('debe montar con title personalizado', () => {
    expect(() => TestRenderer.create(<SubscriptionLegalSection title="Términos y Política" />)).not.toThrow();
  });

  it('debe montar con compact', () => {
    expect(() => TestRenderer.create(<SubscriptionLegalSection compact />)).not.toThrow();
  });

  it('debe montar con inShell', () => {
    expect(() => TestRenderer.create(<SubscriptionLegalSection inShell />)).not.toThrow();
  });
});
