/* global describe, expect, it */

import {
  parseChatMessagesArrayFromStorage,
  parseGuestHandoffPendingFromStorage,
  parseUserIdFromUserDataStorage,
} from '../safeStorageJson';

describe('safeStorageJson', () => {
  describe('parseGuestHandoffPendingFromStorage', () => {
    it('retorna null si no es string', () => {
      expect(parseGuestHandoffPendingFromStorage(null)).toBeNull();
      expect(parseGuestHandoffPendingFromStorage(undefined)).toBeNull();
      expect(parseGuestHandoffPendingFromStorage(12)).toBeNull();
    });
    it('retorna null si JSON inválido', () => {
      expect(parseGuestHandoffPendingFromStorage('{')).toBeNull();
    });
    it('retorna null si no es objeto', () => {
      expect(parseGuestHandoffPendingFromStorage('[]')).toBeNull();
      expect(parseGuestHandoffPendingFromStorage('"x"')).toBeNull();
    });
    it('retorna null si falta summaryText o está vacío', () => {
      expect(parseGuestHandoffPendingFromStorage('{}')).toBeNull();
      expect(parseGuestHandoffPendingFromStorage('{"summaryText":""}')).toBeNull();
      expect(parseGuestHandoffPendingFromStorage('{"summaryText":"  "}')).toBeNull();
    });
    it('acepta payload válido y recorta summaryText', () => {
      expect(
        parseGuestHandoffPendingFromStorage(
          '{"summaryText":"  Hola  ","messageCount":3}'
        )
      ).toEqual({ summaryText: 'Hola', messageCount: 3 });
    });
    it('ignora messageCount no numérico y acota valores enormes', () => {
      expect(
        parseGuestHandoffPendingFromStorage(
          '{"summaryText":"x","messageCount":"bad"}'
        )
      ).toEqual({ summaryText: 'x', messageCount: 0 });
      expect(
        parseGuestHandoffPendingFromStorage(
          '{"summaryText":"x","messageCount":2000000000}'
        )?.messageCount
      ).toBe(1000000);
    });
  });

  describe('parseChatMessagesArrayFromStorage', () => {
    it('retorna [] ante JSON inválido o no array', () => {
      expect(parseChatMessagesArrayFromStorage(null)).toEqual([]);
      expect(parseChatMessagesArrayFromStorage('{')).toEqual([]);
      expect(parseChatMessagesArrayFromStorage('{}')).toEqual([]);
    });
    it('filtra ítems no objeto', () => {
      expect(
        parseChatMessagesArrayFromStorage('[{"role":"user"},null,1,"x",{"role":"assistant"}]')
      ).toHaveLength(2);
    });
  });

  describe('parseUserIdFromUserDataStorage', () => {
    it('retorna null ante entradas inválidas', () => {
      expect(parseUserIdFromUserDataStorage(null)).toBeNull();
      expect(parseUserIdFromUserDataStorage('')).toBeNull();
      expect(parseUserIdFromUserDataStorage('not json')).toBeNull();
      expect(parseUserIdFromUserDataStorage('[]')).toBeNull();
    });
    it('lee _id o id', () => {
      expect(parseUserIdFromUserDataStorage('{"_id":"abc"}')).toBe('abc');
      expect(parseUserIdFromUserDataStorage('{"id":"  z  "}')).toBe('z');
    });
    it('retorna null si no hay id', () => {
      expect(parseUserIdFromUserDataStorage('{"name":"a"}')).toBeNull();
    });
  });
});
