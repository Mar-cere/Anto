/**
 * App Store Server Notifications V2: verificación JWS y sincronización con User/Subscription.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import jwt from 'jsonwebtoken';

import {
  Environment,
  NotificationTypeV2,
  SignedDataVerifier,
  Subtype,
  Type,
  VerificationException,
  VerificationStatus,
} from '@apple/app-store-server-library';

/**
 * La librería de Apple usa `appAppleId !== appAppleId` (estricto). En notificaciones V2 el campo
 * a veces viene como string o ausente; eso provoca INVALID_APP_IDENTIFIER con .message vacío.
 */
SignedDataVerifier.prototype.verifyNotification = function verifyNotificationLooseAppId(
  bundleId,
  appAppleId,
  environment,
) {
  if (this.bundleId !== bundleId) {
    throw new VerificationException(VerificationStatus.INVALID_APP_IDENTIFIER);
  }
  if (
    this.environment === Environment.PRODUCTION &&
    this.appAppleId !== undefined &&
    appAppleId !== undefined &&
    Number(this.appAppleId) !== Number(appAppleId)
  ) {
    throw new VerificationException(VerificationStatus.INVALID_APP_IDENTIFIER);
  }
  if (this.environment !== environment) {
    throw new VerificationException(VerificationStatus.INVALID_ENVIRONMENT);
  }
};

import AppleServerNotification from '../models/AppleServerNotification.js';
import Subscription from '../models/Subscription.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import appleReceiptService from './appleReceiptService.js';
import cacheService from './cacheService.js';
import paymentAuditService from './paymentAuditService.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadAppleRootCertificates() {
  const certsDir = path.join(__dirname, '..', 'certs');
  if (!fs.existsSync(certsDir)) {
    throw new Error(`Falta directorio de certificados Apple en ${certsDir}`);
  }
  const pemFiles = fs
    .readdirSync(certsDir)
    .filter((name) => name.endsWith('.pem'))
    .sort();
  if (pemFiles.length === 0) {
    throw new Error(`No hay certificados .pem en ${certsDir}`);
  }
  return pemFiles.map((name) => fs.readFileSync(path.join(certsDir, name)));
}

function getBundleId() {
  return process.env.APPLE_BUNDLE_ID || 'com.anto.app';
}

function resolveAppAppleId() {
  const appAppleIdRaw = process.env.APPLE_APP_APPLE_ID;
  if (appAppleIdRaw === undefined || appAppleIdRaw === '' || Number.isNaN(Number(appAppleIdRaw))) {
    return undefined;
  }
  return Number(appAppleIdRaw);
}

/**
 * @param {boolean} enableOnlineChecks OCSP / comprobaciones en red (puede fallar en hosts sin salida o con proxy)
 */
function buildVerifiers(enableOnlineChecks) {
  const roots = loadAppleRootCertificates();
  const bundleId = getBundleId();
  const appAppleId = resolveAppAppleId();

  const mk = (environment, appleIdForEnv) =>
    new SignedDataVerifier(roots, enableOnlineChecks, environment, bundleId, appleIdForEnv);

  return {
    production: mk(Environment.PRODUCTION, appAppleId),
    // Apple: appAppleId solo es obligatorio en Production.
    sandbox: mk(Environment.SANDBOX, undefined),
    xcode: mk(Environment.XCODE, undefined),
    localTesting: mk(Environment.LOCAL_TESTING, undefined),
  };
}

/** @type {Map<string, ReturnType<typeof buildVerifiers>>} */
const verifierCache = new Map();

function getVerifiers(enableOnlineChecks) {
  const key = enableOnlineChecks ? 'online' : 'offline';
  if (!verifierCache.has(key)) {
    verifierCache.set(key, buildVerifiers(enableOnlineChecks));
  }
  return verifierCache.get(key);
}

/** VerificationException de Apple no rellena .message; usar status numérico y causa si existe. */
function formatAppleVerifyError(err) {
  if (err != null && typeof err === 'object' && 'status' in err) {
    const code = err.status;
    const label = VerificationStatus[code] ?? `STATUS_${code}`;
    const cause =
      err.cause && typeof err.cause.message === 'string' && err.cause.message
        ? ` — ${err.cause.message}`
        : '';
    const causeStack =
      process.env.APPLE_ASN_DEBUG === 'true' &&
      err.cause &&
      typeof err.cause.stack === 'string' &&
      err.cause.stack
        ? ` | causeStack: ${err.cause.stack.slice(0, 800)}`
        : '';
    return `${label}${cause}${causeStack}`;
  }
  const m = err?.message;
  if (m) return m;
  try {
    return String(err);
  } catch {
    return 'error desconocido';
  }
}

