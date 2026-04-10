import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as path from 'path';

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SEED_PLAYERS = [
  {
    email: 'admin@example.com',
    displayName: 'Admin',
    password: 'Admin123',
    role: 'president',
    phone: '0123456789',
  },
];

async function seed() {
  // Init Firebase Admin
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
  firestore.settings({ ignoreUndefinedProperties: true });

  const collection = firestore.collection('users');

  console.log('🌱 Starting seed...\n');

  for (const player of SEED_PLAYERS) {
    // Check if user already exists
    const existing = await collection.where('email', '==', player.email).get();

    if (!existing.empty) {
      console.log(`⚠️  User "${player.email}" already exists — skipping.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(player.password, 10);
    const now = new Date();

    const data = {
      email: player.email,
      displayName: player.displayName,
      password: hashedPassword,
      role: player.role,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await collection.add(data);
    console.log(
      `✅ Created player: ${player.email} | role: ${player.role} | id: ${docRef.id}`,
    );
  }

  console.log('\n🎉 Seed completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
