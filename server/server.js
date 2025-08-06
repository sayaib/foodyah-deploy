// server.js
import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import connectDB from "./config/db.js";
import {
  setupSocketServer,
  sendDeliveryToAllPartners,
} from "./socket/socketServer.js";
import { setupOrderTrackingSocket } from "./socket/orderTrackingSocket.js";

// Routes
import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurant.js";
import fileRoutes from "./routes/files.js";
import menuRoutes from "./routes/menu.js";
import searchRoutes from "./routes/search.js";
import mapRoute from "./routes/map.js";
import paymentRoute from "./routes/payment.js";
import orderRoute from "./routes/order.js";
import taxServiceRoute from "./routes/taxService.js";
import payoutRoute from "./routes/payout.js";
import userRoutes from "./routes/user.js";
import flutterAuth from "./flutter/auth.js";

import socketRoute from "./routes/socketRoute.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app); // Unified server

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/map", mapRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/order", orderRoute);
app.use("/api/user", userRoutes);
app.use("/api/tax-service", taxServiceRoute);
app.use("/api/payout", payoutRoute);
app.use("/api/server", flutterAuth);

app.use("/api/socket", socketRoute);

// Static serving
app.use(express.static("dist"));
app.get("*", (req, res) => {
  res.sendFile("index.html", { root: "dist" });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌐 API + Socket server running on http://localhost:${PORT}`);
  setupSocketServer(server); // Attach delivery partner socket to this server
  setupOrderTrackingSocket(server); // Attach order tracking socket to this server
});