/**
 * Decodifica solo el segmento central del JWS (payload) sin verificar firma.
 * Útil con APPLE_ASN_DEBUG cuando la librería de Apple falla antes de exponer el payload.
 * No usar para tomar decisiones de negocio.
 */
/**
 * Extrae signedPayload del cuerpo POST (Apple envía JSON; algunos proxies alteran el body).
 * @param {unknown} body
 * @returns {string|null}
 */
export function extractAppleSignedPayload(body) {
  if (body == null) return null;
  if (typeof body === 'string' && body.includes('.')) {
    return body.trim();
  }
  if (typeof body === 'object' && !Array.isArray(body)) {
    const sp = body.signedPayload;
    if (typeof sp === 'string' && sp.trim()) {
      return sp.trim();
    }
  }
  return null;
}

function describeSignedPayloadShape(signedPayload) {
  if (typeof signedPayload !== 'string' || !signedPayload) {
    return { valid: false, reason: 'missing_or_not_string', length: 0, parts: 0 };
  }
  const parts = signedPayload.split('.');
  return {
    valid: parts.length === 3 && parts.every((p) => p.length > 0),
    reason: parts.length === 3 ? 'ok' : `expected_3_jws_parts_got_${parts.length}`,
    length: signedPayload.length,
    parts: parts.length,
  };
}

function decodeSignedPayloadMiddleUnsafe(signedPayload) {
  if (!signedPayload || typeof signedPayload !== 'string') {
    return { error: 'signedPayload vacío' };
  }
  const parts = signedPayload.split('.');
  if (parts.length < 2) {
    return { error: 'no parece JWS (faltan segmentos)' };
  }
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    return {
      keys: Object.keys(parsed),
      notificationType: parsed.notificationType ?? null,
      notificationUUID: parsed.notificationUUID ?? null,
      bundleId:
        parsed.data?.bundleId ??
        parsed.summary?.bundleId ??
        parsed.appData?.bundleId ??
        null,
      environment:
        parsed.data?.environment ??
        parsed.summary?.environment ??
        parsed.appData?.environment ??
        null,
      jwtDecodeNull: jwt.decode(signedPayload) == null,
    };
  } catch (e) {
    return { error: e?.message || String(e) };
  }
}

/**
 * @param {string} signedPayload
 * @returns {Promise<{ verifier: SignedDataVerifier, payload: import('@apple/app-store-server-library').ResponseBodyV2DecodedPayload }>}
 */
