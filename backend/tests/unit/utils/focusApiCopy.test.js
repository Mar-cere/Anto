/**
 * Test de paridad de claves entre español e inglés en focusApiCopy.
 */
import { focusApiCopy } from '../../../utils/focusApiCopy.js';

describe('focusApiCopy parity', () => {
  it('debe tener las mismas claves en es y en', () => {
    const copyEs = focusApiCopy('es');
    const copyEn = focusApiCopy('en');

    const keysEs = Object.keys(copyEs).sort();
    const keysEn = Object.keys(copyEn).sort();

    expect(keysEs).toEqual(keysEn);
  });

  it('debe tener las mismas claves de temas en es y en', () => {
    const copyEs = focusApiCopy('es');
    const copyEn = focusApiCopy('en');

    const themeKeysEs = Object.keys(copyEs.themes || {}).sort();
    const themeKeysEn = Object.keys(copyEn.themes || {}).sort();

    expect(themeKeysEs).toEqual(themeKeysEn);
  });

  it('cada tema debe tener las mismas propiedades en es y en', () => {
    const copyEs = focusApiCopy('es');
    const copyEn = focusApiCopy('en');

    const themes = Object.keys(copyEs.themes || {});
    
    themes.forEach((themeId) => {
      const propsEs = Object.keys(copyEs.themes[themeId] || {}).sort();
      const propsEn = Object.keys(copyEn.themes[themeId] || {}).sort();
      
      expect(propsEs).toEqual(propsEn);
    });
  });
});
