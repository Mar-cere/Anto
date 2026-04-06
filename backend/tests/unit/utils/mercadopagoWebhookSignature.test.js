/**
 * Tests unitarios: validación de firma de webhooks Mercado Pago
 */
import crypto from 'crypto';
import {
  extractMercadoPagoWebhookResourceId,
  verifyMercadoPagoWebhookSignature
} from '../../../utils/mercadopagoWebhookSignature.js';

describe('mercadopagoWebhookSignature', () => {
  describe('extractMercadoPagoWebhookResourceId', () => {
    it('extrae data.id', () => {
      expect(
        extractMercadoPagoWebhookResourceId({ data: { id: '12345' } })
      ).toBe('12345');
    });

    it('usa id raíz si no hay data', () => {
      expect(extractMercadoPagoWebhookResourceId({ id: '999' })).toBe('999');
    });

    it('retorna null si no hay id', () => {
      expect(extractMercadoPagoWebhookResourceId({ topic: 'payment' })).toBeNull();
    });
  });

  describe('verifyMercadoPagoWebhookSignature', () => {
    it('valida manifest id;request-id;ts;', () => {
      const secret = 'test_webhook_secret';
      const dataId = '123456';
      const xRequestId = 'req-abc';
      const ts = String(Math.floor(Date.now() / 1000));
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
      const rawXSignature = `ts=${ts}, v1=${v1}`;

      const result = verifyMercadoPagoWebhookSignature({
        rawXSignature,
        xRequestId,
        dataId,
        secret,
        maxTsSkewSec: 600,
      });

      expect(result.valid).toBe(true);
    });

    it('rechaza HMAC incorrecto', () => {
      const result = verifyMercadoPagoWebhookSignature({
        rawXSignature: 'ts=1, v1=deadbeef',
        xRequestId: 'r',
        dataId: '1',
        secret: 's',
      });
      expect(result.valid).toBe(false);
    });
  });
});
