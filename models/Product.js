// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "electronics",
      "clothing",
      "home&garden",
      "sports",
      "books",
      "toys",
      "food",
      "beauty",
      "other",
    ],
    lowercase: true,
  },
  images: {
    type: [String],
    default: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    ],
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual to use title if exists, otherwise use name
productSchema.virtual("displayTitle").get(function () {
  return this.title || this.name;
});

// Update the updatedAt field before saving
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  // Sync title with name if title is not set
  if (!this.title && this.name) {
    this.title = this.name;
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
