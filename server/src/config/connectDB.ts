import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ [Database] Critical Error: MONGO_URI environment variable is missing in .env!');
      process.exit(1);
    }

    console.log('📡 [Database] Attempting connection to MongoDB...');
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ [Database] MongoDB Connected Successfully! Host: ${conn.connection.host}`);
    console.log(`📊 [Database] Database Name: ${conn.connection.name}`);
  } catch (error: any) {
    console.error(`❌ [Database] Connection Failure Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
