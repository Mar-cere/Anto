import {
  isBlockedHomeInsightIcon,
  resolveHomeInsightIcon,
  resolveHomeInsightIconColor,
} from '../dashboardInsightVisual';

describe('dashboardInsightVisual', () => {
  it('bienvenida usa hand-heart', () => {
    expect(resolveHomeInsightIcon('welcome')).toBe('hand-heart');
  });

  it('insight de actividad evita iconos de gráfico', () => {
    const icon = resolveHomeInsightIcon('activity');
    expect(icon).toBe('star-four-points-outline');
    expect(isBlockedHomeInsightIcon(icon)).toBe(false);
    expect(isBlockedHomeInsightIcon('chart-line')).toBe(true);
  });

  it('colores de icono según variante', () => {
    const colors = { primary: '#1E83D3', accentWarm: '#E89BB8' };
    expect(resolveHomeInsightIconColor('welcome', colors)).toBe('#1E83D3');
    expect(resolveHomeInsightIconColor('activity', colors)).toBe('#E89BB8');
  });
});
