/**
 * Tests unitarios para SubscriptionErrorView.
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => ({ colors: { error: '#f00', primary: '#0f0', background: '#000' } }));
jest.mock('../../../screens/subscription/subscriptionScreenConstants', () => ({ TEXTS: { RETRY: 'Reintentar' } }));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

import React from 'react';
import TestRenderer from 'react-test-renderer';
import SubscriptionErrorView from '../SubscriptionErrorView';

describe('SubscriptionErrorView', () => {
  it('debe montar sin lanzar', () => {
    expect(() =>
      TestRenderer.create(<SubscriptionErrorView error="Error de red" onRetry={() => {}} />)
    ).not.toThrow();
  });

  it('acepta props error y onRetry', () => {
    const onRetry = jest.fn();
    expect(() =>
      TestRenderer.create(<SubscriptionErrorView error="Mensaje" onRetry={onRetry} />)
    ).not.toThrow();
  });
});
