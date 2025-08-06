import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  label: { type: String, enum: ["Home", "Work", "Other"], default: "Other" },
  addressLine: { type: String },
  fullAddress: { type: String, required: true },
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

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: {
    type: String,
    enum: ["user", "admin", "restaurant", "delivery"],
    default: "user",
  },
  otp: String,
  isVerified: { type: Boolean, default: false },

  // For restaurants linked to user (if role = restaurant)
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },

  // New: Array of saved addresses
  addresses: [addressSchema],
});

userSchema.index({ "addresses.location": "2dsphere" });

export default mongoose.model("User", userSchema);
