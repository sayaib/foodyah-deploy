import dotenv from "dotenv"; // Load .env once at the entry point
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurant.js";
import fileRoutes from "./routes/files.js";
import menuRoutes from "./routes/menu.js";
import searchRoutes from "./routes/search.js";
import mapRoute from "./routes/map.js";

import connectDB from "./config/db.js";

// flutter routes

import flutterAuth from "./flutter/auth.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/map", mapRoute);

app.use("/api/server", flutterAuth);

// Serve static files from the 'dist' directory
// Serve static files from the dist folder
app.use(express.static("dist"));

// For all other routes, serve index.html (for SPA routing)
app.get("*", (req, res) => {
  res.sendFile("index.html", { root: "dist" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
