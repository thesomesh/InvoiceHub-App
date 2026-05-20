const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

const connectDB = async () => {
  const connectWithUri = async (uri) =>
    mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5219,
    });

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/InvoiceHub";

    const conn = await connectWithUri(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`MongoDB connection error: ${err.message}`);

    try {
      // Fallback for local/dev runs when MongoDB service is not installed.
      memoryServer = await MongoMemoryServer.create();
      const memoryUri = memoryServer.getUri();
      const conn = await connectWithUri(memoryUri);
      console.log(`Using in-memory MongoDB: ${conn.connection.host}`);
    } catch (memoryErr) {
      console.error(`In-memory MongoDB startup failed: ${memoryErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
