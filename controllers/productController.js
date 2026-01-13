const Product = require("../models/Product");
const Category = require("../models/Category");


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
    const { name, nameTa, category, categoryTa, image, variants } = req.body;

    if (!name || !nameTa || !category || !categoryTa || !variants || variants.length === 0) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔥 Auto create category if not exists
    await Category.findOneAndUpdate(
      { name: category },
      { name: category, isActive: true },
      { upsert: true }
    );

    const product = new Product({
      name,
      nameTa,
      category,
      categoryTa,
      image,
      variants
    });

    await product.save();

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
      if (!p.name || !p.nameTa || !p.category || !p.categoryTa || !Array.isArray(p.variants)) {
        throw new Error("Missing fields in one or more products");
      }

      // 🔥 Auto-create category
      await Category.findOneAndUpdate(
        { name: p.category },
        { name: p.category, isActive: true },
        { upsert: true }
      );

      const product = new Product({
        name: p.name,
        nameTa: p.nameTa,
        category: p.category,
        categoryTa: p.categoryTa,
        image: p.image || "",
        variants: p.variants
      });

      await product.save();
    }

    res.status(201).json({ message: "Bulk products added successfully" });
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

    const formatted = products.map(p => ({
      _id: p._id,
      name: p.name,
      nameTa: p.nameTa,
      category: p.category,
      categoryTa: p.categoryTa,
      image: p.image,
      variants: p.variants.map(v => ({
        weight: v.weight,
        mrp: v.mrp,
        price: v.sellingPrice,
        discountAmount: v.discountAmount,
        discountPercent: v.discountPercent,
        stock: v.stock
      }))
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load products" });
  }
};




exports.syncCategoriesFromProducts = async (req, res) => {
  try {
    const products = await Product.find({}, "category");

    const uniqueCategories = [...new Set(products.map(p => p.category))];

    for (const name of uniqueCategories) {
      await Category.findOneAndUpdate(
        { name },
        { name, isActive: true },
        { upsert: true }
      );
    }

    res.json({
      message: "Categories synced successfully",
      categories: uniqueCategories
    });
  } catch (err) {
    res.status(500).json({ message: "Sync failed", error: err.message });
  }
};