const dns = require("dns");
const mongoose = require("mongoose");

const DEFAULT_MONGO_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

const configureMongoDns = (mongoUri) => {
  if (!mongoUri.startsWith("mongodb+srv://")) {
    return;
  }

  const dnsServers = (process.env.MONGO_DNS_SERVERS || DEFAULT_MONGO_DNS_SERVERS.join(","))
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length > 0) {
    dns.setServers(dnsServers);
  }
};

/**
 * Connect to MongoDB using Mongoose.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined. Check your .env file.");
  }

  configureMongoDns(mongoUri);

  // Print URI (password hidden)
  console.log(
    "Mongo URI:",
    mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:******@")
  );

  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:");
    console.error(error);
    throw error;
  }
};

module.exports = connectDB;
