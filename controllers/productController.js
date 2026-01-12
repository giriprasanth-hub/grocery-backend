const Product = require("../models/Product");

/* ======================================================
   ADMIN APIs
====================================================== */

/**
 * GET ALL ACTIVE PRODUCTS (ADMIN)
 */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};


/**
 * ADD SINGLE PRODUCT (WITH VARIANTS)
 */
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      nameTa,
      category,
      categoryTa,
      image,
      variants
    } = req.body;

    if (!name || !nameTa || !category || !categoryTa || !variants || variants.length === 0) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const product = new Product({
      name,
      nameTa,
      category,
      categoryTa,
      image,
      variants
    });

    await product.save(); // 🔥 auto calculates discount for variants

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};


/**
 * BULK ADD PRODUCTS
 */
exports.addBulkProducts = async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid product array" });
    }

    for (const p of products) {
      const product = new Product(p);
      await product.save(); // triggers variant discount hook
    }

    res.status(201).json({
      message: "Bulk products added successfully",
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      message: "Bulk insert failed",
      error: error.message
    });
  }
};


/**
 * UPDATE PRODUCT
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    Object.assign(product, req.body);
    await product.save(); // 🔥 recalculates discounts

    res.json({ message: "Product updated", product });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};


/**
 * SOFT DELETE PRODUCT
 */
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Product removed" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};


/**
 * LOW STOCK COUNT (All variants)
 */
exports.getLowStockCount = async (req, res) => {
  try {
    const products = await Product.find({ "variants.stock": { $lte: 5 } });
    res.json({ count: products.length });
  } catch {
    res.status(500).json({ message: "Failed to fetch low stock" });
  }
};


/* ======================================================
   CUSTOMER APIs (FLUTTER)
====================================================== */

/**
 * CUSTOMER PRODUCTS API
 */
exports.getActiveProductsForCustomer = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });

    const formatted = products.map(p => {
      // If variants exist use them, else fallback to flat product
      if (p.variants && p.variants.length > 0) {
        return {
          _id: p._id,
          name: p.name,
          category: p.category,
          image: p.image,
          variants: p.variants
        };
      } else {
        return {
          _id: p._id,
          name: p.name,
          category: p.category,
          image: p.image,
          variants: [
            {
              weight: "1 unit",
              mrp: p.mrp,
              price: p.sellingPrice,
              stock: p.stock,
              discountAmount: p.mrp - p.sellingPrice,
              discountPercent: Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100)
            }
          ]
        };
      }
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Failed to load products" });
  }
};