async function verifyNotificationPayload(signedPayload) {
  const verifyStart = Date.now();
  const shape = describeSignedPayloadShape(signedPayload);
  if (!shape.valid) {
    const msg = `[AppleASN] signedPayload inválido (${shape.reason}, length=${shape.length})`;
    logger.payment(msg);
    throw new Error(msg);
  }

  const unsafePeek = decodeSignedPayloadMiddleUnsafe(signedPayload);
  const envHintRaw = unsafePeek?.environment;
  const envHint =
    typeof envHintRaw === 'string' && envHintRaw.toLowerCase() === 'sandbox'
      ? 'sandbox'
      : typeof envHintRaw === 'string' && envHintRaw.toLowerCase() === 'production'
        ? 'production'
        : null;

  logger.payment(
    `[AppleASN] Verificando JWS ${JSON.stringify({
      envHint,
      shapeLength: shape.length,
      unsafeNotificationType: unsafePeek?.notificationType ?? null,
      unsafeBundleId: unsafePeek?.bundleId ?? null,
      hasAppAppleId: resolveAppAppleId() != null,
    })}`,
  );

  // Render y hosts similares suelen bloquear OCSP; offline es el default seguro.
  const preferOnline = process.env.APPLE_ASN_ONLINE_OCSP === 'true';
  const modes = preferOnline ? [true, false] : [false, true];

  let lastProdErr;
  let lastSandboxErr;
  let lastOtherErr;

  const verifierOrder = (() => {
    const base = [
      { key: 'sandbox', label: 'sandbox' },
      { key: 'production', label: 'production' },
      { key: 'xcode', label: 'xcode' },
      { key: 'localTesting', label: 'localTesting' },
    ];
    if (envHint === 'sandbox') {
      return base;
    }
    if (envHint === 'production') {
      return [
        { key: 'production', label: 'production' },
        { key: 'sandbox', label: 'sandbox' },
        { key: 'xcode', label: 'xcode' },
        { key: 'localTesting', label: 'localTesting' },
      ];
    }
    return base;
  })();

  for (const enableOnline of modes) {
    const verifiers = getVerifiers(enableOnline);
    const rootCertCount = loadAppleRootCertificates().length;

    for (const { key, label } of verifierOrder) {
      const verifier = verifiers[key];
      if (!verifier) continue;
      try {
        const payload = await verifier.verifyAndDecodeNotification(signedPayload);
        if (payload == null || typeof payload !== 'object') {
          throw new Error(`verifyAndDecodeNotification (${label}) devolvió un payload inválido`);
        }
        if (!enableOnline && preferOnline) {
          logger.warn(
            `[AppleASN] JWS verificado (${label}) sin OCSP en línea; si es habitual, define APPLE_ASN_ONLINE_OCSP=false`,
          );
        }
        logger.payment(
          `[AppleASN] JWS verificado ${JSON.stringify({
            label,
            enableOnline,
            durationMs: Date.now() - verifyStart,
            notificationType: payload.notificationType ?? null,
            notificationUUID: payload.notificationUUID ?? null,
            rootCertCount,
          })}`,
        );
        return { verifier, payload };
      } catch (err) {
        if (label === 'production') {
          lastProdErr = err;
        } else if (label === 'sandbox') {
          lastSandboxErr = err;
        } else {
          lastOtherErr = err;
        }
      }
    }
  }

  const diagUnsafe = unsafePeek;
  const diagMsg = `[AppleASN] Fallo verificación JWS — diagnóstico ${JSON.stringify({
    envHint,
    bundleId: getBundleId(),
    hasAppAppleId: resolveAppAppleId() != null,
    rootCertCount: loadAppleRootCertificates().length,
    shape,
    unsafePeek: diagUnsafe,
    prodError: formatAppleVerifyError(lastProdErr),
    sandboxError: formatAppleVerifyError(lastSandboxErr),
    otherError: formatAppleVerifyError(lastOtherErr),
    durationMs: Date.now() - verifyStart,
  })}`;
  logger.payment(diagMsg);

  const hint =
    'Revisa APPLE_BUNDLE_ID, APPLE_APP_APPLE_ID (obligatorio para notificaciones Production), certificados en backend/certs/*.pem (G2+G3), y APPLE_ASN_ONLINE_OCSP=false si OCSP falla en el host.';
  throw new Error(
    `Fallo verificación JWS (prod: ${formatAppleVerifyError(lastProdErr)}; sandbox: ${formatAppleVerifyError(lastSandboxErr)}). ${hint}`,
  );
}

/**
 * @param {SignedDataVerifier} verifier
 * @param {string} [signedJws]
 */
async function safeDecodeTransaction(verifier, signedJws) {
  if (!signedJws || typeof signedJws !== 'string') return null;
  try {
    return await verifier.verifyAndDecodeTransaction(signedJws);
  } catch (err) {
    logger.warn('[AppleASN] No se pudo decodificar signedTransactionInfo', {
      error: err?.message,
    });
    return null;
  }
}

async function safeDecodeRenewal(verifier, signedJws) {
  if (!signedJws || typeof signedJws !== 'string') return null;
  try {
    return await verifier.verifyAndDecodeRenewalInfo(signedJws);
  } catch (err) {
    logger.warn('[AppleASN] No se pudo decodificar signedRenewalInfo', {
      error: err?.message,
    });
    return null;
  }
}

async function isActiveUserId(userId) {
  if (!userId) return false;
  const user = await User.findById(userId).select('isActive').lean();
  return Boolean(user && user.isActive !== false);
}

/**
 * Resuelve userId Anto desde IDs Apple.
 * Ignora Subscriptions con OID liberado (releasedAt) y usuarios soft-deleted.
 */
