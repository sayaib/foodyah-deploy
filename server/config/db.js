// config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      serverApi: { version: "1", strict: true, deprecationErrors: true },
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("DB connection failed:", err);
  }
};

export default connectDB;
