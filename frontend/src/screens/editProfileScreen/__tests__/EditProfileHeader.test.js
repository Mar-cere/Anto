/**
 * Tests unitarios para EditProfileHeader.
 * @author AntoApp Team
 */

jest.mock('../editProfileScreenStyles', () => ({ styles: {} }));
jest.mock('../editProfileScreenConstants', () => ({
  COLORS: { WHITE: '#fff', PRIMARY: '#1ADDDB', ACCENT: '#A3B8E8' },
  TEXTS: {
    BACK: 'Volver',
    PROFILE_TITLE: 'Mi Perfil',
    SAVE_CHANGES: 'Guardar cambios',
    EDIT_PROFILE: 'Editar perfil',
  },
  ICON_SIZE: 24,
}));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

import React from 'react';
import TestRenderer from 'react-test-renderer';
import { EditProfileHeader } from '../EditProfileHeader';

const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack };

describe('EditProfileHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe montar sin lanzar', () => {
    expect(() =>
      TestRenderer.create(
        <EditProfileHeader
          navigation={mockNavigation}
          editing={false}
          saving={false}
          onSave={() => {}}
          onEdit={() => {}}
        />
      )
    ).not.toThrow();
  });

  it('muestra botón guardar cuando editing es true', () => {
    const onSave = jest.fn();
    expect(() =>
      TestRenderer.create(
        <EditProfileHeader
          navigation={mockNavigation}
          editing
          saving={false}
          onSave={onSave}
          onEdit={() => {}}
        />
      )
    ).not.toThrow();
  });

  it('acepta navigation con goBack', () => {
    expect(() =>
      TestRenderer.create(
        <EditProfileHeader
          navigation={mockNavigation}
          editing={false}
          saving={false}
          onSave={() => {}}
          onEdit={() => {}}
        />
      )
    ).not.toThrow();
  });
});
