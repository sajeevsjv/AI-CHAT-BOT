import dns from "node:dns";
import mongoose from "mongoose";

// Node on this machine picks up 127.0.0.1 as its DNS server, which refuses
// the SRV lookup that mongodb+srv:// URIs need. Use public resolvers instead.
if (dns.getServers().every((s) => s === "127.0.0.1" || s === "::1")) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const connectDB = async () => {
  const uri = process.env.MONGODB_ATLAS_URI;
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
