#!/usr/bin/env node
/**
 * Smoke i18n EN fase 1 (#151) — wiring estático.
 * Complementa docs/SMOKE_DISPOSITIVO_CRISIS_I18N.md (sección EN en dispositivo).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPushNotificationCopy } from '../services/pushNotificationCopyPools.js';
import { getMailerStrings } from '../constants/emailMailerStrings.js';
import { buildCrisisProtocolTransparency } from '../constants/crisisProtocolCopy.js';
import { hasSpanishVoseo } from '../utils/copyToneGuards.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

let failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  [OK] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

function collectKeys(obj, prefix = '') {
  const keys = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return keys;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

console.log('\n=== Smoke i18n EN (#151) ===\n');

const esMod = await import(path.join(root, 'frontend/src/constants/translations/es.js'));
const enMod = await import(path.join(root, 'frontend/src/constants/translations/en.js'));
const esKeys = new Set();
const enKeys = new Set();
for (const section of Object.keys(esMod)) {
  if (section === 'default') continue;
  const esSection = esMod[section];
  const enSection = enMod[section];
  if (esSection && typeof esSection === 'object') {
    collectKeys(esSection, section).forEach((k) => esKeys.add(k));
    collectKeys(enSection || {}, section).forEach((k) => enKeys.add(k));
  }
}
const missingInEn = [...esKeys].filter((k) => !enKeys.has(k));
const missingInEs = [...enKeys].filter((k) => !esKeys.has(k));
ok('paridad claves ES→EN', missingInEn.length === 0, `${missingInEn.length} faltantes`);
ok('paridad claves EN→ES', missingInEs.length === 0, `${missingInEs.length} extra`);

const settings = fs.readFileSync(
  path.join(root, 'frontend/src/components/settings/SettingsContent.js'),
  'utf8',
);
ok(
  'selector idioma en Ajustes',
  settings.includes('LANGUAGE_MODAL_TITLE') && settings.includes('SUPPORTED_LANGUAGES'),
);

const useSettings = fs.readFileSync(path.join(root, 'frontend/src/hooks/useSettingsScreen.js'), 'utf8');
ok(
  'sync preferences.language al backend',
  useSettings.includes('preferences.language') || useSettings.includes("language"),
);

const apiTs = fs.readFileSync(path.join(root, 'frontend/src/config/api.ts'), 'utf8');
ok('header X-App-Language en API', apiTs.includes('X-App-Language'));

const appLang = fs.readFileSync(path.join(root, 'frontend/src/utils/appLanguage.js'), 'utf8');
ok('persistencia idioma AsyncStorage', appLang.includes('APP_LANGUAGE_STORAGE_KEY'));

const taskScreen = fs.readFileSync(path.join(root, 'frontend/src/screens/TaskScreen.js'), 'utf8');
ok(
  'secciones tareas fechadas i18n',
  taskScreen.includes('SECTION_TOMORROW') && taskScreen.includes('SECTION_COMPLETED'),
);

const faqEn = path.join(root, 'frontend/src/data/FaQScreen.en.js');
ok('FAQ EN dedicado', fs.existsSync(faqEn));

const enMailer = getMailerStrings('en');
ok('email mailer strings EN', Boolean(enMailer?.welcome?.subject));
ok('email welcome EN sin ¿', !enMailer?.welcome?.subject?.includes('¿'));

const pushEn = getPushNotificationCopy('en');
ok('push pool EN crisis', Array.isArray(pushEn?.crisisWarning?.titles) && pushEn.crisisWarning.titles.length > 3);

const crisisEn = buildCrisisProtocolTransparency({ language: 'en' });
ok('crisis transparencia EN', crisisEn[0]?.text?.includes('detected') || crisisEn[0]?.text?.includes('We'));

const aiLimits = fs.readFileSync(
  path.join(root, 'frontend/src/constants/translations/en.js'),
  'utf8',
);
ok('biblioteca límites IA EN', aiLimits.includes('AI_LIMITS_LIBRARY'));

const promptBuilder = fs.readFileSync(
  path.join(root, 'backend/services/openai/openaiPromptBuilder.js'),
  'utf8',
);
ok('resolveChatLanguage en prompts', promptBuilder.includes('resolveChatLanguage'));

console.log(
  failed
    ? `\nSmoke i18n EN: ${failed} fallo(s)\n`
    : '\nSmoke i18n EN: OK (ejecutar checklist manual EN en dispositivo)\n',
);
process.exit(failed ? 1 : 0);
