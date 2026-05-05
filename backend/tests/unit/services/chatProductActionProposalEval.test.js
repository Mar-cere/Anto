import {
  buildProposedProductActions,
  getProductActionNeedLevel,
  isExplicitProductActionRequest
} from '../../../services/chatProductActionProposalService.js';
import { PRODUCT_ACTION_PROPOSAL_EVAL_FIXTURES } from '../../fixtures/productActionProposalEvalFixtures.js';

describe('chatProductActionProposalService semantic eval fixtures', () => {
  const baseIds = {
    conversationId: '507f1f77bcf86cd799439011',
    assistantMessageId: '507f191e810c19729de860ea'
  };

  it('mantiene comportamiento esperado sobre fixtures de regresión', () => {
    PRODUCT_ACTION_PROPOSAL_EVAL_FIXTURES.forEach((fixture) => {
      const actions = buildProposedProductActions({
        ...baseIds,
        riskLevel: 'LOW',
        isCrisis: false,
        userContent: fixture.text,
        sessionIntention: fixture.intention
      });

      const explicit = isExplicitProductActionRequest(fixture.text);
      if (explicit !== fixture.explicit) {
        throw new Error(
          `[${fixture.name}] explicit esperado=${fixture.explicit} recibido=${explicit} text="${fixture.text}"`
        );
      }

      if (fixture.need) {
        const need = getProductActionNeedLevel(fixture.text);
        if (need !== fixture.need) {
          throw new Error(
            `[${fixture.name}] need esperado=${fixture.need} recibido=${need} text="${fixture.text}"`
          );
        }
      }

      if (fixture.suggest) {
        if (!(actions.length >= 1)) {
          throw new Error(`[${fixture.name}] esperaba sugerencia y no hubo acciones`);
        }
        if (fixture.type) {
          if (actions[0].type !== fixture.type) {
            throw new Error(
              `[${fixture.name}] type esperado=${fixture.type} recibido=${actions[0].type}`
            );
          }
        }
      } else {
        if (actions.length !== 0) {
          throw new Error(`[${fixture.name}] no esperaba sugerencia y recibió ${actions.length}`);
        }
      }
    });
  });
});

