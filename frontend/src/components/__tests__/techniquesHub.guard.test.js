/**
 * Guardrails del hub de técnicas y tab de navbar.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('techniquesHub guard', () => {
  it('FloatingNavBar usa tab techniques en lugar de pomodoro', () => {
    const src = readSrc('components/FloatingNavBar.js');
    expect(src).toMatch(/activeTab === 'techniques'/);
    expect(src).toMatch(/onNavPress\('Techniques'/);
    expect(src).toMatch(/TAB_TECHNIQUES_LABEL/);
    expect(src).toMatch(/diamond-outline/);
    expect(src).not.toMatch(/activeTab === 'pomodoro'/);
    expect(src).not.toMatch(/onNavPress\('Pomodoro'/);
    expect(src).not.toMatch(/TAB_POMODORO_LABEL/);
  });

  it('FloatingNavBar usa Anto.png como icono central en todos los temas', () => {
    const src = readSrc('components/FloatingNavBar.js');
    expect(src).toMatch(/require\('\.\.\/images\/Anto\.png'\)/);
    expect(src).not.toMatch(/assets\/icon\.png/);
  });

  it('TechniquesHubScreen integra catálogo completo sin enlace ver todas', () => {
    const src = readSrc('screens/TechniquesHubScreen.js');
    expect(src).toMatch(/TechniquesCatalogPanel/);
    expect(src).toMatch(/useTherapeuticTechniquesScreen/);
    expect(src).toMatch(/TECHNIQUES_HUB_FOCUS_TOOLS/);
    expect(src).toMatch(/focusTools=/);
    expect(src).toMatch(/FloatingNavBar activeTab="techniques"/);
    expect(src).not.toMatch(/ALL_TECHNIQUES/);
    expect(src).not.toMatch(/Ver todas las técnicas/);
  });

  it('TechniquesCatalogPanel condensa acceso rápido y catálogo en acordeón', () => {
    const src = readSrc('components/techniques/TechniquesCatalogPanel.js');
    expect(src).toMatch(/DashboardGroupedRow/);
    expect(src).toMatch(/quickAccessRows/);
    expect(src).toMatch(/createInitialCatalogExpanded/);
    expect(src).toMatch(/categoryHeaderCollapsed/);
    expect(src).toMatch(/renderQuickAccess\(\)/);
    expect(src).not.toMatch(/LibraryEntryCard/);
    expect(src).not.toMatch(/TechniqueCard/);
  });

  it('techniquesCatalogUtils centraliza helpers del catálogo', () => {
    const src = readSrc('utils/techniquesCatalogUtils.js');
    expect(src).toMatch(/createInitialCatalogExpanded/);
    expect(src).toMatch(/resolveTechniqueCatalogType/);
    expect(src).toMatch(/buildTechniqueCatalogRowSubtitle/);
    expect(src).toMatch(/hasTechniqueCatalogCategories/);
  });

  it('TechniquesHubScreen expone subtítulo y pasa focusTools al catálogo', () => {
    const src = readSrc('screens/TechniquesHubScreen.js');
    expect(src).toMatch(/pageSubtitle/);
    expect(src).toMatch(/SUBTITLE/);
    expect(src).toMatch(/focusTools=\{TECHNIQUES_HUB_FOCUS_TOOLS\}/);
    expect(src).not.toMatch(/useNavigation/);
  });

  it('Pomodoro ya no monta la navbar y vuelve al hub sin historial', () => {
    const src = readSrc('screens/PomodoroScreen.js');
    expect(src).not.toMatch(/FloatingNavBar/);
    expect(src).toMatch(/showBack/);
    const header = readSrc('components/pomodoro/PomodoroScreenHeader.js');
    expect(header).toMatch(/resolvePomodoroBackHandler/);
  });

  it('StackNavigator registra Techniques como hub', () => {
    const src = readSrc('navigation/StackNavigator.js');
    expect(src).toMatch(/TechniquesHubScreen/);
    expect(src).toMatch(/TECHNIQUES:\s*'Techniques'/);
    expect(src).toMatch(/THERAPEUTIC_TECHNIQUES:\s*'TherapeuticTechniques'/);
  });

  it('PomodoroCard abre el hub de técnicas', () => {
    const src = readSrc('components/PomodoroCard.js');
    expect(src).toMatch(/navigate\('Techniques'\)/);
    expect(src).not.toMatch(/navigate\('Pomodoro'\)/);
  });

  it('traducciones NAV usan TAB_TECHNIQUES', () => {
    const es = readSrc('constants/translations/es.js');
    const en = readSrc('constants/translations/en.js');
    expect(es).toMatch(/TAB_TECHNIQUES_LABEL/);
    expect(en).toMatch(/TAB_TECHNIQUES_LABEL/);
    expect(es).toMatch(/export const TECHNIQUES_HUB/);
    expect(en).toMatch(/export const TECHNIQUES_HUB/);
    expect(es).not.toMatch(/ALL_TECHNIQUES/);
  });
});
