import mongoose from 'mongoose';

let memoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI && process.env.MONGO_URI.trim();

    if (mongoUri) {
      console.log('🔄 Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      return conn;
    }

    // Fallback for local development if MONGO_URI is not set
    console.log('⚠️  No MONGO_URI specified in .env. Initializing local embedded MongoDB instance for seamless development...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const devUri = memoryServer.getUri();
      const conn = await mongoose.connect(devUri);
      console.log(`✅ Local Dev MongoDB Connected: ${devUri}`);
      console.log('👉 To connect to MongoDB Atlas in production, set MONGO_URI in server/.env');
      return conn;
    } catch (memErr) {
      console.error('❌ Could not start local embedded MongoDB:', memErr.message);
      throw new Error('Please configure a valid MONGO_URI in your .env file.');
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // In dev, let caller handle or inspect
    throw error;
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

export default connectDB;
