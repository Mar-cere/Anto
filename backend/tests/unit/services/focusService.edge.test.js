/**
 * Tests de edge cases y blindaje para focusService.
 */
import { jest } from '@jest/globals';

describe('focusService edge cases', () => {
  let User;
  let focusService;
  let FOCUS_STATUS;
  
  beforeAll(async () => {
    User = (await import('../../../models/User.js')).default;
    focusService = await import('../../../services/focusService.js');
    FOCUS_STATUS = (await import('../../../constants/focusThemes.js')).FOCUS_STATUS;
  });

  describe('calculateCurrentWeek edge cases', () => {
    it('debe manejar fecha de inicio futura', async () => {
      // Crear usuario con foco que tiene startedAt en el futuro
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const mockUser = {
        activeFocus: {
          themeId: 'anxiety',
          startedAt: futureDate,
          durationWeeks: 4,
          status: FOCUS_STATUS.ACTIVE,
        }
      };
      
      User.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      });
      
      const result = await focusService.getActiveFocus('user123', 'es');
      
      // Debe devolver semana 1 para fechas futuras
      expect(result.weekNumber).toBe(1);
    });
  });

  describe('startFocus blindaje', () => {
    it('debe permitir iniciar nuevo foco si el anterior está completed', async () => {
      const mockUser = {
        _id: 'user123',
        activeFocus: {
          themeId: 'anxiety',
          status: FOCUS_STATUS.COMPLETED,
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      
      User.findById = jest.fn().mockResolvedValue(mockUser);
      
      // No debe lanzar error ALREADY_ACTIVE
      await expect(
        focusService.startFocus('user123', { themeId: 'boundaries' })
      ).resolves.toBeDefined();
    });

    it('debe permitir iniciar nuevo foco si el anterior está paused', async () => {
      const mockUser = {
        _id: 'user123',
        activeFocus: {
          themeId: 'anxiety',
          status: FOCUS_STATUS.PAUSED,
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };
      
      User.findById = jest.fn().mockResolvedValue(mockUser);
      
      // No debe lanzar error ALREADY_ACTIVE
      await expect(
        focusService.startFocus('user123', { themeId: 'selfCare' })
      ).resolves.toBeDefined();
    });
  });

  describe('getActiveFocus con tema inexistente', () => {
    it('debe devolver null si el tema ya no existe en el catálogo', async () => {
      const mockUser = {
        activeFocus: {
          themeId: 'deprecated_theme_no_longer_exists',
          startedAt: new Date(),
          durationWeeks: 4,
          status: FOCUS_STATUS.ACTIVE,
        }
      };
      
      User.findById = jest.fn().mockResolvedValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      });
      
      const result = await focusService.getActiveFocus('user123', 'es');
      
      // Debe devolver null sin romper
      expect(result).toBeNull();
    });
  });
});
