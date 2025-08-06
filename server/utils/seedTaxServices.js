import mongoose from "mongoose";
import dotenv from "dotenv";
import TaxService from "../models/TaxService.js";
import connectDB from "../config/db.js";

dotenv.config();

// Connect to database
connectDB();

// Default tax and service fee data
const taxServiceData = [
  {
    name: "GST",
    type: "tax",
    value: 5,
    valueType: "percentage",
    description: "Goods and Services Tax",
    isActive: true
  },
  {
    name: "Service Tax",
    type: "tax",
    value: 3,
    valueType: "percentage",
    description: "Service Tax on food delivery",
    isActive: true
  },
  {
    name: "Distance Tax",
    type: "tax",
    value: 0.5,
    valueType: "fixed",
    description: "Distance-based tax per km",
    isActive: true
  },
  {
    name: "Platform Fee",
    type: "platform_fee",
    value: 2,
    valueType: "percentage",
    description: "Fee for using the platform",
    isActive: true
  },
  {
    name: "Base Delivery Fee",
    type: "delivery_fee",
    value: 20,
    valueType: "fixed",
    description: "Base delivery fee for all orders",
    isActive: true
  },
  {
    name: "Per Kilometer Fee",
    type: "delivery_fee",
    value: 2,
    valueType: "fixed",
    description: "Delivery fee per km",
    isActive: true
  },
  {
    name: "Short Distance Fee",
    type: "delivery_fee",
    value: 10,
    valueType: "fixed",
    description: "Delivery fee for short distances",
    isActive: true,
    distanceRange: {
      min: 0,
      max: 3
    }
  },
  {
    name: "Medium Distance Fee",
    type: "delivery_fee",
    value: 20,
    valueType: "fixed",
    description: "Delivery fee for medium distances",
    isActive: true,
    distanceRange: {
      min: 3,
      max: 7
    }
  },
  {
    name: "Long Distance Fee",
    type: "delivery_fee",
    value: 35,
    valueType: "fixed",
    description: "Delivery fee for long distances",
    isActive: true,
    distanceRange: {
      min: 7,
      max: 15
    }
  },
  {
    name: "Peak Hour Fee",
    type: "delivery_fee",
    value: 15,
    valueType: "fixed",
    description: "Additional fee during peak hours",
    isActive: true,
    timeRange: {
      startTime: "18:00",
      endTime: "21:00"
    }
  }
];

// Seed function
const seedTaxServices = async () => {
  try {
    // Clear existing data
    await TaxService.deleteMany({});
    console.log("Cleared existing tax and service fee data");

    // Insert new data
    const result = await TaxService.insertMany(taxServiceData);
    console.log(`Successfully seeded ${result.length} tax and service fee records`);

    // Exit process
    process.exit(0);
  } catch (error) {
    console.error("Error seeding tax and service fee data:", error);
    process.exit(1);
  }
};

// Run the seed function
seedTaxServices();