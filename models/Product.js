const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  weight: { type: String, required: true },   // 250g, 500g, 1kg
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },

  discountAmount: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 }
});

// 🔥 Auto-calculate discount for each variant
variantSchema.pre("save", function (next) {
  if (this.mrp > 0 && this.sellingPrice > 0) {
    this.discountAmount = this.mrp - this.sellingPrice;
    this.discountPercent = Math.round((this.discountAmount / this.mrp) * 100);
  } else {
    this.discountAmount = 0;
    this.discountPercent = 0;
  }
  next();
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameTa: { type: String, required: true },

    category: { type: String, required: true },
    categoryTa: { type: String, required: true },

    image: { type: String, default: "" },

    variants: [variantSchema],

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
