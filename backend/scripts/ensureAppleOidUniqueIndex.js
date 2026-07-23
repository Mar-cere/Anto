/**
 * One-shot: limpia duplicados de metadata.appleOriginalTransactionId y asegura índice único sparse.
 *
 * Uso:
 *   node backend/scripts/ensureAppleOidUniqueIndex.js           # dry-run
 *   node backend/scripts/ensureAppleOidUniqueIndex.js --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const APPLY = process.argv.includes('--apply');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('Falta MONGO_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const col = mongoose.connection.collection('subscriptions');

  const dupes = await col
    .aggregate([
      {
        $match: {
          'metadata.appleOriginalTransactionId': { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: '$metadata.appleOriginalTransactionId',
          ids: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  console.log(`Duplicados OID Apple: ${dupes.length}`);
  for (const d of dupes) {
    const keep = d.ids[0];
    const drop = d.ids.slice(1);
    console.log(`OID ${d._id}: keep ${keep}, release ${drop.length}`);
    if (APPLY) {
      await col.updateMany(
        { _id: { $in: drop } },
        {
          $set: {
            'metadata.releasedAppleOriginalTransactionId': d._id,
            'metadata.releasedAt': new Date(),
            'metadata.releasedReason': 'dedupe_unique_index',
            'metadata.appleOriginalTransactionId': null,
            'metadata.appleTransactionId': null,
          },
        }
      );
    }
  }

  const indexName = 'metadata_appleOriginalTransactionId_unique_sparse';
  const existing = await col.indexes();
  const oldNonUnique = existing.find(
    (idx) =>
      idx.key &&
      idx.key['metadata.appleOriginalTransactionId'] === 1 &&
      !idx.unique
  );
  if (oldNonUnique && APPLY) {
    console.log(`Eliminando índice no único: ${oldNonUnique.name}`);
    await col.dropIndex(oldNonUnique.name);
  }

  if (APPLY) {
    await col.createIndex(
      { 'metadata.appleOriginalTransactionId': 1 },
      { unique: true, sparse: true, name: indexName }
    );
    console.log(`Índice asegurado: ${indexName}`);
  } else {
    console.log('Dry-run. Ejecuta con --apply para aplicar.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
