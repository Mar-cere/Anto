/**
 * Tests unitarios para SubscriptionLegalSection.
 * @author AntoApp Team
 */

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
});
