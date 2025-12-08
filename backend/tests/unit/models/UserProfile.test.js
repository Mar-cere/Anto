/**
 * Tests unitarios para modelo UserProfile
 * 
 * @author AntoApp Team
 */

import UserProfile from '../../../models/UserProfile.js';
import mongoose from 'mongoose';

describe('UserProfile Model', () => {
  describe('Validaciones', () => {
    it('debe crear un perfil válido', () => {
      const profile = new UserProfile({
        userId: new mongoose.Types.ObjectId(),
        personalInfo: {
          age: 25,
          gender: 'other'
        }
      });

      const error = profile.validateSync();
      expect(error).toBeUndefined();
    });

    it('debe requerir userId', () => {
      const profile = new UserProfile({
        personalInfo: {
          age: 25
        }
      });

      const error = profile.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
    });

    it('debe tener estructura correcta', () => {
      const profile = new UserProfile({
        userId: new mongoose.Types.ObjectId()
      });

      expect(profile.timePatterns).toBeDefined();
      expect(profile.emotionalPatterns).toBeDefined();
      expect(profile.preferences).toBeDefined();
    });
  });

  describe('Estructura del modelo', () => {
    it('debe tener timePatterns como objeto', () => {
      const profile = new UserProfile({
        userId: new mongoose.Types.ObjectId()
      });

      expect(profile.timePatterns).toBeDefined();
      expect(typeof profile.timePatterns).toBe('object');
    });

    it('debe tener preferences como objeto', () => {
      const profile = new UserProfile({
        userId: new mongoose.Types.ObjectId()
      });

      expect(profile.preferences).toBeDefined();
      expect(typeof profile.preferences).toBe('object');
    });
  });
});

