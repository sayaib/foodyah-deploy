// models/Restaurant.js
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  label: { type: String },
  addressLine: { type: String, required: true },
  city: String,
  state: String,
  country: String,
  pincode: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  isDefault: { type: Boolean, default: false },
});

// for geo queries

const RestaurantSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  email: String,
  phone: String,

  cuisine_types: String,
  menu_images: [{ type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }],
  logo_images: [{ type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }],
  theme_images: [
    { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
  ],

  documents: {
    fssai: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
    gst: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
  },
  status: {
    type: String,
    enum: ["pending", "active", "suspended", "rejected"],
    default: "pending",
  },

  commission_percentage: {
    type: Number,
    default: 15,
  },

  rating: {
    type: Number,
    default: 0,
  },

  total_orders: {
    type: Number,
    default: 0,
  },
  menu: [],
  bank_details: {
    account_holder: { type: String },
    account_number: { type: String },
    ifsc: { type: String },
  },
  registration_date: {
    type: Date,
    default: Date.now,
  },
  // New: Array of saved addresses
  addresses: [addressSchema],
});

RestaurantSchema.index({ "addresses.location": "2dsphere" });

export default mongoose.model("Restaurant", RestaurantSchema);
