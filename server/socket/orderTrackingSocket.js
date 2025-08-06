// socket/orderTrackingSocket.js

import { Server } from "socket.io";
import Order from "../models/Order.js";

// Map to store all connected clients by userId
const connectedUsers = new Map();
// Map to store all connected delivery partners by partnerId
const connectedPartners = new Map();

let io = null;

/**
 * Initialize the Socket.IO server for order tracking
 */
export function setupOrderTrackingSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/order-tracking",
  });

  io.on("connection", (socket) => {
    const socketId = socket.id;
    console.log(`✅ New client connected: ${socketId}`);

    /**
     * Handle user authentication
     * Payload: { userId: String }
     */
    socket.on("authenticate_user", (data) => {
      if (!data?.userId) {
        socket.emit("error", { message: "User ID is required" });
        return;
      }

      const userId = data.userId;
      console.log(`🔐 User authenticated: ${userId}`);
      
      // Store user connection
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId).add(socketId);
      
      // Associate socket with user
      socket.userId = userId;
      
      // Join user-specific room
      socket.join(`user:${userId}`);
      
      socket.emit("authentication_success", { userId });
    });

    /**
     * Handle delivery partner authentication
     * Payload: { partnerId: String }
     */
    socket.on("authenticate_partner", (data) => {
      if (!data?.partnerId) {
        socket.emit("error", { message: "Partner ID is required" });
        return;
      }

      const partnerId = data.partnerId;
      console.log(`🔐 Partner authenticated: ${partnerId}`);
      
      // Store partner connection
      if (!connectedPartners.has(partnerId)) {
        connectedPartners.set(partnerId, new Set());
      }
      connectedPartners.get(partnerId).add(socketId);
      
      // Associate socket with partner
      socket.partnerId = partnerId;
      
      // Join partner-specific room
      socket.join(`partner:${partnerId}`);
      
      socket.emit("authentication_success", { partnerId });
    });

    /**
     * Handle location updates from delivery partners
     * Payload: { orderId: String, location: { lat: Number, lng: Number } }
     */
    socket.on("update_location", async (data) => {
      if (!socket.partnerId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      if (!data?.orderId || !data?.location?.lat || !data?.location?.lng) {
        socket.emit("error", { message: "Invalid location data" });
        return;
      }

      try {
        const { orderId, location } = data;
        console.log(`📍 Location update for order ${orderId}:`, location);

        // Update order in database
        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          {
            $set: {
              deliveryLocation: {
                type: "Point",
                coordinates: [location.lng, location.lat],
              },
              lastLocationUpdate: new Date(),
            },
          },
          { new: true }
        );

        if (!updatedOrder) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        // Notify user about location update
        if (updatedOrder.userId) {
          io.to(`user:${updatedOrder.userId}`).emit("location_updated", {
            orderId,
            location: {
              lat: location.lat,
              lng: location.lng,
            },
            timestamp: new Date(),
          });
        }

        socket.emit("location_update_success");
      } catch (err) {
        console.error(`❌ Error updating location:`, err);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    /**
     * Handle order status updates
     * Payload: { orderId: String, status: String }
     */
    socket.on("update_order_status", async (data) => {
      if (!socket.partnerId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      if (!data?.orderId || !data?.status) {
        socket.emit("error", { message: "Order ID and status are required" });
        return;
      }

      try {
        const { orderId, status } = data;
        console.log(`🔄 Status update for order ${orderId}: ${status}`);

        // Update order in database
        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          {
            $set: {
              status,
              statusUpdatedAt: new Date(),
            },
          },
          { new: true }
        );

        if (!updatedOrder) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        // Notify user about status update
        if (updatedOrder.userId) {
          io.to(`user:${updatedOrder.userId}`).emit("status_updated", {
            orderId,
            status,
            timestamp: new Date(),
          });
        }

        socket.emit("status_update_success");
      } catch (err) {
        console.error(`❌ Error updating order status:`, err);
        socket.emit("error", { message: "Failed to update order status" });
      }
    });

    /**
     * Handle user subscribing to order updates
     * Payload: { orderId: String }
     */
    socket.on("subscribe_to_order", async (data) => {
      if (!socket.userId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      if (!data?.orderId) {
        socket.emit("error", { message: "Order ID is required" });
        return;
      }

      try {
        const { orderId } = data;
        
        // Join order-specific room
        socket.join(`order:${orderId}`);
        console.log(`👂 User ${socket.userId} subscribed to order ${orderId}`);
        
        // Send initial order data
        const order = await Order.findById(orderId);
        if (order) {
          socket.emit("order_data", {
            orderId,
            status: order.status,
            deliveryLocation: order.deliveryLocation?.coordinates
              ? {
                  lat: order.deliveryLocation.coordinates[1],
                  lng: order.deliveryLocation.coordinates[0],
                }
              : null,
            lastUpdated: order.statusUpdatedAt || order.updatedAt,
          });
        }
        
        socket.emit("subscription_success", { orderId });
      } catch (err) {
        console.error(`❌ Error subscribing to order:`, err);
        socket.emit("error", { message: "Failed to subscribe to order" });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socketId}`);
      
      // Clean up user connections
      if (socket.userId && connectedUsers.has(socket.userId)) {
        const userSockets = connectedUsers.get(socket.userId);
        userSockets.delete(socketId);
        
        if (userSockets.size === 0) {
          connectedUsers.delete(socket.userId);
        }
      }
      
      // Clean up partner connections
      if (socket.partnerId && connectedPartners.has(socket.partnerId)) {
        const partnerSockets = connectedPartners.get(socket.partnerId);
        partnerSockets.delete(socketId);
        
        if (partnerSockets.size === 0) {
          connectedPartners.delete(socket.partnerId);
        }
      }
    });
  });

  console.log("🚀 Order tracking socket server initialized");
  return io;
}

/**
 * Send order status update to all subscribers
 * @param {String} orderId - The order ID
 * @param {String} status - The new status
 * @returns {Boolean} success
 */
export function broadcastOrderStatusUpdate(orderId, status) {
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized.");
    return false;
  }

  io.to(`order:${orderId}`).emit("status_updated", {
    orderId,
    status,
    timestamp: new Date(),
  });

  console.log(`📢 Broadcasted status update for order ${orderId}: ${status}`);
  return true;
}

/**
 * Send delivery location update to all subscribers
 * @param {String} orderId - The order ID
 * @param {Object} location - The location coordinates { lat, lng }
 * @returns {Boolean} success
 */
export function broadcastLocationUpdate(orderId, location) {
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized.");
    return false;
  }

  io.to(`order:${orderId}`).emit("location_updated", {
    orderId,
    location,
    timestamp: new Date(),
  });

  console.log(`📢 Broadcasted location update for order ${orderId}`);
  return true;
}

/**
 * Get the number of connected users
 * @returns {Number} count
 */
export function getConnectedUsersCount() {
  return connectedUsers.size;
}

/**
 * Get the number of connected partners
 * @returns {Number} count
 */
export function getConnectedPartnersCount() {
  return connectedPartners.size;
}