/**
 * Tests unitarios para SettingsConfirmModal.
 * @author AntoApp Team
 */

jest.mock('../../../screens/settings/settingsScreenConstants', () => ({
  COLORS: {
    MODAL_OVERLAY: 'rgba(0,0,0,0.5)',
    MODAL_BACKGROUND: '#1D2B5F',
    ITEM_BORDER: '#333',
    WHITE: '#fff',
    ACCENT: '#aaa',
    PRIMARY: '#0f0',
    MODAL_BUTTON_CANCEL: '#222',
    MODAL_BUTTON_DELETE: '#400',
    ERROR: '#f00',
  },
  MODAL_WIDTH: '80%',
  TEXTS: { CONFIRM: 'Confirmar', CANCEL: 'Cancelar' },
}));

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
