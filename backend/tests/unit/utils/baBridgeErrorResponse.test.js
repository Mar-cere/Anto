import { describe, expect, it } from '@jest/globals';
import {
  BA_BRIDGE_ERROR_CODES,
  buildBaBridgeErrorBody,
} from '../../../utils/baBridgeErrorResponse.js';

describe('buildBaBridgeErrorBody', () => {
  it('mapea códigos del servicio a códigos API estables', () => {
    expect(buildBaBridgeErrorBody('SLOT_LINK_CONFLICT', 'ocupado')).toEqual({
      success: false,
      error: 'ocupado',
      code: BA_BRIDGE_ERROR_CODES.SLOT_LINK_CONFLICT,
    });
  });

  it('usa BRIDGE_ERROR para códigos desconocidos', () => {
    expect(buildBaBridgeErrorBody('UNKNOWN', 'fallo').code).toBe(
      BA_BRIDGE_ERROR_CODES.BRIDGE_ERROR
    );
  });
});
