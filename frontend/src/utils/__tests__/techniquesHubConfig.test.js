import {
  getTechniquesHubItems,
  TECHNIQUES_HUB_FOCUS_TOOLS,
  TECHNIQUES_HUB_GUIDED,
  TECHNIQUES_HUB_ITEM_TEXT_KEYS,
  TECHNIQUES_HUB_TARGET_ROUTES,
  TECHNIQUES_HUB_TEXT_KEYS,
} from '../techniquesHubConfig';

describe('techniquesHubConfig', () => {
  it('incluye Pomodoro en herramientas de enfoque', () => {
    expect(TECHNIQUES_HUB_FOCUS_TOOLS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'pomodoro', screen: 'Pomodoro' }),
      ]),
    );
  });

  it('incluye protocolos TCC guiados', () => {
    const screens = TECHNIQUES_HUB_GUIDED.map((item) => item.screen);
    expect(screens).toEqual([
      'BehavioralActivation',
      'AbcRecord',
      'ExposureHierarchy',
    ]);
  });

  it('cada ítem tiene claves de texto y pantalla destino', () => {
    getTechniquesHubItems().forEach((item) => {
      expect(item.key).toBeTruthy();
      expect(item.screen).toBeTruthy();
      expect(item.labelKey).toBeTruthy();
      expect(item.hintKey).toBeTruthy();
      expect(TECHNIQUES_HUB_ITEM_TEXT_KEYS).toContain(item.labelKey);
      expect(TECHNIQUES_HUB_ITEM_TEXT_KEYS).toContain(item.hintKey);
    });
  });

  it('las pantallas destino están en la lista permitida del hub', () => {
    const allowed = new Set(TECHNIQUES_HUB_TARGET_ROUTES);
    getTechniquesHubItems().forEach((item) => {
      expect(allowed.has(item.screen)).toBe(true);
    });
    expect(allowed.has('TherapeuticTechniques')).toBe(true);
  });

  it('no duplica keys internas', () => {
    const keys = getTechniquesHubItems().map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
