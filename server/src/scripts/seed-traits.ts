import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SEED_TRAITS: { name: string; description: string }[] = [
  {
    name: 'Finesse Shot (Sút xoáy)',
    description:
      'Giúp các pha cứa lòng (Z+D) có độ xoáy lớn và chính xác hơn, cực kỳ quan trọng cho tiền đạo.',
  },
  {
    name: 'Outside Foot Shot (Sút má ngoài)',
    description:
      'Cầu thủ thường xuyên dùng má ngoài để dứt điểm hoặc chuyền bóng, hữu ích khi góc sút bị hẹp.',
  },
  {
    name: 'Power Header (Đánh đầu mạnh)',
    description:
      'Tăng uy lực cho các pha không chiến, bóng đi căng và khó cản phá hơn.',
  },
  {
    name: 'Chip Shot (Sút lốp bóng)',
    description:
      'Cầu thủ thực hiện các pha bấm bóng (L1+O hoặc Q+D) qua đầu thủ môn nhạy bén hơn.',
  },
  {
    name: 'Distance Shooter (Chuyên gia sút xa)',
    description:
      'Cầu thủ có xu hướng sút xa tốt và lực sút mạnh khi ở ngoài vòng cấm.',
  },
  {
    name: 'Playmaker (Kiến tạo)',
    description:
      'Cầu thủ đóng vai trò linh hồn, thường xuyên nhận bóng và tung ra các đường chuyền dọn cỗ.',
  },
  {
    name: 'Long Passer (Chuyền dài)',
    description:
      'Tăng độ chính xác cho những pha phất bóng bổng hoặc chuyền dài vượt tuyến.',
  },
  {
    name: 'Early Crosser (Tạt bóng sớm)',
    description:
      'Cầu thủ có khả năng tạt bóng xoáy và chuẩn xác ngay khi chưa xuống sát đường biên ngang.',
  },
  {
    name: 'Swerve Pass (Chuyền xoáy)',
    description:
      'Các đường chuyền đi theo quỹ đạo cong, giúp bóng vượt qua tầm kiểm soát của đối phương dễ dàng hơn.',
  },
  {
    name: 'Technical Dribbler (Rê bóng kỹ thuật)',
    description:
      'Giúp cầu thủ giữ bóng sát chân và xoay sở khéo léo trong phạm vi hẹp.',
  },
  {
    name: 'Speed Dribbler (Rê bóng tốc độ)',
    description: 'Duy trì tốc độ cao khi đang cầm bóng chạy dọc biên.',
  },
  {
    name: 'Solid Player (Cứng cáp)',
    description:
      'Giúp cầu thủ ít bị chấn thương và trụ vững hơn trong các pha tranh chấp tay đôi.',
  },
  {
    name: 'Injury Prone (Dễ chấn thương)',
    description:
      'Một trait tiêu cực, khiến cầu thủ dễ gặp chấn thương sau những pha va chạm mạnh.',
  },
  {
    name: 'Dives Into Tackles (Xoạc bóng)',
    description:
      'AI sẽ tự động thực hiện các pha xoạc bóng khi thấy có cơ hội lấy bóng trong chân đối thủ.',
  },
  {
    name: 'GK Long Throw (Thủ môn ném bóng xa)',
    description:
      'Giúp thủ môn phát động tấn công nhanh bằng những cú ném bóng cực xa và chính xác.',
  },
  {
    name: 'GK One on One (Thủ môn đối mặt)',
    description:
      'Tăng khả năng cản phá và phản xạ khi đối đầu trực diện với tiền đạo đối phương.',
  },
  {
    name: 'Leadership (Lãnh đạo)',
    description:
      'Thường dành cho đội trưởng, giúp ổn định tinh thần và tổ chức hàng phòng ngự tốt hơn.',
  },
  {
    name: 'Avoid Using Weaker Foot (Tránh sai chân thuận)',
    description:
      'Cầu thủ sẽ luôn ưu tiên dùng chân thuận để xử lý, phù hợp với những người có chân không thuận quá yếu (2 hoặc 3 sao).',
  },
  {
    name: 'Flair (Linh hoạt)',
    description:
      'Cầu thủ thường thực hiện các động tác ngẫu hứng như đánh gót, chuyền bóng bằng ngực hoặc các skill đẹp mắt.',
  },
];

async function seedTraits() {
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
  const collection = firestore.collection('traits');

  console.log('🌱 Seeding traits...\n');

  let created = 0;
  let skipped = 0;

  for (const trait of SEED_TRAITS) {
    const existing = await collection.where('name', '==', trait.name).get();
    if (!existing.empty) {
      console.log(`⚠️  "${trait.name}" already exists — skipping.`);
      skipped += 1;
      continue;
    }

    const now = new Date();
    const docRef = await collection.add({
      ...trait,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✅ ${trait.name}  (id: ${docRef.id})`);
    created += 1;
  }

  console.log(`\n🎉 Done. Created ${created}, skipped ${skipped}.`);
  process.exit(0);
}

seedTraits().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
