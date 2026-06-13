/**
 * Backfill de embeddings topicFree para eventos históricos (#126 / #218 fase 2).
 *
 * Uso:
 *   TOPIC_FREE_EMBEDDINGS_ENABLED=true node scripts/backfill-topic-free-embeddings.mjs
 *   node scripts/backfill-topic-free-embeddings.mjs --dry-run --limit=500
 *   node scripts/backfill-topic-free-embeddings.mjs --userId=<mongoId>
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatInterventionEvent from '../models/ChatInterventionEvent.js';
import {
  backfillTopicFreeEmbeddings,
  isTopicFreeEmbeddingsEnabled,
} from '../services/topicFreeEmbeddingService.js';

dotenv.config();

function parseArgs(argv) {
  const opts = { dryRun: false, limit: 200, userId: null };
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg.startsWith('--limit=')) opts.limit = Number(arg.split('=')[1]) || 200;
    else if (arg.startsWith('--userId=')) opts.userId = arg.split('=')[1]?.trim() || null;
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada');
    process.exit(1);
  }
  if (!isTopicFreeEmbeddingsEnabled()) {
    console.error(
      'Embeddings desactivados. Configura OPENAI_API_KEY y TOPIC_FREE_EMBEDDINGS_ENABLED=true (o NODE_ENV=production).',
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[backfill-topic-free] conectado a MongoDB');

  const result = await backfillTopicFreeEmbeddings({
    updateModel: ChatInterventionEvent,
    userId: opts.userId,
    limit: opts.limit,
    dryRun: opts.dryRun,
  });

  console.log('[backfill-topic-free] resultado:', {
    ...result,
    dryRun: opts.dryRun,
    limit: opts.limit,
    userId: opts.userId,
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[backfill-topic-free] error:', err?.message || err);
  process.exit(1);
});
