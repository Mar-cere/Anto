/**
 * Tests unitarios para SettingsHeader.
 * @author AntoApp Team
 */

jest.mock('../../../screens/settings/settingsScreenConstants', () => ({
  COLORS: { WHITE: '#fff' },
  ICON_SIZE: 24,
  TEXTS: { TITLE: 'Configuración', BACK: 'Volver' },
}));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

import React from 'react';
import TestRenderer from 'react-test-renderer';
import SettingsHeader from '../SettingsHeader';

describe('SettingsHeader', () => {
  it('debe montar sin lanzar', () => {
    expect(() => TestRenderer.create(<SettingsHeader onBack={() => {}} />)).not.toThrow();
  });

  it('acepta prop onBack', () => {
    const onBack = jest.fn();
    expect(() => TestRenderer.create(<SettingsHeader onBack={onBack} />)).not.toThrow();
  });
});
