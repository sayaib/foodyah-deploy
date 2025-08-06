import express from 'express';
import Order from "../models/Order.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import calculateRouteInfo from "../utils/calculateRouteInfo.js";

const router = express.Router();

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select("-password -otp");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's order history with filtering and pagination
router.get("/orders", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user.id };
    
    // Add status filter if provided
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);
    
    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error("Error fetching orders:", err.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get specific order by ID
router.get("/orders/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const routeInfo = await calculateRouteInfo(
      order?.deliveryLocation?.coordinates,
      order?.restaurantLocation?.coordinates,
      order?.userLocation?.coordinates
    );
    
    res.json({
      order,
      routeInfo
    });
  } catch (err) {
    console.error("Error fetching order:", err.message);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Cancel an order
router.post("/orders/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Only allow cancellation for certain statuses
    const allowedStatuses = ['placed', 'confirmed', 'preparing'];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        error: "Order cannot be cancelled in its current status"
      });
    }
    
    order.status = "cancelled";
    await order.save();
    
    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    console.error("Error cancelling order:", err.message);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

export default router;