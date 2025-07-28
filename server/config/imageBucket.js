// config/gridfs.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) throw new Error("Missing MONGO_URI in environment");

await mongoose.connect(mongoURI);

const conn = mongoose.connection;

const getFileBucketMenuImage = () =>
  new Promise((resolve, reject) => {
    if (conn.readyState === 1) {
      const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: "menuimages",
      });
      return resolve(bucket);
    }

    conn.once("open", () => {
      const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: "menuimages",
      });
      resolve(bucket);
    });

    conn.on("error", reject);
  });

export { getFileBucketMenuImage };
