/**
 * Tests unitarios para middleware de validación
 * 
 * @author AntoApp Team
 */

import { validateUserObjectId } from '../../../middleware/validation.js';
import mongoose from 'mongoose';

describe('Validation Middleware', () => {
  describe('validateUserObjectId', () => {
    it('debe pasar con un ObjectId válido', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const req = {
        user: {
          _id: validId,
        },
        params: {
          id: validId,
        },
      };
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };
      const res = {
        status: function() { return this; },
        json: function() { return this; },
      };

      validateUserObjectId(req, res, next);

      expect(nextCalled).toBe(true);
    });

    it('debe rechazar un ObjectId inválido', () => {
      const req = {
        user: {
          _id: 'invalid-id',
        },
        params: {
          id: 'invalid-id',
        },
      };
      let statusCode;
      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function() {
          return this;
        },
      };
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };

      validateUserObjectId(req, res, next);

      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });

    it('debe rechazar si no hay user en request', () => {
      const req = {
        params: {
          id: new mongoose.Types.ObjectId().toString(),
        },
      };
      let statusCode;
      const res = {
        status: function(code) {
          statusCode = code;
          return this;
        },
        json: function() {
          return this;
        },
      };
      let nextCalled = false;
      const next = function() {
        nextCalled = true;
      };

      validateUserObjectId(req, res, next);

      // El middleware retorna 400 (BAD_REQUEST) cuando el userId no es válido
      expect(statusCode).toBe(400);
      expect(nextCalled).toBe(false);
    });
  });
});

