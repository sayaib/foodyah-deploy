// routes/search.js
import express from "express";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

router.get("/suggestions", async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    const regex = new RegExp(query, "i"); // case-insensitive

    // Find restaurants
    const restaurants = await Restaurant.find(
      { name: { $regex: regex } },
      { _id: 1, name: 1 }
    ).limit(5);

    // Find menu items and populate restaurant
    const menuItems = await MenuItem.find(
      { name: { $regex: regex } },
      { name: 1, restaurantId: 1 }
    )
      .limit(5)
      .populate("restaurantId", "name");

    const suggestions = [];

    restaurants.forEach(
      (r) => suggestions.push({ type: "restaurant", name: r.name, _id: r._id }) // <- ADD _id
    );

    menuItems.forEach((item) =>
      suggestions.push({
        type: "menu",
        name: item.name,
        restaurant: item.restaurantId?.name || "Unknown",
        restaurantId: item.restaurantId?._id?.toString() || "", // <- Add this
      })
    );

    res.json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
