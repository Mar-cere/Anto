/**
 * Tests unitarios para SettingsConfirmModal.
 * @author AntoApp Team
 */

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#E8EDF8',
      primary: '#1E83D3',
      primaryBright: '#44D7FB',
      white: '#FFFFFF',
      chromeCard: 'rgba(255,255,255,0.82)',
      chromeCardBorder: 'rgba(36,35,79,0.06)',
      overlay: 'rgba(36,35,79,0.42)',
      modalSurface: 'rgba(255,255,255,0.96)',
      accentLineSoft: 'rgba(30,131,211,0.18)',
      text: '#24234F',
      textSecondary: '#5C5A78',
      textOnPrimary: '#FFFFFF',
    },
  }),
}));

jest.mock('../../../screens/settings/settingsScreenConstants', () =>
  jest.requireActual('../../../screens/settings/settingsScreenConstants'),
);

import React from 'react';
import TestRenderer from 'react-test-renderer';
import SettingsConfirmModal from '../SettingsConfirmModal';

describe('SettingsConfirmModal', () => {
  it('debe renderizar con título y mensaje sin lanzar', () => {
    expect(() =>
      TestRenderer.create(
        <SettingsConfirmModal
          visible
          onRequestClose={() => {}}
          title="Cerrar sesión"
          message="¿Estás seguro?"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )
    ).not.toThrow();
  });

  it('debe renderizar con confirmText y cancelText personalizados sin lanzar', () => {
    expect(() =>
      TestRenderer.create(
        <SettingsConfirmModal
          visible
          onRequestClose={() => {}}
          title="T"
          message="M"
          confirmText="Sí"
          cancelText="No"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )
    ).not.toThrow();
  });
});
