/**
 * Snapshot de salud para balanceadores y alertas (#25 / Bloque C).
 * Sin secretos ni contenido clínico.
 */
import mongoose from 'mongoose';
import { features } from '../config/features.js';
import cacheService from './cacheService.js';
import { isTopicFreeEmbeddingsEnabled } from './topicFreeEmbeddingService.js';
import {
  getAtlasVectorIndexName,
  getVectorSearchMode,
  isAtlasVectorSearchEnabled,
} from './topicFreeVectorSearchService.js';
import { isPersonalPatternRagEnabled } from './personalPatternRagService.js';
import metricsService from './metricsService.js';

export function getMongoDBStatus() {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[state] || 'unknown';
}

function buildRedisSnapshot() {
  return (
    cacheService.getHealthStatus?.() || {
      configured: false,
      connected: null,
      mode: 'memory_only',
    }
  );
}

function buildOpenAiSnapshot() {
  const configured = Boolean(String(process.env.OPENAI_API_KEY || '').trim());
  return { configured };
}

function buildAtlasSnapshot({ includeIndexName = false } = {}) {
  const snapshot = {
    embeddingsEnabled: isTopicFreeEmbeddingsEnabled(),
    vectorSearchEnabled: isAtlasVectorSearchEnabled(),
    searchMode: getVectorSearchMode(),
  };
  if (includeIndexName) {
    snapshot.indexName = getAtlasVectorIndexName();
  }
  return snapshot;
}

function buildChatFeaturesSnapshot() {
  return {
    personalPatternRag: isPersonalPatternRagEnabled(),
    crisisHardStop: features.crisisHardStop === true,
    crisisRouting: metricsService.getCrisisRoutingSnapshot(),
  };
}

function buildWorkersSnapshot() {
  return {
    crisisFollowUp: features.crisisFollowUp,
    intenseChatCheckIn: features.intenseChatCheckIn,
    notificationScheduler: features.notificationScheduler,
    weeklyPatternInsight: features.weeklyPatternInsightWorker,
    weeklyInsightLlm: features.weeklyInsightLlm,
    lastSessionSummary: features.lastSessionSummaryWorker,
    chatLatencySloMonitor: features.chatLatencySloMonitor,
    crisisRoutingSloMonitor: features.crisisRoutingSloMonitor,
  };
}

function buildObservabilitySnapshot() {
  return {
    sentryConfigured: Boolean(String(process.env.SENTRY_DSN || '').trim()),
  };
}

export function resolveOverallStatus({ database, openai, redis }) {
  if (database !== 'connected') return 'unavailable';
  if (!openai.configured) return 'degraded';
  if (redis.configured && redis.connected === false) return 'degraded';
  return 'ok';
}

/**
 * @param {{ version?: string }} [options]
 */
export function buildPublicHealthSnapshot(options = {}) {
  const database = getMongoDBStatus();
  const redis = buildRedisSnapshot();
  const openai = buildOpenAiSnapshot();
  const atlas = buildAtlasSnapshot({ includeIndexName: false });
  const status = resolveOverallStatus({ database, openai, redis });

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database,
    environment: process.env.NODE_ENV || 'development',
    version: options.version || process.env.APP_VERSION || '1.0.0',
    dependencies: {
      redis,
      openai,
      atlas,
    },
    observability: buildObservabilitySnapshot(),
  };
}

export function buildDetailedHealthSnapshot(options = {}) {
  const base = buildPublicHealthSnapshot(options);
  const atlas = buildAtlasSnapshot({ includeIndexName: true });
  const allDepsOk =
    base.database === 'connected' &&
    base.dependencies.openai.configured &&
    (!base.dependencies.redis.configured || base.dependencies.redis.connected !== false);

  return {
    ...base,
    status: allDepsOk ? base.status : 'degraded',
    dependencies: {
      ...base.dependencies,
      atlas,
    },
    workers: buildWorkersSnapshot(),
    chatFeatures: buildChatFeaturesSnapshot(),
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
    },
    node: {
      version: process.version,
      platform: process.platform,
    },
    services: {
      mongodb: base.database === 'connected',
      redis: !base.dependencies.redis.configured || base.dependencies.redis.connected === true,
      openai: base.dependencies.openai.configured,
      atlasVectorSearch: atlas.vectorSearchEnabled,
    },
  };
}

export function getHealthHttpStatus(snapshot) {
  if (snapshot.status === 'unavailable') return 503;
  return 200;
}

export default {
  getMongoDBStatus,
  resolveOverallStatus,
  buildPublicHealthSnapshot,
  buildDetailedHealthSnapshot,
  getHealthHttpStatus,
};
