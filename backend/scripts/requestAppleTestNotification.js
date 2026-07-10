#!/usr/bin/env node
/**
 * Pide a Apple que envíe una notificación TEST al webhook configurado en App Store Connect.
 *
 * Requisitos (Users and Access → Integrations → In-App Purchase → Generate Key):
 *   APPLE_IAP_KEY_ID       — Key ID
 *   APPLE_IAP_ISSUER_ID    — Issuer ID (misma página)
 *   APPLE_IAP_KEY_PATH     — ruta al archivo AuthKey_XXXX.p8
 *   APPLE_BUNDLE_ID        — default com.anto.app
 *   APPLE_IAP_API_ENV      — sandbox (default) | production
 *
 * Uso:
 *   cd backend
 *   node scripts/requestAppleTestNotification.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AppStoreServerAPIClient,
  Environment,
} from '@apple/app-store-server-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadSigningKey() {
  const inline = process.env.APPLE_IAP_PRIVATE_KEY;
  if (inline && inline.trim()) {
    return inline.replace(/\\n/g, '\n');
  }
  const keyPath = process.env.APPLE_IAP_KEY_PATH;
  if (!keyPath) {
    throw new Error(
      'Falta APPLE_IAP_KEY_PATH o APPLE_IAP_PRIVATE_KEY. Crea una In-App Purchase Key en App Store Connect.',
    );
  }
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`No se encontró la clave en ${resolved}`);
  }
  return fs.readFileSync(resolved, 'utf8');
}

function resolveEnvironment() {
  const raw = (process.env.APPLE_IAP_API_ENV || 'sandbox').toLowerCase();
  return raw === 'production' ? Environment.PRODUCTION : Environment.SANDBOX;
}

async function main() {
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const issuerId = process.env.APPLE_IAP_ISSUER_ID;
  const bundleId = process.env.APPLE_BUNDLE_ID || 'com.anto.app';
  const environment = resolveEnvironment();

  if (!keyId || !issuerId) {
    console.error(`
Faltan variables de entorno.

1. App Store Connect → Users and Access → Integrations → In-App Purchase
2. Generate In-App Purchase Key → descarga el .p8 (solo una vez)
3. Exporta:
   export APPLE_IAP_KEY_ID="XXXXXXXXXX"
   export APPLE_IAP_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   export APPLE_IAP_KEY_PATH="/ruta/a/AuthKey_XXXXXXXXXX.p8"
   export APPLE_IAP_API_ENV="sandbox"

4. Vuelve a ejecutar:
   node scripts/requestAppleTestNotification.js
`);
    process.exit(1);
  }

  const signingKey = loadSigningKey();
  const client = new AppStoreServerAPIClient(
    signingKey,
    keyId,
    issuerId,
    bundleId,
    environment,
  );

  console.log(`Solicitando notificación TEST (${environment === Environment.PRODUCTION ? 'production' : 'sandbox'})…`);
  const sendResponse = await client.requestTestNotification();
  const token = sendResponse?.testNotificationToken;
  if (!token) {
    console.error('Apple no devolvió testNotificationToken:', sendResponse);
    process.exit(1);
  }
  console.log('testNotificationToken:', token);
  console.log('Esperando 5 s antes de consultar estado…');
  await new Promise((r) => setTimeout(r, 5000));

  const statusResponse = await client.getTestNotificationStatus(token);
  console.log('\nEstado de entrega (Apple → tu webhook):');
  console.log(JSON.stringify(statusResponse, null, 2));

  const attempts = statusResponse?.sendAttempts ?? statusResponse?.sendAttempt ?? [];
  const list = Array.isArray(attempts) ? attempts : [attempts].filter(Boolean);
  const last = list[list.length - 1];
  const result = last?.sendAttemptResult ?? last?.sendAttemptResult;
  if (result === 'SUCCESS') {
    console.log('\n✅ Apple reporta entrega exitosa. Revisa logs de Render para POST /apple-server-notifications 200');
  } else {
    console.log(`\n⚠️ Resultado: ${result ?? 'desconocido'}. Revisa URL en App Store Connect y logs de Render.`);
  }
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});
