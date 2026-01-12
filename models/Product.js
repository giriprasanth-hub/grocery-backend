const mongoose = require("mongoose");

/**
 * Each product has multiple weight variants
 * Example: 250g, 500g, 1kg
 */
const variantSchema = new mongoose.Schema({
  weight: {
    type: String,
    required: true, // "250g", "500g", "1kg"
  },

  mrp: {
    type: Number,
    required: true,
  },

  sellingPrice: {
    type: Number,
    required: true,
  },

  purchasePrice: {
    type: Number,
    required: true,
  },

  stock: {
    type: Number,
    required: true,
    min: 0,
  },

  discountAmount: {
    type: Number,
    default: 0,
  },

  discountPercent: {
    type: Number,
    default: 0,
  },
});

/**
 * Auto calculate discount per variant
 */


/**
 * Main product schema
 */
const productSchema = new mongoose.Schema(
  {
    // English name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Tamil name
    nameTa: {
      type: String,
      required: true,
    },

    // English category
    category: {
      type: String,
      required: true,
    },

    // Tamil category
    categoryTa: {
      type: String,
      required: true,
    },

    // Image URL
    image: {
      type: String,
      default: "",
    },

    // Weight variants
    variants: {
      type: [variantSchema],
      validate: [
        (v) => v.length > 0,
        "At least one variant is required",
      ],
    },

    // Soft delete
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
productSchema.pre("save", function (next) {
  this.variants.forEach(v => {
    if (v.mrp > 0 && v.sellingPrice > 0) {
      v.discountAmount = v.mrp - v.sellingPrice;
      v.discountPercent = Math.round(
        (v.discountAmount / v.mrp) * 100
      );
    } else {
      v.discountAmount = 0;
      v.discountPercent = 0;
    }
  });
  next();
});


module.exports = mongoose.model("Product", productSchema);
