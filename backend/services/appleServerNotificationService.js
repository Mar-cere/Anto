/**
 * App Store Server Notifications V2: verificación JWS y sincronización con User/Subscription.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  Environment,
  NotificationTypeV2,
  SignedDataVerifier,
  Subtype,
  Type,
} from '@apple/app-store-server-library';

import AppleServerNotification from '../models/AppleServerNotification.js';
import Subscription from '../models/Subscription.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import appleReceiptService from './appleReceiptService.js';
import cacheService from './cacheService.js';
import paymentAuditService from './paymentAuditService.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLE_ROOT_PEM = path.join(__dirname, '..', 'certs', 'apple_root_ca_g3.pem');

function loadAppleRootCertificates() {
  if (!fs.existsSync(APPLE_ROOT_PEM)) {
    throw new Error(`Falta certificado raíz Apple en ${APPLE_ROOT_PEM}`);
  }
  return [fs.readFileSync(APPLE_ROOT_PEM)];
}

function getBundleId() {
  return process.env.APPLE_BUNDLE_ID || 'com.anto.app';
}

function buildVerifiers() {
  const roots = loadAppleRootCertificates();
  const bundleId = getBundleId();
  const enableOnlineChecks = process.env.APPLE_ASN_ONLINE_OCSP !== 'false';
  const appAppleIdRaw = process.env.APPLE_APP_APPLE_ID;
  const appAppleId =
    appAppleIdRaw !== undefined && appAppleIdRaw !== '' && !Number.isNaN(Number(appAppleIdRaw))
      ? Number(appAppleIdRaw)
      : undefined;

  const production = new SignedDataVerifier(
    roots,
    enableOnlineChecks,
    Environment.PRODUCTION,
    bundleId,
    appAppleId
  );
  const sandbox = new SignedDataVerifier(
    roots,
    enableOnlineChecks,
    Environment.SANDBOX,
    bundleId,
    undefined
  );
  return { production, sandbox };
}

let verifierCache;
function getVerifiers() {
  if (!verifierCache) {
    verifierCache = buildVerifiers();
  }
  return verifierCache;
}

/**
 * @param {string} signedPayload
 * @returns {Promise<{ verifier: SignedDataVerifier, payload: import('@apple/app-store-server-library').ResponseBodyV2DecodedPayload }>}
 */
async function verifyNotificationPayload(signedPayload) {
  const { production, sandbox } = getVerifiers();
  try {
    const payload = await production.verifyAndDecodeNotification(signedPayload);
    return { verifier: production, payload };
  } catch (e1) {
    try {
      const payload = await sandbox.verifyAndDecodeNotification(signedPayload);
      return { verifier: sandbox, payload };
    } catch (e2) {
      const msg = `Fallo verificación JWS (prod: ${e1?.message}; sandbox: ${e2?.message})`;
      throw new Error(msg);
    }
  }
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

async function resolveUserIdFromAppleIds(originalTransactionId, transactionId) {
  const oid = originalTransactionId ? String(originalTransactionId) : null;
  const tid = transactionId ? String(transactionId) : null;

  if (oid) {
    const sub = await Subscription.findOne({
      $or: [
        { 'metadata.appleOriginalTransactionId': oid },
        ...(tid ? [{ 'metadata.appleTransactionId': tid }] : []),
      ],
    })
      .select('userId')
      .lean();
    if (sub?.userId) return sub.userId;
  }
  if (tid) {
    const txn = await Transaction.findOne({
      paymentProvider: 'apple',
      providerTransactionId: tid,
    })
      .sort({ createdAt: -1 })
      .select('userId')
      .lean();
    if (txn?.userId) return txn.userId;
  }
  if (oid) {
    const txn2 = await Transaction.findOne({
      paymentProvider: 'apple',
      'metadata.originalTransactionId': oid,
    })
      .sort({ createdAt: -1 })
      .select('userId')
      .lean();
    if (txn2?.userId) return txn2.userId;
  }
  return null;
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
  if (!signedPayload || typeof signedPayload !== 'string') {
    throw new Error('signedPayload requerido');
  }

  const { verifier, payload } = await verifyNotificationPayload(signedPayload);
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
