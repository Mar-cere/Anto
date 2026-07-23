import { taskApiCopy } from '../../../utils/taskApiCopy.js';
import { habitApiCopy } from '../../../utils/habitApiCopy.js';
import { chatApiCopy } from '../../../utils/chatApiCopy.js';
import { paymentApiCopy } from '../../../utils/paymentApiCopy.js';
import { resolveRequestLanguage } from '../../../utils/apiLanguage.js';

describe('product API copy (tasks, habits, chat, payments)', () => {
  it('taskApiCopy en inglés', () => {
    const copy = taskApiCopy('en');
    expect(copy.notFound).toBe('Task not found');
    expect(copy.subtasksAdded(2)).toBe('2 subtask(s) added');
  });

  it('habitApiCopy en inglés', () => {
    const copy = habitApiCopy('en');
    expect(copy.archivedSuccess(true)).toBe('Habit archived');
  });

  it('chatApiCopy messageLimit en inglés', () => {
    const copy = chatApiCopy('en');
    expect(copy.messageLimit(50)).toMatch(/50/);
    expect(copy.subscriptionRequired).toMatch(/subscription/i);
    expect(copy.sessionIntentionTooLate).toMatch(/first message/i);
    expect(copy.streamError).toBe('Streaming error');
  });

  it('paymentApiCopy en inglés', () => {
    const copy = paymentApiCopy('en');
    expect(copy.checkoutError).toMatch(/checkout/i);
    expect(copy.appleOwnershipConflict).toMatch(/Apple purchase/i);
  });

  it('paymentApiCopy ES/EN comparten appleOwnershipConflict', () => {
    expect(paymentApiCopy('es').appleOwnershipConflict).toBeTruthy();
    expect(paymentApiCopy('en').appleOwnershipConflict).toBeTruthy();
  });

  it('resolveRequestLanguage prioriza header', () => {
    const lang = resolveRequestLanguage({
      headers: { 'x-app-language': 'en', 'accept-language': 'es-ES' },
      user: { preferences: { language: 'es' } },
    });
    expect(lang).toBe('en');
  });
});
