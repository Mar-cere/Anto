import {
  getTechniquesHubItems,
  TECHNIQUES_HUB_FOCUS_TOOLS,
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

  it('solo expone Pomodoro como fila estática del hub', () => {
    expect(getTechniquesHubItems()).toHaveLength(1);
    expect(getTechniquesHubItems()[0].screen).toBe('Pomodoro');
  });

  it('cada ítem estático tiene claves de texto y pantalla destino', () => {
    getTechniquesHubItems().forEach((item) => {
      expect(item.key).toBeTruthy();
      expect(item.screen).toBeTruthy();
      expect(item.labelKey).toBeTruthy();
      expect(item.hintKey).toBeTruthy();
      expect(TECHNIQUES_HUB_ITEM_TEXT_KEYS).toContain(item.labelKey);
      expect(TECHNIQUES_HUB_ITEM_TEXT_KEYS).toContain(item.hintKey);
    });
  });

  it('las pantallas estáticas están en la lista permitida', () => {
    const allowed = new Set(TECHNIQUES_HUB_TARGET_ROUTES);
    getTechniquesHubItems().forEach((item) => {
      expect(allowed.has(item.screen)).toBe(true);
    });
  });
});
