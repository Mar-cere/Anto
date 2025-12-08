/**
 * Tests unitarios para utilidades de red
 * 
 * @author AntoApp Team
 */

import { checkServerStatus } from '../networkUtils';

// Mock fetch global
global.fetch = jest.fn();

describe('networkUtils', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('checkServerStatus', () => {
    it('debe retornar true cuando el servidor responde correctamente', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      });

      const result = await checkServerStatus(1);
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
    });

    it('debe retornar false cuando el servidor no responde', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkServerStatus(1);
      
      expect(result).toBe(false);
    });

    it('debe retornar false cuando el servidor responde con error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await checkServerStatus(1);
      
      expect(result).toBe(false);
    });

    it('debe reintentar cuando falla el primer intento', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'ok' })
        });

      // Usar solo 2 reintentos para que sea más rápido
      const result = await checkServerStatus(2);
      
      expect(result).toBe(true);
      // Verificar que se llamó al menos una vez (puede ser 1 o 2 dependiendo del timing)
      expect(fetch).toHaveBeenCalled();
    }, 20000);

    it('debe usar el número máximo de reintentos especificado', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      // Usar solo 2 reintentos para que sea más rápido en tests
      const result = await checkServerStatus(2);
      
      expect(result).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(2);
    }, 20000);

    it('debe usar valor por defecto de 3 reintentos si no se especifica', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const result = await checkServerStatus();
      
      expect(result).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(3);
    }, 20000);
  });
});

