// routes/restaurant.js
import express from "express";
import multer from "multer";
import { getFileBucket } from "../config/gridfs.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js"; // Make sure this is imported
import authMiddleware from "../middleware/auth.js"; // Assuming you have an auth middleware
import mongoose from "mongoose";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/",
  authMiddleware, // ✅ Protect this route to get req.user
  upload.fields([
    { name: "logo_images", maxCount: 1 },
    { name: "theme_images", maxCount: 1 },
    { name: "menu_images", maxCount: 1 },
    { name: "fssai", maxCount: 1 },
    { name: "gst", maxCount: 1 },
  ]),

  async (req, res) => {
    try {
      const { name, email, phone, cuisine_types, address } = req.body;
      const {
        label,
        addressLine,
        city,
        state,
        country,
        pincode,
        location, // { type: "Point", coordinates: [lng, lat] }
        isDefault = false,
      } = JSON.parse(address);
      console.log();
      const gfs = await getFileBucket();
      const uploadToGridFS = (file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = gfs.openUploadStream(file.originalname, {
            contentType: file.mimetype,
            metadata: {
              uploadedBy: req.user._id, // ✅ Include user ID in file metadata
              fieldName: file.fieldname, // optional: to track which file type it is
            },
          });
          uploadStream.end(file.buffer);
          uploadStream.on("finish", () => resolve(uploadStream.id));
          uploadStream.on("error", reject);
        });
      };
      const themeImageIds = await Promise.all(
        (req.files["theme_images"] || []).map(uploadToGridFS)
      );
      const logoImageIds = await Promise.all(
        (req.files["logo_images"] || []).map(uploadToGridFS)
      );
      const menuImageIds = await Promise.all(
        (req.files["menu_images"] || []).map(uploadToGridFS)
      );
      const fssaiId = req.files["fssai"]?.[0]
        ? await uploadToGridFS(req.files["fssai"][0])
        : null;
      const gstId = req.files["gst"]?.[0]
        ? await uploadToGridFS(req.files["gst"][0])
        : null;
      // Create restaurant document
      const restaurant = new Restaurant({
        userID: req.user._id,
        name,
        email,
        phone,
        addresses: JSON.parse(address),
        cuisine_types,
        menu_images: menuImageIds,
        logo_images: logoImageIds,
        theme_images: themeImageIds,
        documents: { fssai: fssaiId, gst: gstId },
      });
      await restaurant.save();
      // ✅ Link restaurant to user
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.restaurant = restaurant._id;
      await user.save();
      res.status(201).json({
        message: "Restaurant registered successfully",
        restaurantId: restaurant._id,
      });
    } catch (err) {
      console.error("Error saving restaurant:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "restaurant",
      "status name userID"
    );

    console.log(user);

    if (!user || !user.restaurant) {
      return res.status(404).json({ message: "Restaurant not registered yet" });
    }

    res.json({
      id: user.restaurant._id,
      status: user.restaurant.status,
      name: user.restaurant.name,
      userID: user.restaurant.userID,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/restaurants?search=abc&page=1&limit=10
router.get("/getRestaurantData", async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  const query = search
    ? {
        $or: [
          { status: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [restaurants, total] = await Promise.all([
    Restaurant.find(query).skip(skip).limit(parseInt(limit)),
    Restaurant.countDocuments(query),
  ]);

  res.json({
    data: restaurants,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/verify", async (req, res) => {
  const { restaurantId, status, remarks } = req.body;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant)
    return res.status(404).json({ success: false, message: "Not found" });

  restaurant.status = status;
  restaurant.verificationRemarks = remarks;
  await restaurant.save();

  res.json({ success: true, message: "Status updated" });
});

// Update commission percentage
router.put("/commission/:id", authMiddleware, async (req, res) => {
  try {
    const { commission_percentage } = req.body;
    
    if (!commission_percentage || commission_percentage < 0 || commission_percentage > 100) {
      return res.status(400).json({ 
        success: false, 
        message: "Commission percentage must be between 0 and 100" 
      });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { commission_percentage },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: "Restaurant not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Commission percentage updated",
      commission_percentage: restaurant.commission_percentage
    });
  } catch (err) {
    console.error("Error updating commission:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
});

router.get("/data/:userLat/:userLng", async (req, res) => {
  try {
    const { userLat, userLng } = req.params;

    console.log(userLat, userLng);
    const restaurants = await Restaurant.find({
      status: "active", // Only active restaurants
      "addresses.location": {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [userLng, userLat],
          },
          $maxDistance: 10000, // 10 km in meters
        },
      },
    });

    if (!restaurants.length) {
      return res.status(404).json({
        success: false,
        msg: "No nearby active restaurants found.",
      });
    }

    res.json(restaurants);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurant?page=1
router.get("/lazy/:userLat/:userLng", async (req, res) => {
  try {
    const { userLat, userLng } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([
      Restaurant.find({
        status: "active", // Only active restaurants
        "addresses.location": {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [userLng, userLat],
            },
            $maxDistance: 10000, // 10 km in meters
          },
        },
      })
        .sort({ createdAt: -1 }) // Optional: latest first
        .skip(skip)
        .limit(limit),
      Restaurant.countDocuments(),
    ]);

    const hasMore = skip + limit < total;

    if (!restaurants.length) {
      return res.status(404).json({
        success: false,
        msg: "No nearby active restaurants found.",
      });
    }

    res.json({
      success: true,
      data: restaurants,
      hasMore,
    });
  } catch (err) {
    console.error("Error fetching restaurants:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
export default router;
