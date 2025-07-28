import express from "express";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import FoodCategory from "../models/FoodCategory.js";
import { getFileBucketMenuImage } from "../config/imageBucket.js";
import multer from "multer";
import mongoose from "mongoose";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
// Create a menu item
router.post(
  "/create",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log(req.user);
      const { name, description, price, category, type, restaurantId, userId } =
        req.body;
      const gfs = await getFileBucketMenuImage();

      let imageId = null;

      if (req.file) {
        const stream = gfs.openUploadStream(req.file.originalname, {
          contentType: req.file.mimetype,
          metadata: {
            uploadedBy: req.user._id, // ✅ Include user ID in file metadata
            fieldName: name, // optional: to track which file type it is
          },
        });

        await new Promise((resolve, reject) => {
          stream.on("finish", () => {
            imageId = stream.id;
            resolve();
          });
          stream.on("error", reject);
          stream.end(req.file.buffer);
        });
      }

      // Create the menu item
      const menuItem = new MenuItem({
        name,
        description,
        price,
        category,
        type,
        restaurantId,
        userId,
        image: imageId,
      });

      await menuItem.save();

      // Add the menuItem's _id to the restaurant's menu array
      await Restaurant.findByIdAndUpdate(
        restaurantId,
        { $push: { menu: menuItem._id } },
        { new: true }
      );

      res.json({ success: true, data: menuItem });
    } catch (error) {
      console.error("Menu item upload failed:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get menu by restaurant
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    // Step 1: Find the restaurant
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    // Step 2: Get menu items that match the IDs in restaurant.menu
    const menuItems = await MenuItem.find({
      _id: { $in: restaurant.menu },
    });

    // Step 3: Send them as the response
    res.json({ success: true, data: menuItems });
  } catch (err) {
    console.error("Error fetching menu items by ID:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update Menu Item
router.put("/update/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});
router.delete("/delete/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res
        .status(404)
        .json({ success: false, msg: "Menu item not found" });
    }

    const gfs = await getFileBucketMenuImage();

    // Delete image from GridFS if it exists
    if (menuItem.image) {
      try {
        const fileId = new mongoose.Types.ObjectId(menuItem.image);
        // await gfs.delete(fileId);
        const found = await gfs.find({ _id: fileId }).toArray();

        if (found.length) {
          await gfs.delete(fileId);
          console.log(`Deleted file and chunks for ID: ${fileId}`);
        } else {
          console.warn("File not found in GridFS");
        }
      } catch (err) {
        console.error("Failed to delete image from GridFS:", err.message);
      }
    }

    // Remove the menu item's ID from the restaurant's menu array
    await Restaurant.findByIdAndUpdate(menuItem.restaurantId, {
      $pull: { menu: menuItem._id },
    });

    // Delete the menu item itself
    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      msg: "Menu item, image, and reference removed successfully",
    });
  } catch (err) {
    console.error("Delete failed:", err.message);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Add Category
router.post("/add-category", async (req, res) => {
  try {
    const { name } = req.body;
    const newCategory = new FoodCategory({ name });
    await newCategory.save();
    res
      .status(201)
      .json({ success: true, msg: "Category added", data: newCategory });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// Get All Categories
router.get("/get-category", async (req, res) => {
  const categories = await FoodCategory.find({});
  res.json({ success: true, data: categories });
});

// Delete Category
router.delete("/delete-category/:id", async (req, res) => {
  try {
    await FoodCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "Category deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
