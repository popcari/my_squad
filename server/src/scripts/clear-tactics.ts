import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as path from 'path';

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const COLLECTIONS = ['match_lineups', 'formations'];

async function clearCollection(
  firestore: admin.firestore.Firestore,
  name: string,
) {
  const collection = firestore.collection(name);
  const snapshot = await collection.get();
  if (snapshot.empty) {
    console.log(`✅ ${name}: already empty.`);
    return 0;
  }

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
      batch = firestore.batch();
      pending = 0;
    }
  }
  if (pending > 0) {
    await batch.commit();
    deleted += pending;
  }
  console.log(`✅ ${name}: deleted ${deleted} document(s).`);
  return deleted;
}

async function clearTactics() {
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

  console.log('🧹 Clearing tactics collections...');
  let total = 0;
  for (const name of COLLECTIONS) {
    total += await clearCollection(firestore, name);
  }
  console.log(`\n🎉 Done. Total deleted: ${total} document(s).`);
  process.exit(0);
}

clearTactics().catch((err) => {
  console.error('❌ Clear failed:', err);
  process.exit(1);
});
