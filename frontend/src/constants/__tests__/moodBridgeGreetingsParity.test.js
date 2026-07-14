import fs from 'fs';
import path from 'path';
import es from '../translations/es';
import en from '../translations/en';
import { MOOD_BRIDGE_GREETINGS_EN, MOOD_BRIDGE_GREETINGS_ES } from '../moodBridgeGreetings.data.js';
import moodBridgeJson from '../moodBridgeGreetings.data.json';

describe('moodBridgeGreetings parity', () => {
  it('JSON y re-export JS coinciden', () => {
    expect(MOOD_BRIDGE_GREETINGS_ES).toEqual(moodBridgeJson.es);
    expect(MOOD_BRIDGE_GREETINGS_EN).toEqual(moodBridgeJson.en);
  });

  it('DASH.MOOD_BRIDGE_GREETINGS usa la fuente canónica en es y en', () => {
    expect(es.DASH.MOOD_BRIDGE_GREETINGS).toEqual(moodBridgeJson.es);
    expect(en.DASH.MOOD_BRIDGE_GREETINGS).toEqual(moodBridgeJson.en);
  });

  it('traducciones no importan fuera del paquete frontend', () => {
    const esSrc = fs.readFileSync(path.join(__dirname, '../translations/es.js'), 'utf8');
    const enSrc = fs.readFileSync(path.join(__dirname, '../translations/en.js'), 'utf8');
    expect(esSrc).toMatch(/moodBridgeGreetings\.data\.js/);
    expect(enSrc).toMatch(/moodBridgeGreetings\.data\.js/);
    expect(esSrc).not.toMatch(/backend\/constants/);
    expect(esSrc).not.toMatch(/shared\/copy/);
    expect(enSrc).not.toMatch(/backend\/constants/);
    expect(enSrc).not.toMatch(/shared\/copy/);
  });
});
