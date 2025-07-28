// routes/files.js
import express from "express";
import mongoose from "mongoose";
import { getFileBucket } from "../config/gridfs.js";
import { getFileBucketMenuImage } from "../config/imageBucket.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const gfs = await getFileBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const stream = gfs.openDownloadStream(fileId);
    stream.on("error", () =>
      res.status(404).json({ message: "File not found" })
    );

    res.setHeader("Content-Disposition", "inline");
    stream.pipe(res);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving file", error: err.message });
  }
});
router.get("/menu-image/:id", async (req, res) => {
  try {
    const gfs = await getFileBucketMenuImage();
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const stream = gfs.openDownloadStream(fileId);
    stream.on("error", () =>
      res.status(404).json({ message: "File not found" })
    );

    res.setHeader("Content-Disposition", "inline");
    stream.pipe(res);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving file", error: err.message });
  }
});

export default router;
