import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function clearUserTraits() {
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
  const collection = firestore.collection('user_traits');

  console.log('🧹 Fetching all user_traits documents...');
  const snapshot = await collection.get();

  if (snapshot.empty) {
    console.log('✅ Collection is already empty. Nothing to delete.');
    process.exit(0);
  }

  console.log(`⚠️  Found ${snapshot.size} document(s). Deleting...`);

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

  console.log(`✅ Deleted ${deleted} user_traits document(s).`);
  process.exit(0);
}

clearUserTraits().catch((err) => {
  console.error('❌ Clear failed:', err);
  process.exit(1);
});