async function resolveUserIdFromAppleIds(originalTransactionId, transactionId) {
  const oid = originalTransactionId ? String(originalTransactionId) : null;
  const tid = transactionId ? String(transactionId) : null;

  if (oid) {
    const subs = await Subscription.find({
      $or: [
        { 'metadata.appleOriginalTransactionId': oid },
        ...(tid ? [{ 'metadata.appleTransactionId': tid }] : []),
      ],
    })
      .select('userId metadata')
      .lean();

    for (const sub of subs) {
      if (sub.metadata?.releasedAt) continue;
      if (await isActiveUserId(sub.userId)) {
        return sub.userId;
      }
    }
  }
  if (tid) {
    const txns = await Transaction.find({
      paymentProvider: 'apple',
      providerTransactionId: tid,
    })
      .sort({ createdAt: -1 })
      .select('userId')
      .limit(5)
      .lean();
    for (const txn of txns) {
      if (await isActiveUserId(txn.userId)) {
        return txn.userId;
      }
    }
  }
  if (oid) {
    const txns2 = await Transaction.find({
      paymentProvider: 'apple',
      'metadata.originalTransactionId': oid,
    })
      .sort({ createdAt: -1 })
      .select('userId')
      .limit(5)
      .lean();
    for (const txn of txns2) {
      if (await isActiveUserId(txn.userId)) {
        return txn.userId;
      }
    }
  }
  return null;
}

/**
 * Tras validate-receipt exitoso: reaplicar ASN skipped por user_not_found
 * (p. ej. cancelAtPeriodEnd) ahora que el OID está vinculado.
 *
 * @param {string} originalTransactionId
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ limit?: number }} [options]
 */
