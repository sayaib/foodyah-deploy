import express from "express";
import {
  sendDeliveryToAllDevices,
  sendDeliveryToAllPartners,
} from "../socket/socketServer.js";

const router = express.Router();
// Test route to trigger delivery
router.get("/send-delivery", (req, res) => {
  console.log("🚚 /send-delivery endpoint hit");

  const orderData = {
    orderId: "6890cf51d210ee52276670da",
    restaurantName: "Pizza Hub1",
    address: "21, MG Road",
    amount: 499,
  };

  const count = sendDeliveryToAllDevices(orderData);
  console.log("🔢 Partners contacted:", count);

  res.setHeader("Cache-Control", "no-store");

  if (count > 0) {
    res.send(`✅ Delivery request sent to ${count} partner(s).`);
  } else {
    res.status(404).send("❌ No delivery partners connected.");
  }
});

export default router;
