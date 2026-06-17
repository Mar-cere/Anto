/**
 * Backfill de embeddings topicFree para eventos históricos (#127 / #126).
 *
 * Uso:
 *   TOPIC_FREE_EMBEDDINGS_ENABLED=true npm run backfill:topic-free-embeddings
 *   npm run backfill:topic-free-embeddings -- --dry-run --limit=500
 *   npm run backfill:topic-free-embeddings -- --stats-only
 *   npm run backfill:topic-free-embeddings -- --loop --limit=500 --max-batches=20
 *   npm run backfill:topic-free-embeddings -- --userId=<mongoId>
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';
import {
  backfillTopicFreeEmbeddings,
  countTopicFreeEmbeddingsPending,
  isTopicFreeEmbeddingsEnabled,
} from '../services/topicFreeEmbeddingService.js';

dotenv.config();

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    statsOnly: false,
    loop: false,
    limit: 200,
    maxBatches: 50,
    delayMs: 80,
    userId: null,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--stats-only') opts.statsOnly = true;
    else if (arg === '--loop') opts.loop = true;
    else if (arg.startsWith('--limit=')) opts.limit = Number(arg.split('=')[1]) || 200;
    else if (arg.startsWith('--max-batches=')) opts.maxBatches = Number(arg.split('=')[1]) || 50;
    else if (arg.startsWith('--delay-ms=')) opts.delayMs = Number(arg.split('=')[1]) || 0;
    else if (arg.startsWith('--userId=')) opts.userId = arg.split('=')[1]?.trim() || null;
  }
  return opts;
}

function resolveUserId(raw) {
  if (!raw) return null;
  if (!mongoose.Types.ObjectId.isValid(raw)) {
    throw new Error(`userId inválido: ${raw}`);
  }
  return new mongoose.Types.ObjectId(String(raw));
}

async function printPending(userId) {
  const pending = await countTopicFreeEmbeddingsPending({
    updateModel: ChatInterventionEvent,
    userId,
  });
  console.log('[backfill-topic-free] pendientes:', pending);
  return pending;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada');
    process.exit(1);
  }

  const userId = resolveUserId(opts.userId);

  if (!opts.statsOnly && !isTopicFreeEmbeddingsEnabled()) {
    console.error(
      'Embeddings desactivados. Configura OPENAI_API_KEY y TOPIC_FREE_EMBEDDINGS_ENABLED=true (o NODE_ENV=production).',
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[backfill-topic-free] conectado a MongoDB');

  const before = await printPending(userId);
  if (opts.statsOnly) {
    await mongoose.disconnect();
    return;
  }

  if (before.pendingDocs === 0) {
    console.log('[backfill-topic-free] nada pendiente; salida OK');
    await mongoose.disconnect();
    return;
  }

  let batch = 0;
  let totalEmbedded = 0;
  let totalFailed = 0;
  let totalScanned = 0;

  do {
    batch += 1;
    const result = await backfillTopicFreeEmbeddings({
      updateModel: ChatInterventionEvent,
      userId,
      limit: opts.limit,
      dryRun: opts.dryRun,
      delayMs: opts.delayMs,
    });

    totalEmbedded += result.embedded;
    totalFailed += result.failed;
    totalScanned += result.scanned;

    console.log(`[backfill-topic-free] batch ${batch}:`, {
      ...result,
      dryRun: opts.dryRun,
      limit: opts.limit,
    });

    if (!opts.loop || opts.dryRun || result.scanned === 0) break;
    if (!opts.dryRun && result.embedded === 0 && result.failed > 0) {
      console.warn('[backfill-topic-free] batch sin progreso (fallos OpenAI); abortando loop');
      break;
    }
    if (batch >= opts.maxBatches) {
      console.warn(`[backfill-topic-free] alcanzado max-batches=${opts.maxBatches}`);
      break;
    }
  } while (true);

  const after = await printPending(userId);

  console.log('[backfill-topic-free] resumen:', {
    dryRun: opts.dryRun,
    batches: batch,
    totalScanned,
    totalEmbedded,
    totalFailed,
    pendingBefore: before.pendingDocs,
    pendingAfter: after.pendingDocs,
    userId: opts.userId,
  });

  await mongoose.disconnect();

  if (!opts.dryRun && totalFailed > 0 && totalEmbedded === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[backfill-topic-free] error:', err?.message || err);
  process.exit(1);
});
