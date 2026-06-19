import { TECHNIQUES_HUB as techniquesHubEs } from '../es';
import { TECHNIQUES_HUB as techniquesHubEn } from '../en';
import {
  TECHNIQUES_HUB_ITEM_TEXT_KEYS,
  TECHNIQUES_HUB_TEXT_KEYS,
} from '../../../utils/techniquesHubConfig';

function assertSectionKeys(esSection, enSection, keys, sectionName) {
  keys.forEach((key) => {
    expect(esSection?.[key]).toBeTruthy();
    expect(enSection?.[key]).toBeTruthy();
    expect(typeof esSection[key]).toBe('string');
    expect(typeof enSection[key]).toBe('string');
    if (!esSection[key] || !enSection[key]) {
      throw new Error(`Missing ${sectionName}.${key}`);
    }
  });
}

describe('techniquesHub i18n parity', () => {
  it('TECHNIQUES_HUB tiene claves de pantalla en es y en', () => {
    assertSectionKeys(
      techniquesHubEs,
      techniquesHubEn,
      TECHNIQUES_HUB_TEXT_KEYS,
      'TECHNIQUES_HUB',
    );
  });

  it('TECHNIQUES_HUB tiene copy de filas en es y en', () => {
    assertSectionKeys(
      techniquesHubEs,
      techniquesHubEn,
      TECHNIQUES_HUB_ITEM_TEXT_KEYS,
      'TECHNIQUES_HUB',
    );
  });
});
