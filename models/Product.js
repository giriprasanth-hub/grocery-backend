const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    // 💰 Pricing
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

    discountAmount: {
      type: Number,
      default: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
    },

    // 📦 Inventory
    stock: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  this.discountAmount = this.mrp - this.sellingPrice;

  if (this.mrp > 0) {
    this.discountPercent = Math.round(
      (this.discountAmount / this.mrp) * 100
    );
  } else {
    this.discountPercent = 0;
  }

  next();
});

module.exports = mongoose.model('Product', productSchema);
