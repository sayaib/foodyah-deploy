// socket/socketServer.js
import { Server } from "socket.io";
import Order from "../models/Order.js";

const connectedPartners = new Map();
let io = null;

export function setupSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const partnerId = socket.handshake.query.partnerId;

    console.log("✅ Partner connected:");
    console.log("  • Socket ID:", socket.id); // Random auto-generated
    console.log("  • Partner ID:", partnerId); // Your custom ID
    console.log(`✅ Partner connected: ${socket.id}`);
    connectedPartners.set(socket.id, { connectedAt: new Date() });

    // socket.on("locationUpdate", async (location) => {
    //   console.log(`📍 Location from ${socket.id}:`, location);

    //   try {
    //     const updatedOrder = await Order.findOneAndUpdate(
    //       { _id: "688b8d9b7a3aa451549590d5" },
    //       {
    //         $set: {
    //           deliveryLocation: {
    //             type: "Point",
    //             coordinates: [location?.longitude, location?.latitude],
    //           },
    //         },
    //       },
    //       { new: true }
    //     );

    //     if (updatedOrder) {
    //       console.log(`✅ Order updated with delivery location`);
    //     } else {
    //       console.warn(`⚠️ Order  not found`);
    //     }
    //   } catch (err) {
    //     console.error("❌ Failed to update deliveryLocation:", err);
    //   }
    // });

    socket.on("updateLocation", async (location) => {
      console.log("Dd", location);
      try {
        const updatedOrder = await Order.findOneAndUpdate(
          { customer_email: "sayaib.osl@gmail.com" },
          {
            $set: {
              deliveryLocation: {
                type: "Point",
                coordinates: [location?.lon, location?.lat],
              },
            },
          },
          { new: true }
        );

        if (updatedOrder) {
          console.log(`✅ Order updated with delivery location`);
        } else {
          console.warn(`⚠️ Order  not found`);
        }
      } catch (err) {
        console.error("❌ Failed to update deliveryLocation:", err);
      }

      // let longitude = location?.longitude;
      // let latitude = location?.latitude;
      // // Base location from partner

      // // Add a tiny offset based on socketId hash for testing uniqueness
      // const hash = [...socket.id].reduce(
      //   (acc, ch) => acc + ch.charCodeAt(0),
      //   0
      // );
      // // Generate small random offset: ±0.0005 to ±0.0015
      // const randomOffset = () => (Math.random() * 0.001 - 0.0005).toFixed(6); // Example: 0.000263

      // const modifiedLat = latitude + parseFloat(randomOffset());
      // const modifiedLng = longitude + parseFloat(randomOffset());

      // try {
      //   const updatedOrder = await Order.findOneAndUpdate(
      //     { _id: "688bd37d89f84bb35c14d767" }, // Make sure this is an ObjectId if needed
      //     {
      //       $set: {
      //         deliveryLocation: {
      //           type: "Point",
      //           coordinates: [modifiedLng, modifiedLat],
      //         },
      //       },
      //     },
      //     { new: true }
      //   );

      //   if (updatedOrder) {
      //     console.log(`✅ Order  updated with modified delivery location`);
      //     console.log(`🧭 New Location: [${modifiedLng}, ${modifiedLat}]`);
      //   } else {
      //     console.warn(`⚠️ Order not found`);
      //   }
      // } catch (err) {
      //   console.error("❌ Failed to update deliveryLocation:", err);
      // }
    });

    socket.on("accept_order", (data) => {
      console.log(`📦 Order accepted by ${socket.id}:`, data);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Partner disconnected: ${socket.id}`);
      connectedPartners.delete(socket.id);
    });
  });

  console.log("🚀 Socket.IO server initialized");
}

export function sendDeliveryToAllPartners(orderData) {
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized yet.");
    return 0;
  }

  let sentCount = 0;
  connectedPartners.forEach((_info, socketId) => {
    io.to(socketId).emit("delivery_request", orderData);
    console.log(`📨 Sent delivery request to ${socketId}`);
    sentCount++;
  });

  return sentCount;
}
