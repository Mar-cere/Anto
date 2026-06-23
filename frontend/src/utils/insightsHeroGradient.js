/**
 * Gradiente opaco para héroes de resumen / informe.
 * Evita rgba en SVG (en varios dispositivos se aclara demasiado y baja el contraste del texto).
 */
export function resolveInsightsHeroGradient(colors, dark) {
  if (dark) {
    return {
      top: '#0A1E45',
      bottom: colors.surface ?? '#152042',
    };
  }
  return {
    top: '#D8E4F4',
    bottom: colors.surface ?? '#FFFFFF',
  };
}
