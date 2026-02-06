import 'reflect-metadata';
import 'dotenv/config';
import mongoose, { Model } from 'mongoose';
import bcrypt from 'bcrypt';

type DemoUser = {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
  roles?: string[];
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

function getUserModel(): Model<DemoUser> {
  const UserSchema = new mongoose.Schema<DemoUser>(
    {
      email: { type: String, unique: true, index: true },
      password: { type: String },
      username: { type: String },
      displayName: { type: String },
      roles: { type: [String], default: ['user'] },
      isVerified: { type: Boolean, default: true },
      createdAt: { type: Date, default: () => new Date() },
      updatedAt: { type: Date, default: () => new Date() },
    },
    { collection: 'users' }
  );

  if (mongoose.models.User) return mongoose.models.User as Model<DemoUser>;
  return mongoose.model<DemoUser>('User', UserSchema);
}

async function main() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

  if (!mongoUri) {
    console.error('❌ Missing MONGO_URI (or MONGODB_URI / DATABASE_URL) in environment.');
    console.error('   Tip: ensure you have a .env file OR export MONGO_URI before running.');
    process.exit(1);
  }

  console.log('🔌 Connecting to Mongo...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected');

  const UserModel = getUserModel();

  const email = 'demo@sharesync.io';
  const plain = 'demo123';

  console.log('🔐 Hashing password...');
  const hashed = await bcrypt.hash(plain, 10);

  console.log('👤 Upserting demo user...');
  const res = await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        password: hashed,
        username: 'demo',
        displayName: 'Demo User',
        roles: ['user'],
        isVerified: true,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seed complete:', { id: (res as any)?._id?.toString(), email: (res as any)?.email });

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
