/**
 * Guardrails: personal-pattern no debe aparecer como técnica en el grafo.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('graphInterventionLabel guard', () => {
  it('graphInterventionLabel centraliza el ID interno personal-pattern', () => {
    const src = readSrc('utils/graphInterventionLabel.js');
    expect(src).toMatch(/INTERNAL_GRAPH_INTERVENTION_ID = 'personal-pattern'/);
    expect(src).toMatch(/isInternalGraphIntervention/);
    expect(src).toMatch(/filterPublicGraphInterventionEdges/);
    expect(src).toMatch(/filterPublicGraphCorrelations/);
    expect(src).toMatch(/resolveGraphInterventionLabel/);
  });

  it('InterventionGraphScreen filtra aristas y correlaciones internas al cargar', () => {
    const src = readSrc('screens/InterventionGraphScreen.js');
    expect(src).toMatch(/filterPublicGraphInterventionEdges/);
    expect(src).toMatch(/filterPublicGraphCorrelations/);
    expect(src).toMatch(/resolveGraphInterventionLabel/);
  });

  it('interventionGraphLayout filtra antes de construir el modelo visual', () => {
    const src = readSrc('utils/interventionGraphLayout.js');
    expect(src).toMatch(/filterPublicGraphInterventionEdges/);
  });

  it('SummaryWhatHelpsSection filtra aristas internas del pool', () => {
    const src = readSrc('components/summary/SummaryWhatHelpsSection.js');
    expect(src).toMatch(/filterPublicGraphInterventionEdges/);
    expect(src).toMatch(/resolveGraphInterventionLabel/);
  });

  it('InterventionGraphScreen usa panel de estado en lugar de error plano', () => {
    const src = readSrc('screens/InterventionGraphScreen.js');
    expect(src).toMatch(/InterventionGraphStatePanel/);
    expect(src).toMatch(/showStatePanel/);
    expect(src).not.toMatch(/styles\.error/);
    expect(src).not.toMatch(/styles\.retry/);
  });
});
