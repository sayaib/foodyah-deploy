// socket/socketServer.js

import { Server } from "socket.io";
import Order from "../models/Order.js";

// Map to store all connected devices: socketId => socket instance
const connectedSockets = new Map();

let io = null;

/**
 * Initialize the Socket.IO server
 */
export function setupSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const socketId = socket.id;

    console.log("✅ New device connected");
    console.log("   • Socket ID:", socketId);

    // Store socket in the map
    connectedSockets.set(socketId, socket);

    /**
     * 🛰️ Handle location updates from the device
     * Payload: { lat: Number, lon: Number }
     */
    socket.on("updateLocation", async (location) => {
      console.log(`📍 Location update from ${socketId}:`, location);

      if (!location?.latitude || !location?.longitude) {
        console.warn(`⚠️ Invalid location from ${socketId}`);
        return;
      }

      try {
        const updatedOrder = await Order.findOneAndUpdate(
          { socketId }, // Ensure your Order model includes a socketId field
          {
            $set: {
              deliveryLocation: {
                type: "Point",
                coordinates: [location.lon, location.lat],
              },
            },
          },
          { new: true }
        );

        if (updatedOrder) {
          console.log(`✅ Order location updated for ${socketId}`);
        } else {
          console.warn(`⚠️ No matching order for socket ID ${socketId}`);
        }
      } catch (err) {
        console.error(`❌ Error updating location for ${socketId}:`, err);
      }
    });

    /**
     * 📦 Handle order acceptance
     * Payload: { orderId, status, ... }
     */

    socket.on("delivery_response", (data) => {
      console.log("response", data);
    });
    socket.on("new_delivery_request", (data) => {
      console.log(`📦 Delivery request accepted by ${socketId}:`, data);
      // Optional: Save acceptance in DB or notify customer
    });

    /**
     * ❌ Handle disconnection
     */
    socket.on("disconnect", () => {
      console.log(`🔌 Device disconnected: ${socketId}`);
      connectedSockets.delete(socketId);
    });
  });

  console.log("🚀 Socket.IO server initialized");
}

/**
 * 🔄 Send order request to all connected sockets
 * @param {Object} orderData - order details to send
 * @returns {number} number of devices notified
 */
export function sendDeliveryToAllDevices(orderData) {
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized.");
    return 0;
  }

  let count = 0;

  for (const [socketId, socket] of connectedSockets.entries()) {
    socket.emit("new_delivery_request", orderData);
    console.log(`📨 Sent delivery request to ${socketId}`);
    count++;
  }

  return count;
}

/**
 * 🎯 Send order request to a specific socket ID
 * @param {string} socketId - target device socket ID
 * @param {Object} orderData - order details
 * @returns {boolean} success
 */
export function sendDeliveryToAllPartners(socketId, orderData) {
  const socket = connectedSockets.get(socketId);

  if (socket) {
    socket.emit("new_delivery_request", orderData);
    console.log(`📨 Sent delivery request to ${socketId}`);
    return true;
  } else {
    console.warn(`⚠️ Socket ID ${socketId} not connected`);
    return false;
  }
}