export async function reprocessSkippedAsnForOriginalTransactionId(
  originalTransactionId,
  userId,
  options = {}
) {
  const oid = originalTransactionId ? String(originalTransactionId) : null;
  if (!oid || !userId) {
    return { processed: 0 };
  }
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const docs = await AppleServerNotification.find({
    originalTransactionId: oid,
    processingStatus: 'skipped',
    skipReason: 'user_not_found',
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  let processed = 0;
  for (const doc of docs) {
    try {
      if (
        doc.notificationType === NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS ||
        doc.notificationType === 'DID_CHANGE_RENEWAL_STATUS'
      ) {
        const sub = await Subscription.findOne({ userId });
        if (sub) {
          if (doc.subtype === Subtype.AUTO_RENEW_DISABLED || doc.subtype === 'AUTO_RENEW_DISABLED') {
            sub.cancelAtPeriodEnd = true;
            sub.metadata = {
              ...sub.metadata,
              appleAutoRenewDisabledAt: new Date(),
              asnReprocessedFromSkip: doc.notificationUUID,
            };
            await sub.save();
          } else if (
            doc.subtype === Subtype.AUTO_RENEW_ENABLED ||
            doc.subtype === 'AUTO_RENEW_ENABLED'
          ) {
            sub.cancelAtPeriodEnd = false;
            sub.metadata = {
              ...sub.metadata,
              appleAutoRenewEnabledAt: new Date(),
              asnReprocessedFromSkip: doc.notificationUUID,
            };
            await sub.save();
          }
        }
      }

      doc.processingStatus = 'processed';
      doc.skipReason = null;
      doc.userId = userId;
      doc.errorMessage = null;
      await doc.save();
      processed += 1;
    } catch (err) {
      logger.warn('[AppleASN] Error reprocesando ASN skipped', {
        notificationUUID: doc.notificationUUID,
        error: err?.message,
      });
    }
  }

  if (processed > 0) {
    await cacheService.invalidateUserCache(userId.toString()).catch(() => {});
    logger.payment('[AppleASN] ASN skipped reprocesados tras bind OID', {
      originalTransactionId: oid,
      userId: userId.toString(),
      processed,
    });
  }

  return { processed };
}

function isAutoRenewableSubscription(tx) {
  if (!tx?.type) return true;
  return (
    tx.type === Type.AUTO_RENEWABLE_SUBSCRIPTION ||
    tx.type === 'Auto-Renewable Subscription'
  );
}

const TYPES_EXTEND_SUBSCRIPTION = new Set([
  NotificationTypeV2.SUBSCRIBED,
  NotificationTypeV2.DID_RENEW,
  NotificationTypeV2.OFFER_REDEEMED,
  NotificationTypeV2.DID_CHANGE_RENEWAL_PREF,
  'SUBSCRIBED',
  'DID_RENEW',
  'OFFER_REDEEMED',
  'DID_CHANGE_RENEWAL_PREF',
]);

const TYPES_FORCE_EXPIRED = new Set([
  NotificationTypeV2.EXPIRED,
  NotificationTypeV2.GRACE_PERIOD_EXPIRED,
  NotificationTypeV2.REFUND,
  NotificationTypeV2.REVOKE,
  'EXPIRED',
  'GRACE_PERIOD_EXPIRED',
  'REFUND',
  'REVOKE',
]);

/**
 * Procesa el cuerpo POST de Apple (JSON con signedPayload).
 * @param {string|undefined} signedPayload
 */
export async function handleAppleServerNotification(signedPayload) {
  const normalized =
    typeof signedPayload === 'string'
      ? signedPayload.trim()
      : extractAppleSignedPayload(signedPayload);
  if (!normalized || typeof normalized !== 'string') {
    throw new Error('signedPayload requerido');
  }

  const { verifier, payload } = await verifyNotificationPayload(normalized);
  if (!payload || typeof payload !== 'object') {
    throw new Error('Notificación decodificada inválida (payload vacío)');
  }
  const notificationUUID = payload.notificationUUID;
  if (!notificationUUID) {
    throw new Error('Notificación sin notificationUUID');
  }

  const notificationType = payload.notificationType;
  const subtype = payload.subtype;
  const data = payload.data;

  const expectedBundle = getBundleId();
  if (data?.bundleId && data.bundleId !== expectedBundle) {
    try {
      await AppleServerNotification.create({
        notificationUUID,
        notificationType,
        subtype,
        bundleId: data.bundleId,
        environment: data?.environment != null ? String(data.environment) : null,
        processingStatus: 'skipped',
        skipReason: 'bundle_mismatch',
      });
    } catch (e) {
      if (e?.code === 11000) {
        return { duplicate: true, notificationUUID };
      }
      throw e;
    }
    logger.warn('[AppleASN] bundleId no coincide, ignorando', {
      expected: expectedBundle,
      got: data.bundleId,
      notificationUUID,
    });
    return { duplicate: false, skipped: true, reason: 'bundle_mismatch', notificationUUID };
  }

  let asnDoc;
  try {
    asnDoc = await AppleServerNotification.create({
      notificationUUID,
      notificationType: notificationType ?? null,
      subtype: subtype ?? null,
      bundleId: data?.bundleId ?? null,
      environment: data?.environment != null ? String(data.environment) : null,
      processingStatus: 'received',
    });
  } catch (e) {
    if (e?.code === 11000) {
      return { duplicate: true, notificationUUID };
    }
    throw e;
  }

  const finish = async (fields) => {
    await AppleServerNotification.findByIdAndUpdate(asnDoc._id, { $set: fields });
  };

  try {
    if (notificationType === NotificationTypeV2.TEST || notificationType === 'TEST') {
      await finish({
        processingStatus: 'skipped',
        skipReason: 'test_notification',
      });
      logger.payment('[AppleASN] Notificación TEST recibida', { notificationUUID });
      return { test: true, notificationUUID };
    }

    const tx = await safeDecodeTransaction(verifier, data?.signedTransactionInfo);
    const renewal = await safeDecodeRenewal(verifier, data?.signedRenewalInfo);

    const originalTransactionId =
      tx?.originalTransactionId || renewal?.originalTransactionId || null;
    const transactionId = tx?.transactionId || null;
    const productId = tx?.productId || null;

    if (tx && !isAutoRenewableSubscription(tx)) {
      await finish({
        processingStatus: 'skipped',
        skipReason: 'not_auto_renewable',
        originalTransactionId,
        transactionId,
        productId,
      });
      return { skipped: true, reason: 'not_auto_renewable', notificationUUID };
    }

    const userId = await resolveUserIdFromAppleIds(originalTransactionId, transactionId);

    await AppleServerNotification.findByIdAndUpdate(asnDoc._id, {
      $set: {
        originalTransactionId,
        transactionId,
        productId,
        userId: userId || null,
      },
    });

    if (!userId) {
      await finish({
        processingStatus: 'skipped',
        skipReason: 'user_not_found',
      });
      logger.payment('[AppleASN] Sin usuario local para originalTransactionId', {
        notificationUUID,
        notificationType,
        originalTransactionId,
        transactionId,
      });
      return { skipped: true, reason: 'user_not_found', notificationUUID };
    }

    if (
      notificationType === NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS ||
      notificationType === 'DID_CHANGE_RENEWAL_STATUS'
    ) {
      const sub = await Subscription.findOne({ userId });
      if (sub) {
        if (subtype === Subtype.AUTO_RENEW_DISABLED || subtype === 'AUTO_RENEW_DISABLED') {
          sub.cancelAtPeriodEnd = true;
          sub.metadata = {
            ...sub.metadata,
            appleAutoRenewDisabledAt: new Date(),
          };
          await sub.save();
        } else if (subtype === Subtype.AUTO_RENEW_ENABLED || subtype === 'AUTO_RENEW_ENABLED') {
          sub.cancelAtPeriodEnd = false;
          sub.metadata = { ...sub.metadata, appleAutoRenewEnabledAt: new Date() };
          await sub.save();
        }
      }
      await finish({ processingStatus: 'processed' });
      await cacheService.invalidateUserCache(userId.toString()).catch(() => {});
      await paymentAuditService
        .logEvent(
          'APPLE_ASN_RENEWAL_STATUS',
          {
            userId: userId.toString(),
            notificationUUID,
            subtype: subtype ?? null,
          },
          userId.toString()
        )
        .catch(() => {});
      return { processed: true, notificationUUID, kind: 'renewal_status' };
    }

    if (notificationType === NotificationTypeV2.DID_FAIL_TO_RENEW || notificationType === 'DID_FAIL_TO_RENEW') {
      await finish({ processingStatus: 'skipped', skipReason: 'fail_to_renew_no_state_change' });
      logger.payment('[AppleASN] DID_FAIL_TO_RENEW (sin cambiar premium; puede seguir grace)', {
        userId: userId.toString(),
        notificationUUID,
      });
      return { skipped: true, reason: 'did_fail_to_renew', notificationUUID };
    }

    const forceExpired =
      TYPES_FORCE_EXPIRED.has(notificationType) ||
      (tx?.revocationDate != null && tx.revocationDate > 0);

    if (forceExpired && !tx && userId) {
      const user = await User.findById(userId);
      if (user) {
        user.subscription = user.subscription || {};
        user.subscription.status = 'expired';
        if (!user.subscription.provider) user.subscription.provider = 'apple';
        await user.save();
      }
      await Subscription.findOneAndUpdate({ userId }, { $set: { status: 'expired' } });
      await finish({ processingStatus: 'processed' });
      await cacheService.invalidateUserCache(userId.toString()).catch(() => {});
      await paymentAuditService
        .logEvent(
          'APPLE_ASN_PROCESSED',
          {
            userId: userId.toString(),
            notificationUUID,
            notificationType,
            kind: 'expired_without_tx_payload',
          },
          userId.toString()
        )
        .catch(() => {});
      return { processed: true, notificationUUID, sync: 'expired_fallback' };
    }

    const shouldSyncTx =
      tx &&
      (TYPES_EXTEND_SUBSCRIPTION.has(notificationType) ||
        forceExpired ||
        notificationType === NotificationTypeV2.INITIAL_BUY ||
        notificationType === 'INITIAL_BUY');

    if (tx && shouldSyncTx) {
      const result = await appleReceiptService.syncSubscriptionFromStoreKit2Transaction(
        userId,
        tx,
        {
          forceExpired,
          createTransactionRecord: true,
          source: `apple_asn:${notificationType}`,
        }
      );
      if (!result.success) {
        await finish({
          processingStatus: 'error',
          errorMessage: result.error || 'sync failed',
        });
        return { error: result.error, notificationUUID };
      }
      await finish({ processingStatus: 'processed' });
      await cacheService.invalidateUserCache(userId.toString()).catch(() => {});
      await paymentAuditService
        .logEvent(
          'APPLE_ASN_PROCESSED',
          {
            userId: userId.toString(),
            notificationUUID,
            notificationType,
            subtype: subtype ?? null,
            appleTransactionId: transactionId,
          },
          userId.toString()
        )
        .catch(() => {});
      return { processed: true, notificationUUID, sync: true };
    }

    await finish({
      processingStatus: 'skipped',
      skipReason: 'notification_type_not_handled',
    });
    logger.payment('[AppleASN] Tipo no manejado explícitamente', {
      notificationUUID,
      notificationType,
      subtype,
    });
    return { skipped: true, reason: 'unhandled_type', notificationUUID };
  } catch (err) {
    await AppleServerNotification.findByIdAndUpdate(asnDoc._id, {
      $set: {
        processingStatus: 'error',
        errorMessage: err?.message || String(err),
      },
    }).catch(() => {});
    throw err;
  }
}

export { verifyNotificationPayload };
