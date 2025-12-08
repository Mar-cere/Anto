/**
 * Tests unitarios para servicio de caché
 * 
 * @author AntoApp Team
 */

// Importar la clase directamente si es posible, o trabajar con la instancia singleton
import cacheService from '../../../services/cacheService.js';

describe('CacheService', () => {
  beforeEach(() => {
    // Limpiar caché antes de cada test
    if (cacheService.memoryCache) {
      cacheService.memoryCache.clear();
    }
    // Asegurar que no use Redis en tests
    cacheService.useRedis = false;
  });

  describe('generateKey', () => {
    it('debe generar clave simple con string', () => {
      const key = cacheService.generateKey('test', 'key123');
      expect(key).toBe('test:key123');
    });

    it('debe generar clave con objeto usando base64', () => {
      const key = cacheService.generateKey('test', { userId: '123', type: 'user' });
      expect(key).toContain('test:');
      expect(key.length).toBeGreaterThan('test:'.length);
    });

    it('debe generar claves diferentes para objetos diferentes', () => {
      const key1 = cacheService.generateKey('test', { userId: '123' });
      const key2 = cacheService.generateKey('test', { userId: '456' });
      expect(key1).not.toBe(key2);
    });
  });

  describe('get y set (caché en memoria)', () => {
    it('debe guardar y recuperar un valor', async () => {
      const key = 'test:key1';
      const value = { data: 'test value' };

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('debe retornar null para clave que no existe', async () => {
      const result = await cacheService.get('test:nonexistent');
      expect(result).toBeNull();
    });

    it('debe expirar valores después del TTL', async () => {
      const key = 'test:expiring';
      const value = { data: 'test' };

      // Establecer con TTL muy corto (1ms)
      await cacheService.set(key, value, 0.001);

      // Esperar un poco más que el TTL
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('debe mantener valores dentro del TTL', async () => {
      const key = 'test:valid';
      const value = { data: 'test' };

      await cacheService.set(key, value, 1000); // 1 segundo

      const result = await cacheService.get(key);
      expect(result).toEqual(value);
    });
  });

  describe('delete', () => {
    it('debe eliminar un valor del caché', async () => {
      const key = 'test:delete';
      const value = { data: 'test' };

      await cacheService.set(key, value);
      await cacheService.delete(key);

      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('debe manejar eliminación de clave que no existe', async () => {
      await expect(cacheService.delete('test:nonexistent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('debe limpiar todo el caché', async () => {
      await cacheService.set('test:key1', { data: '1' });
      await cacheService.set('test:key2', { data: '2' });

      await cacheService.clear();

      expect(await cacheService.get('test:key1')).toBeNull();
      expect(await cacheService.get('test:key2')).toBeNull();
    });
  });

  describe('deletePattern', () => {
    it('debe eliminar claves que coincidan con el patrón', async () => {
      await cacheService.set('test:user:123:profile', { data: '1' });
      await cacheService.set('test:user:123:stats', { data: '2' });
      await cacheService.set('test:user:456:profile', { data: '3' });
      await cacheService.set('test:other:key', { data: '4' });

      const deleted = await cacheService.deletePattern('test:user:123:*');

      expect(deleted).toBe(2);
      expect(await cacheService.get('test:user:123:profile')).toBeNull();
      expect(await cacheService.get('test:user:123:stats')).toBeNull();
      expect(await cacheService.get('test:user:456:profile')).not.toBeNull();
      expect(await cacheService.get('test:other:key')).not.toBeNull();
    });
  });

  describe('invalidateUserCache', () => {
    it('debe invalidar todas las claves de caché de un usuario', async () => {
      const userId = '123';
      await cacheService.set(`user:${userId}:profile`, { data: '1' });
      await cacheService.set(`profile:${userId}:data`, { data: '2' });
      await cacheService.set(`subscription:${userId}:info`, { data: '3' });
      await cacheService.set(`stats:${userId}:summary`, { data: '4' });
      await cacheService.set('user:456:profile', { data: '5' }); // Otro usuario

      const deleted = await cacheService.invalidateUserCache(userId);

      expect(deleted).toBeGreaterThan(0);
      expect(await cacheService.get(`user:${userId}:profile`)).toBeNull();
      expect(await cacheService.get('user:456:profile')).not.toBeNull();
    });
  });

  describe('getStats', () => {
    it('debe retornar estadísticas del caché en memoria', async () => {
      await cacheService.set('test:key1', { data: '1' });
      await cacheService.set('test:key2', { data: '2' });

      const stats = await cacheService.getStats();

      expect(stats.type).toBe('memory');
      expect(stats.keys).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getOrSet', () => {
    it('debe retornar valor del caché si existe', async () => {
      const key = 'test:getorset';
      const cachedValue = { data: 'cached' };
      await cacheService.set(key, cachedValue);

      const result = await cacheService.getOrSet(
        key,
        async () => ({ data: 'new' }),
        1000
      );

      expect(result).toEqual(cachedValue);
    });

    it('debe ejecutar función y guardar resultado si no existe en caché', async () => {
      const key = 'test:getorset2';
      let callCount = 0;

      const result = await cacheService.getOrSet(
        key,
        async () => {
          callCount++;
          return { data: 'new', count: callCount };
        },
        1000
      );

      expect(result.data).toBe('new');
      expect(callCount).toBe(1);

      // Verificar que se guardó en caché
      const cached = await cacheService.get(key);
      expect(cached).toEqual(result);
    });

    it('debe ejecutar función nuevamente si el valor expiró', async () => {
      const key = 'test:getorset3';
      let callCount = 0;

      const fetcher = async () => {
        callCount++;
        return { data: 'new', count: callCount };
      };

      // Primera llamada
      await cacheService.getOrSet(key, fetcher, 0.001);
      expect(callCount).toBe(1);

      // Esperar a que expire
      await new Promise(resolve => setTimeout(resolve, 10));

      // Segunda llamada (debe ejecutar fetcher nuevamente)
      const result = await cacheService.getOrSet(key, fetcher, 1000);
      expect(callCount).toBe(2);
      expect(result.count).toBe(2);
    });
  });

  describe('cleanExpired', () => {
    it('debe limpiar entradas expiradas del caché', async () => {
      await cacheService.set('test:expired1', { data: '1' }, 0.001);
      await cacheService.set('test:expired2', { data: '2' }, 0.001);
      await cacheService.set('test:valid', { data: '3' }, 1000);

      // Esperar a que expiren
      await new Promise(resolve => setTimeout(resolve, 10));

      cacheService.cleanExpired();

      expect(await cacheService.get('test:expired1')).toBeNull();
      expect(await cacheService.get('test:expired2')).toBeNull();
      expect(await cacheService.get('test:valid')).not.toBeNull();
    });
  });
});

