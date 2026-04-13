import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as path from 'path';

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function clearMatchLineups() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  const firestore = admin.firestore();
  const collection = firestore.collection('match_lineups');

  console.log('🧹 Fetching all match_lineups documents...');
  const snapshot = await collection.get();

  if (snapshot.empty) {
    console.log('✅ Collection is already empty. Nothing to delete.');
    process.exit(0);
  }

  console.log(`⚠️  Found ${snapshot.size} document(s). Deleting...`);

  // Firestore batch limit is 500 ops.
  const BATCH_SIZE = 450;
  let deleted = 0;
  let batch = firestore.batch();
  let pending = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    pending += 1;
    if (pending >= BATCH_SIZE) {
      await batch.commit();
      deleted += pending;
      console.log(`   Deleted ${deleted}/${snapshot.size}...`);
      batch = firestore.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
    deleted += pending;
  }

  console.log(`✅ Deleted ${deleted} match_lineups document(s).`);
  process.exit(0);
}

clearMatchLineups().catch((err) => {
  console.error('❌ Clear failed:', err);
  process.exit(1);
});
