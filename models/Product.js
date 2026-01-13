const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  weight: { type: String, required: true },
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },

  discountAmount: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 }
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

// 🔥 CALCULATE DISCOUNT FOR EACH VARIANT SAFELY
productSchema.pre("save", function (next) {
  this.variants.forEach(v => {
    if (v.mrp > 0 && v.sellingPrice > 0) {
      v.discountAmount = v.mrp - v.sellingPrice;
      v.discountPercent = Math.round((v.discountAmount / v.mrp) * 100);
    } else {
      v.discountAmount = 0;
      v.discountPercent = 0;
    }
  });

  next();
});

module.exports = mongoose.model("Product", productSchema);
