/**
 * Blindaje transversal: cambios recientes de UI (sesión, compromisos, fondo).
 */
import fs from 'fs';
import path from 'path';
import en from '../constants/translations/en';
import es from '../constants/translations/es';

const FRONTEND_SRC = path.resolve(__dirname, '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('sessionUi hardening guard', () => {
  describe('intención de sesión (#72)', () => {
    it('useChatScreen valida ids antes de persistir', () => {
      const hook = readSrc('hooks/useChatScreen.js');
      expect(hook).toMatch(/isValidSessionIntentionId\(intentionId\)/);
      expect(hook).toMatch(/setShowSessionIntentionPrompt\(false\)/);
    });

    it('SessionIntentionSheet valida ids en cliente', () => {
      const sheet = readSrc('components/chat/SessionIntentionSheet.js');
      expect(sheet).toMatch(/isValidSessionIntentionId/);
      expect(sheet).toMatch(/handleSelect/);
    });

    it('chatScreenConstants define icono para cada intención', () => {
      const src = readSrc('screens/chat/chatScreenConstants.js');
      expect(src).toMatch(/SESSION_INTENTION_ICONS/);
      for (const id of ['vent', 'organize', 'technique', 'plan']) {
        expect(src).toMatch(new RegExp(`${id}:`));
      }
    });

    it('traducciones CHAT: paridad SESSION_INTENTION_SUBTITLE es/en', () => {
      expect(es.CHAT.SESSION_INTENTION_SUBTITLE).toBeTruthy();
      expect(en.CHAT.SESSION_INTENTION_SUBTITLE).toBeTruthy();
      expect(es.CHAT.SESSION_INTENTION_TITLE).toContain('acompañe');
      expect(en.CHAT.SESSION_INTENTION_TITLE).toMatch(/support you/i);
    });
  });

  describe('compromisos concretos (#202)', () => {
    it('SessionInsightScreen exige acción concreta al guardar', () => {
      const src = readSrc('screens/SessionInsightScreen.js');
      expect(src).toMatch(/isConcreteCommitmentLabel/);
      expect(src).toMatch(/commitmentDraft/);
      expect(src).not.toMatch(/String\(step\?\.label \|\| insight\?\.headline/);
    });

    it('DashboardFocusCard oculta BA duplicado y contextualiza follow-up', () => {
      const src = readSrc('components/DashboardFocusCard.js');
      expect(src).toMatch(/filterDashboardCommitments/);
      expect(src).toMatch(/buildCommitmentFollowUpPrompt/);
      expect(src).toMatch(/visibleCommitments/);
    });

    it('commitmentLabelUtils muestra pendientes concretos y filtra fantasma', () => {
      const src = readSrc('utils/commitmentLabelUtils.js');
      expect(src).toMatch(/isDashboardCommitmentActionable/);
      expect(src).toMatch(/isConcreteCommitmentLabel\(commitment\.label\)/);
      expect(src).toMatch(/followUpAnswer === 'pending'/);
      expect(src).not.toMatch(/followUpAnswer !== 'pending'\) return false/);
    });
  });

  describe('insight de sesión — iconos iOS', () => {
    it('SessionInsightScreen no usa emojis en pasos ni TCC lite', () => {
      const src = readSrc('screens/SessionInsightScreen.js');
      expect(src).toMatch(/resolveSessionInsightStepVisual/);
      expect(src).toMatch(/resolveTccLiteResumeVisual/);
      expect(src).not.toMatch(/🧠/);
      expect(src).not.toMatch(/step\.icon/);
    });
  });

  describe('chat gate en pestaña Chat', () => {
    it('useChatScreen valida acceso al cargar (sustituye hint de primera sesión)', () => {
      const hook = readSrc('hooks/useChatScreen.js');
      expect(hook).toMatch(/canAttemptChatAccess/);
      expect(hook).toMatch(/SUBSCRIPTION_REQUIRED_TITLE/);
      expect(hook).toMatch(/navigate\('Subscription'\)/);
    });
  });

  describe('fondo dashboard', () => {
    it('halos con opacidad reducida en modo oscuro', () => {
      const src = readSrc('utils/dashboardBrandBackdropUtils.js');
      expect(src).toMatch(/indigo: 'rgba\(29, 27, 112, 0\.19\)'/);
      expect(src).not.toMatch(/indigo: 'rgba\(29, 27, 112, 0\.32\)'/);
    });
  });

  describe('orbe onboarding', () => {
    it('logo más grande sin aumentar el orbe', () => {
      const src = readSrc('components/onboarding/OnboardingBrandOrb.js');
      expect(src).toMatch(/logoSize = compact \? 60 : 72/);
      expect(src).toMatch(/orbSize = compact \? 88 : 104/);
    });
  });
});
