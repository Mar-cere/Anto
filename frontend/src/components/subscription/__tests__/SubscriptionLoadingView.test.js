/**
 * Tests unitarios para SubscriptionLoadingView.
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => ({ colors: { primary: '#0f0', textSecondary: '#888' } }));
jest.mock('../../../screens/subscription/subscriptionScreenConstants', () => ({
  useSubscriptionTexts: () => ({ LOADING: 'Cargando planes...' }),
}));
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#0f0',
      textSecondary: '#888',
    },
  }),
}));

import React from 'react';
import TestRenderer from 'react-test-renderer';
import SubscriptionLoadingView from '../SubscriptionLoadingView';

describe('SubscriptionLoadingView', () => {
  it('debe montar sin lanzar', () => {
    expect(() => TestRenderer.create(<SubscriptionLoadingView />)).not.toThrow();
  });
});
