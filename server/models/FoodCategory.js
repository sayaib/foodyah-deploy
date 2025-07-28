// models/FoodCategory.js
import mongoose from "mongoose";

const foodCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model("FoodCategory", foodCategorySchema);
