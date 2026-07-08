/**
 * Tests para DeviceTimezoneSync: sincroniza preferences.timezone con la zona del dispositivo.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { api } from '../../config/api';
import DeviceTimezoneSync from '../DeviceTimezoneSync';

const mockApplyLocalUser = jest.fn().mockResolvedValue(undefined);
let mockUser = null;

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, applyLocalUser: mockApplyLocalUser }),
}));

jest.mock('../../config/api', () => ({
  api: {
    put: jest.fn().mockResolvedValue({ user: { id: '1' } }),
  },
  ENDPOINTS: { UPDATE_PROFILE: '/api/users/me' },
}));

async function renderSync() {
  let tree;
  await act(async () => {
    tree = TestRenderer.create(<DeviceTimezoneSync />);
    await Promise.resolve();
  });
  return tree;
}

describe('DeviceTimezoneSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
      resolvedOptions: () => ({ timeZone: 'America/Santiago' }),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('persiste la zona del dispositivo cuando difiere de la guardada', async () => {
    mockUser = { id: '1', preferences: { timezone: 'Etc/UTC' } };

    await renderSync();

    expect(api.put).toHaveBeenCalledWith('/api/users/me', {
      preferences: { timezone: 'America/Santiago' },
    });
    expect(mockApplyLocalUser).toHaveBeenCalledWith({ id: '1' });
  });

  it('no hace PUT si la zona guardada ya coincide con la del dispositivo', async () => {
    mockUser = { id: '1', preferences: { timezone: 'America/Santiago' } };

    await renderSync();

    expect(api.put).not.toHaveBeenCalled();
  });

  it('no hace nada sin usuario autenticado', async () => {
    mockUser = null;

    await renderSync();

    expect(api.put).not.toHaveBeenCalled();
  });
});
