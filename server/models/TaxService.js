import mongoose from "mongoose";

const taxServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { 
      type: String, 
      required: true, 
      enum: ["tax", "platform_fee", "delivery_fee"] 
    },
    value: { type: Number, required: true },
    valueType: { 
      type: String, 
      required: true, 
      enum: ["percentage", "fixed"] 
    },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    // For distance-based delivery fees
    distanceRange: {
      min: { type: Number }, // in kilometers
      max: { type: Number }  // in kilometers
    },
    // For time-based fees (e.g., peak hours)
    timeRange: {
      startTime: { type: String }, // Format: "HH:MM"
      endTime: { type: String }    // Format: "HH:MM"
    },
    // For location-based taxes
    applicableRegions: [{ type: String }], // e.g., city names, zip codes
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("TaxService", taxServiceSchema);